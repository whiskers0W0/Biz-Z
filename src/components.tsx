import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
export function Bee({
  size = 80,
  happy = false,
}: {
  size?: number;
  happy?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-label="Zee the bee"
      role="img"
    >
      <ellipse
        cx="42"
        cy="47"
        rx="19"
        ry="26"
        transform="rotate(-32 42 47)"
        fill="#fff"
        stroke="#e2c872"
        strokeWidth="3"
      />
      <ellipse
        cx="81"
        cy="46"
        rx="19"
        ry="26"
        transform="rotate(32 81 46)"
        fill="#fff"
        stroke="#e2c872"
        strokeWidth="3"
      />
      <path
        d="M43 34 37 23M76 34 82 22"
        stroke="#34382e"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="36" cy="21" r="5" fill="#34382e" />
      <circle cx="83" cy="20" r="5" fill="#34382e" />
      <path d="m57 104 7 11 7-13" fill="#34382e" />
      <ellipse cx="61" cy="72" rx="37" ry="35" fill="#ffcc35" />
      <path
        d="M29 86c17 11 46 11 65-2l-6 13c-15 12-37 10-50 0Z"
        fill="#34382e"
      />
      <ellipse cx="61" cy="54" rx="34" ry="27" fill="#ffd84d" />
      <path
        d="m23 71-13 8m88-8 12 8"
        stroke="#34382e"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {happy ? (
        <path
          d="M44 53q5-7 10 0M70 53q5-7 10 0"
          stroke="#34382e"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ) : (
        <>
          <ellipse cx="48" cy="52" rx="3.5" ry="5" fill="#34382e" />
          <ellipse cx="75" cy="52" rx="3.5" ry="5" fill="#34382e" />
        </>
      )}
      <path
        d="M55 63q7 8 14-1"
        stroke="#34382e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="39" cy="62" rx="6" ry="3.5" fill="#f6a378" />
      <ellipse cx="83" cy="62" rx="6" ry="3.5" fill="#f6a378" />
    </svg>
  );
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
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const dialog = document.querySelector('[role="dialog"]');
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
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.querySelector<HTMLElement>('[role="dialog"] button')?.focus();
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-shade" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2>{title}</h2>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
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
          <span className="yellow-text">.</span>
        </h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
