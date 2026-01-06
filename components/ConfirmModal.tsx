'use client';

// ===== CONFIRMATION MODAL =====
// Confirm before destructive actions.

import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;
  
  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-white ${variantStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easy confirmation
export function useConfirm() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
    props: Partial<ConfirmModalProps>;
  }>({ isOpen: false, resolve: null, props: {} });
  
  const confirm = (props: Partial<ConfirmModalProps>) => {
    return new Promise<boolean>((resolve) => {
      setState({ isOpen: true, resolve, props });
    });
  };
  
  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ isOpen: false, resolve: null, props: {} });
  };
  
  const handleCancel = () => {
    state.resolve?.(false);
    setState({ isOpen: false, resolve: null, props: {} });
  };
  
  const Modal = () => (
    <ConfirmModal
      isOpen={state.isOpen}
      title={state.props.title || 'Confirm'}
      message={state.props.message || 'Are you sure?'}
      confirmLabel={state.props.confirmLabel}
      cancelLabel={state.props.cancelLabel}
      variant={state.props.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
  
  return { confirm, Modal };
}

export default ConfirmModal;
