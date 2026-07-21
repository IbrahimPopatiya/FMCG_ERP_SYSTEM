interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-lg bg-white p-4 sm:rounded-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-800">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
