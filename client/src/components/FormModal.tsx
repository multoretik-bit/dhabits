import type { ReactNode } from "react";
import { X } from "lucide-react";

export default function FormModal({
  title,
  isOpen,
  onClose,
  onSubmit,
  children,
  submitText = "Сохранить",
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  children: ReactNode;
  submitText?: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="form-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="form-modal-title">
        <div className="form-modal-head">
          <h2 id="form-modal-title" className="text-lg font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="icon-button is-small" aria-label="Закрыть"><X className="size-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="form-modal-body">
          {children}
          <div className="form-modal-actions">
            <button type="button" onClick={onClose} className="app-button is-secondary">Отмена</button>
            <button type="submit" className="app-button">{submitText}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
