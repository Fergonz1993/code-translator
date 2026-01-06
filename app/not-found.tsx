// ===== 404 NOT FOUND PAGE =====
// Custom 404 page with helpful navigation.

"use client";

import Link from "next/link";
import { Home, ArrowLeft, Code } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-slate-100 dark:bg-slate-800">
          <Code className="w-10 h-10 text-slate-400" />
        </div>

        {/* 404 */}
        <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-2">
          404
        </h1>

        {/* Title */}
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Page not found
        </h2>

        {/* Description */}
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          It might have been moved or doesn&apos;t exist.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
