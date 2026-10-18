import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-grid text-ink",
        correct: "bg-correct-soft text-correct",
        wrong: "bg-wrong-soft text-wrong",
        unsure: "bg-unsure-soft text-unsure-ink",
        accent: "bg-accent-soft text-accent",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
