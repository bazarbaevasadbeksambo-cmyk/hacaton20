import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-[12px] border border-grid bg-surface p-4 sm:p-6", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-4 flex items-start justify-between gap-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-base font-semibold text-ink", className)} {...props} />;
}

export function CardLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs font-semibold uppercase tracking-wider text-ink-soft", className)}
      {...props}
    />
  );
}
