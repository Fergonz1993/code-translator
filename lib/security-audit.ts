// ===== SECURITY HEADERS AUDIT =====
// Audit and validate security headers compliance.

export interface SecurityHeaderAudit {
  header: string;
  present: boolean;
  value?: string;
  recommendation: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  compliant: boolean;
}

export interface AuditResult {
  score: number;
  maxScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  headers: SecurityHeaderAudit[];
  recommendations: string[];
}

const REQUIRED_HEADERS: Array<{
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  validator: (value: string | undefined) => { compliant: boolean; recommendation: string };
}> = [
  {
    name: 'Content-Security-Policy',
    severity: 'critical',
    validator: (value) => {
      if (!value) return { compliant: false, recommendation: 'Add CSP header with strict policy' };
      const hasUnsafeInline = value.includes("'unsafe-inline'") && !value.includes('nonce-');
      const hasUnsafeEval = value.includes("'unsafe-eval'");
      if (hasUnsafeEval) return { compliant: false, recommendation: "Remove 'unsafe-eval' from script-src" };
      if (hasUnsafeInline) return { compliant: false, recommendation: "Use nonce or hash instead of 'unsafe-inline'" };
      return { compliant: true, recommendation: 'CSP is properly configured' };
    },
  },
  {
    name: 'X-Content-Type-Options',
    severity: 'high',
    validator: (value) => ({
      compliant: value === 'nosniff',
      recommendation: value === 'nosniff' ? 'Properly configured' : "Set to 'nosniff'",
    }),
  },
  {
    name: 'X-Frame-Options',
    severity: 'high',
    validator: (value) => ({
      compliant: value === 'DENY' || value === 'SAMEORIGIN',
      recommendation: value ? 'Properly configured' : "Set to 'DENY' or 'SAMEORIGIN'",
    }),
  },
  {
    name: 'Strict-Transport-Security',
    severity: 'critical',
    validator: (value) => {
      if (!value) return { compliant: false, recommendation: 'Add HSTS header' };
      const hasMaxAge = /max-age=(\d+)/.exec(value);
      const maxAge = hasMaxAge ? parseInt(hasMaxAge[1], 10) : 0;
      if (maxAge < 31536000) return { compliant: false, recommendation: 'Set max-age to at least 1 year (31536000)' };
      return { compliant: true, recommendation: 'HSTS is properly configured' };
    },
  },
  {
    name: 'Referrer-Policy',
    severity: 'medium',
    validator: (value) => {
      const safe = ['no-referrer', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin'];
      return {
        compliant: value ? safe.includes(value) : false,
        recommendation: value && safe.includes(value) ? 'Properly configured' : 'Set to strict-origin-when-cross-origin',
      };
    },
  },
  {
    name: 'Permissions-Policy',
    severity: 'medium',
    validator: (value) => ({
      compliant: !!value,
      recommendation: value ? 'Properly configured' : 'Add Permissions-Policy to restrict browser features',
    }),
  },
  {
    name: 'X-XSS-Protection',
    severity: 'low',
    validator: (value) => ({
      compliant: value === '1; mode=block' || value === '0', // 0 is acceptable if CSP is present
      recommendation: 'Legacy header, CSP provides better protection',
    }),
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    severity: 'medium',
    validator: (value) => ({
      compliant: value === 'require-corp' || value === 'credentialless',
      recommendation: value ? 'Properly configured' : "Set to 'require-corp' for cross-origin isolation",
    }),
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    severity: 'medium',
    validator: (value) => ({
      compliant: value === 'same-origin' || value === 'same-origin-allow-popups',
      recommendation: value ? 'Properly configured' : "Set to 'same-origin' for isolation",
    }),
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    severity: 'medium',
    validator: (value) => ({
      compliant: value === 'same-origin' || value === 'same-site',
      recommendation: value ? 'Properly configured' : "Set to 'same-origin' to prevent cross-origin reads",
    }),
  },
];

/**
 * Audit security headers from a response.
 */
export function auditSecurityHeaders(headers: Record<string, string | undefined>): AuditResult {
  const audits: SecurityHeaderAudit[] = [];
  let score = 0;
  const recommendations: string[] = [];

  for (const { name, severity, validator } of REQUIRED_HEADERS) {
    const value = headers[name.toLowerCase()] || headers[name];
    const { compliant, recommendation } = validator(value);
    
    audits.push({
      header: name,
      present: !!value,
      value,
      recommendation,
      severity,
      compliant,
    });

    if (compliant) {
      score += severity === 'critical' ? 20 : severity === 'high' ? 15 : severity === 'medium' ? 10 : 5;
    } else {
      recommendations.push(`${name}: ${recommendation}`);
    }
  }

  const maxScore = 100;
  const percentage = (score / maxScore) * 100;
  
  let grade: AuditResult['grade'];
  if (percentage >= 95) grade = 'A+';
  else if (percentage >= 85) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 55) grade = 'C';
  else if (percentage >= 40) grade = 'D';
  else grade = 'F';

  return { score, maxScore, grade, headers: audits, recommendations };
}

/**
 * Generate a security headers report in markdown format.
 */
export function generateSecurityReport(audit: AuditResult): string {
  const lines = [
    '# Security Headers Audit Report',
    '',
    `**Score:** ${audit.score}/${audit.maxScore} (Grade: ${audit.grade})`,
    '',
    '## Headers',
    '',
    '| Header | Status | Severity | Recommendation |',
    '|--------|--------|----------|----------------|',
  ];

  for (const h of audit.headers) {
    const status = h.compliant ? '✅' : '❌';
    lines.push(`| ${h.header} | ${status} | ${h.severity} | ${h.recommendation} |`);
  }

  if (audit.recommendations.length > 0) {
    lines.push('', '## Recommendations', '');
    for (const rec of audit.recommendations) {
      lines.push(`- ${rec}`);
    }
  }

  return lines.join('\n');
}
