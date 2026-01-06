// ===== API VERSIONING =====
// Handle API version negotiation and routing.

export type APIVersion = 'v1' | 'v2';

export const CURRENT_VERSION: APIVersion = 'v1';
export const SUPPORTED_VERSIONS: APIVersion[] = ['v1'];
export const DEPRECATED_VERSIONS: APIVersion[] = [];

export interface VersionInfo {
  version: APIVersion;
  deprecated: boolean;
  sunsetDate?: string;
  migrationGuide?: string;
}

/**
 * Parse API version from request headers or path.
 */
export function parseVersion(
  headers: Record<string, string | undefined>,
  path?: string
): APIVersion {
  // Check Accept header (preferred)
  const accept = headers['accept'];
  if (accept) {
    const versionMatch = /application\/vnd\.codetranslator\.v(\d+)\+json/.exec(accept);
    if (versionMatch) {
      const version = `v${versionMatch[1]}` as APIVersion;
      if (SUPPORTED_VERSIONS.includes(version)) {
        return version;
      }
    }
  }

  // Check custom version header
  const versionHeader = headers['x-api-version'] || headers['api-version'];
  if (versionHeader && SUPPORTED_VERSIONS.includes(versionHeader as APIVersion)) {
    return versionHeader as APIVersion;
  }

  // Check path prefix (e.g., /api/v2/translate)
  if (path) {
    const pathMatch = /\/api\/(v\d+)\//.exec(path);
    if (pathMatch && SUPPORTED_VERSIONS.includes(pathMatch[1] as APIVersion)) {
      return pathMatch[1] as APIVersion;
    }
  }

  // Default to current version
  return CURRENT_VERSION;
}

/**
 * Get version info including deprecation status.
 */
export function getVersionInfo(version: APIVersion): VersionInfo {
  return {
    version,
    deprecated: DEPRECATED_VERSIONS.includes(version),
    sunsetDate: undefined, // Set when deprecating
    migrationGuide: undefined, // Link to migration docs
  };
}

/**
 * Add version headers to response.
 */
export function addVersionHeaders(
  headers: Headers,
  version: APIVersion
): void {
  headers.set('X-API-Version', version);
  headers.set('X-API-Supported-Versions', SUPPORTED_VERSIONS.join(', '));
  
  const info = getVersionInfo(version);
  if (info.deprecated) {
    headers.set('Deprecation', 'true');
    if (info.sunsetDate) {
      headers.set('Sunset', info.sunsetDate);
    }
    if (info.migrationGuide) {
      headers.set('Link', `<${info.migrationGuide}>; rel="deprecation"`);
    }
  }
}

/**
 * Version-aware response wrapper.
 */
export function versionedResponse<T>(
  data: T,
  version: APIVersion,
  transform?: Record<APIVersion, (data: T) => unknown>
): unknown {
  if (transform && transform[version]) {
    return transform[version](data);
  }
  return data;
}

/**
 * Check if a feature is available in the specified version.
 */
export function isFeatureAvailable(
  feature: string,
  version: APIVersion
): boolean {
  const featureVersions: Record<string, APIVersion[]> = {
    'streaming': ['v1'],
    'batch-translation': ['v1'],
    'multi-file': ['v1'],
  };
  
  return featureVersions[feature]?.includes(version) ?? false;
}

/**
 * Middleware to validate and inject version.
 */
export function withVersion<T extends { version?: APIVersion }>(
  handler: (request: Request, version: APIVersion) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const headers: Record<string, string | undefined> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    
    const version = parseVersion(headers, new URL(request.url).pathname);
    const response = await handler(request, version);
    
    addVersionHeaders(response.headers, version);
    
    return response;
  };
}
