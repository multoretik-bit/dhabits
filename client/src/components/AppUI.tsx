import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("page-shell", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div className="min-w-0">
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export type Segment<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
};

export function SegmentedControl<T extends string>({
  value,
  onChange,
  items,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  items: Segment<T>[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("segmented-control", className)} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn("segment-button", active && "is-active")}
          >
            {Icon && <Icon className="size-4" />}
            <span>{item.label}</span>
            {typeof item.count === "number" && <span className="segment-count">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function SectionHeading({
  icon: Icon,
  title,
  meta,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  meta?: string | number;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <Icon className="size-4 text-primary" />}
        <h2>{title}</h2>
        {meta !== undefined && <span className="section-meta">{meta}</span>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("empty-state", compact && "is-compact")}>
      <div className="empty-state-icon"><Icon className="size-5" /></div>
      <div>
        <p className="empty-state-title">{title}</p>
        {description && <p className="empty-state-description">{description}</p>}
      </div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  icon: Icon,
  accent = "var(--primary)",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ color: accent, backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)` }}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        {hint && <p className="metric-hint">{hint}</p>}
      </div>
    </div>
  );
}

export function TextAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-action">
      {children}
      <ArrowRight className="size-4" />
    </button>
  );
}
