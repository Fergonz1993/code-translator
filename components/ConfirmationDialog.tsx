// ===== CONFIRMATION DIALOG COMPONENT =====
// Reusable confirmation modal for destructive actions.

"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {/* Icon for danger variant */}
        {variant === "danger" && (
          <div className="flex items-center justify-center">
            <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          {description}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Hook for using confirmation dialogs
export function useConfirmation() {
  const [state, setState] = useState<{
    isOpen: boolean;
    config: Omit<ConfirmationDialogProps, "isOpen" | "onClose" | "onConfirm">;
    resolve: ((confirmed: boolean) => void) | null;
  }>({
    isOpen: false,
    config: { title: "", description: "" },
    resolve: null,
  });

  const confirm = (config: Omit<ConfirmationDialogProps, "isOpen" | "onClose" | "onConfirm">) => {
    return new Promise<boolean>((resolve) => {
      setState({ isOpen: true, config, resolve });
    });
  };

  const handleClose = () => {
    state.resolve?.(false);
    setState((s) => ({ ...s, isOpen: false }));
  };

  const handleConfirm = () => {
    state.resolve?.(true);
    setState((s) => ({ ...s, isOpen: false }));
  };

  const dialog = (
    <ConfirmationDialog
      isOpen={state.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...state.config}
    />
  );

  return { confirm, dialog };
}

