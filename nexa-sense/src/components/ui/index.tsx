import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Check, Info, X } from "lucide-react";
import { Link } from "react-router-dom";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "amber" | "green";
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}
export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 tabIndex={-1}>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  to = "/simulador",
  label = "Ir para simulador",
}: {
  title: string;
  description: string;
  to?: string;
  label?: string;
}) {
  return (
    <Panel className="empty-state">
      <span className="empty-icon">
        <Info size={24} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button primary" to={to}>
        {label}
        <ArrowRight size={16} />
      </Link>
    </Panel>
  );
}
export function Dialog({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={id}
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ),
        ];
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-head">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Fechar diálogo"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {description && <p>{description}</p>}
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  onClose,
  onConfirm,
  label = "Confirmar",
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  label?: string;
}) {
  return (
    <Dialog title={title} description={description} onClose={onClose}>
      <div className="dialog-actions">
        <button className="button" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="button primary"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          <Check size={16} />
          {label}
        </button>
      </div>
    </Dialog>
  );
}
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="note">
      <Info size={16} />
      <span>{children}</span>
    </p>
  );
}
