// ===== SHARE BUTTON COMPONENT =====
// Share translation link via Web Share API or clipboard.

"use client";

import { useState } from "react";
import { Share2, Check, Link, Twitter } from "lucide-react";

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

export function ShareButton({
  title = "Code Translation",
  text = "Check out this code translation!",
  url = typeof window !== "undefined" ? window.location.href : "",
  className = "",
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or error, fall back to menu
      }
    }

    // Show share menu
    setShowMenu(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const handleTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, "_blank");
    setShowMenu(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleShare}
        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        title="Share"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {/* Share menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-48 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={handleTwitter}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Twitter className="w-4 h-4" />
              Share on Twitter
            </button>
          </div>
        </>
      )}
    </div>
  );
}
