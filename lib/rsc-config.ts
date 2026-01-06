// ===== REACT SERVER COMPONENTS CONFIG =====
// Configuration for React Server Components and SSR.

/**
 * Server Component boundaries.
 */
export const serverComponents = {
  // These components run on the server only
  serverOnly: [
    'app/page.tsx',
    'app/layout.tsx',
    'components/ServerHeader.tsx',
  ],
  
  // These are client components
  clientOnly: [
    'components/CodePane.tsx',
    'components/SettingsModal.tsx',
    'components/CommandPalette.tsx',
  ],
};

/**
 * Data fetching patterns for RSC.
 */
export const dataFetchingPatterns = {
  // Parallel data fetching
  parallel: `
    async function Page() {
      const [user, posts] = await Promise.all([
        getUser(),
        getPosts(),
      ]);
      return <Content user={user} posts={posts} />;
    }
  `,
  
  // Sequential data fetching
  sequential: `
    async function Page() {
      const user = await getUser();
      const posts = await getPosts(user.id);
      return <Content user={user} posts={posts} />;
    }
  `,
  
  // Streaming with Suspense
  streaming: `
    async function Page() {
      return (
        <Suspense fallback={<Loading />}>
          <AsyncContent />
        </Suspense>
      );
    }
  `,
};

/**
 * Cache configuration for server components.
 */
export const serverCache = {
  // Default revalidation time
  revalidate: 60, // seconds
  
  // Dynamic = no cache
  dynamic: 'force-dynamic',
  
  // Static = cache forever
  static: 'force-static',
};

/**
 * Server action patterns.
 */
export const serverActions = {
  // Form action pattern
  formAction: `
    'use server'
    
    async function submitForm(formData: FormData) {
      const data = Object.fromEntries(formData);
      await saveToDatabase(data);
      revalidatePath('/');
    }
  `,
  
  // Direct mutation
  mutation: `
    'use server'
    
    async function updateItem(id: string, data: unknown) {
      await db.update(id, data);
      revalidateTag('items');
    }
  `,
};

/**
 * RSC payload streaming configuration.
 */
export const streamingConfig = {
  // Enable streaming
  streaming: true,
  
  // Flush after each component
  flushEffects: true,
  
  // Timeout for streaming (ms)
  timeout: 30000,
};

/**
 * Check if running on server.
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if running in RSC context.
 */
export function isRSC(): boolean {
  return isServer() && !('__NEXT_DATA__' in globalThis);
}

/**
 * Server-only import guard.
 */
export function serverOnly(): void {
  if (!isServer()) {
    throw new Error('This module can only be imported on the server');
  }
}

/**
 * Client-only import guard.
 */
export function clientOnly(): void {
  if (isServer()) {
    throw new Error('This module can only be imported on the client');
  }
}
