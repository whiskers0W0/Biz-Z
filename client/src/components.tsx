import { createPortal } from "react-dom";
import { lockPageScroll } from "./scrollLock";
import { Children, isValidElement, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import beePortrait from "./assets/mascot/bee.png";
import mascotAsset from "./assets/mascot/mascot.png";
import wordmarkAsset from "./assets/brand/logo.png";
import logomarkAsset from "./assets/brand/logomark.png";
export function Bee({ size = 80 }: { size?: number; happy?: boolean }) {
  return <span className="zee-mascot-frame" style={{ width: Math.round(size * 1.2), height: Math.round(size * 1.55) }}><img className="zee-mascot" src={mascotAsset} alt="Zee the bee" /></span>;
}
export function Wordmark() {
  return <img className="brand-wordmark" src={wordmarkAsset} alt="Biz-Z" width={129} height={50} />;
}
export function BrandMark({ size = 45 }: { size?: number }) {
  return <span className="brand-icon-frame" style={{ width: size, height: Math.round(size * 1.35) }} aria-hidden="true"><img src={logomarkAsset} alt="" /></span>;
}
export function Button({
  children,
  onClick,
  variant = "",
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variant}`}
    >
      {children}
    </button>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const nodes = Children.toArray(children);
  const actions = nodes.filter(node => isValidElement(node) && node.type === Button);
  const content = nodes.filter(node => !isValidElement(node) || node.type !== Button);
  const closeRef = useRef(onClose);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== dialogRef.current) return;
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        const items = dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, textarea, select, a[href]",
        );
        if (items?.length) {
          const first = items[0],
            last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    const previous = document.activeElement as HTMLElement;
    document.addEventListener("keydown", handler);
    const unlockScroll = lockPageScroll();
    document.querySelector<HTMLElement>('[role="dialog"] button')?.focus();
    return () => {
      document.removeEventListener("keydown", handler);
      unlockScroll();
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-shade" onClick={onClose}>
      <section
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {content}
        {actions.length > 0 && <div className="modal-actions">{actions}</div>}
      </section>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          {title}
          {!/[.!?]$/.test(title.trim()) && <span className="yellow-text">.</span>}
        </h1>
        <p>{text}</p>
      </div>
    </div>
  );
}

export function LoadingScreen({
  label = "Working on your request…",
  branded = false,
}: {
  label?: string;
  branded?: boolean;
}) {
  useEffect(() => {
    const unlockScroll = lockPageScroll();
    const blockKeys = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    document.addEventListener("keydown", blockKeys, true);
    return () => {
      unlockScroll();
      document.removeEventListener("keydown", blockKeys, true);
    };
  }, []);
  return createPortal(
    <div
      className="loading-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Please wait"
    >
      <div className="loading-card" role="status" aria-live="polite">
        {branded ? <div className="signin-flight" aria-hidden="true"><img src={beePortrait} alt="" /><div className="signin-progress"><span /></div></div> : <span className="loading-spinner" aria-hidden="true" />}
        <h2>{label}</h2>

      </div>
    </div>,
    document.body,
  );
}
