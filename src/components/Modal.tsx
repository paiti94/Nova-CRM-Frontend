// client/src/components/Modal.tsx
import React from 'react';

export interface ModalProps {
  isOpen: boolean;
  title: string | React.ReactNode;
  message?: React.ReactNode;            // ⬅️ string -> ReactNode
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;                // ⬅️ add
  cancelLabel?: string;                 // ⬅️ add
  confirmButtonClass?: string;          // ⬅️ add
  disableConfirm?: boolean;             // ⬅️ add
  children?: React.ReactNode;           // ⬅️ optional extra content slot
}
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmButtonClass = 'bg-blue-600 hover:bg-blue-700',
  disableConfirm = false,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <h3 className="text-lg font-semibold">{title}</h3>

        {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}

        {children && <div className="mt-3">{children}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border px-4 py-2 text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          {onConfirm && (
            <button
              type="button"
              className={`rounded-md px-4 py-2 text-white ${confirmButtonClass}`}
              onClick={onConfirm}
              disabled={disableConfirm}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};