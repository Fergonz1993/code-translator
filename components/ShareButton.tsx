'use client';

// ===== SHARE TO SOCIAL =====
// Share translations to social media.

import { useState } from 'react';

interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

export async function share(options: ShareOptions): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(options);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function shareToTwitter(text: string, url?: string): void {
  const params = new URLSearchParams({
    text: text.slice(0, 240),
    ...(url && { url }),
  });
  window.open(`https://twitter.com/intent/tweet?${params}`, '_blank');
}

export async function copyShareableLink(id: string): Promise<string> {
  const url = `${window.location.origin}/share/${id}`;
  await navigator.clipboard.writeText(url);
  return url;
}

export function ShareButton({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  
  const handleShare = async () => {
    const shared = await share({ title, text: `Check out this code explanation: ${title}` });
    if (!shared) setOpen(true);
  };
  
  return (
    <div className="relative">
      <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 text-sm">
        Share
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
          <button onClick={() => { shareToTwitter(title); setOpen(false); }} className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700">
            Twitter/X
          </button>
          <button onClick={() => { copyShareableLink(crypto.randomUUID()); setOpen(false); }} className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700">
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}

export default ShareButton;
