// ===== HISTORY MODAL COMPONENT =====
// Shows a list of past translations. Users can re-load them or delete them.

"use client";

import { HistoryItem } from "@/lib/types";
import { Trash2, Clock, Code, ChevronRight } from "lucide-react";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function HistoryModal({
  isOpen,
  onClose,
  items,
  onSelect,
  onDelete,
  onClear,
}: HistoryModalProps) {
  if (!isOpen) return null;

  // Format date to something readable
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Translation History
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {items.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
              <Clock className="w-12 h-12 mb-4 opacity-20" />
              <p>No translations yet.</p>
              <p className="text-xs">Your past work will appear here.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="group relative flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-500">
                    <Code className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                        {item.language}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate font-mono">
                      {item.code.split('\n')[0].substring(0, 60)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-[10px] text-slate-400 text-center">
            Last {items.length} of {50} items stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
