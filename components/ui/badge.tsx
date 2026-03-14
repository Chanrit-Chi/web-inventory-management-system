import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        secondary:
          "border-transparent bg-secondary/30 text-secondary-foreground hover:bg-secondary/40 shadow-none",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive dark:text-red-400 hover:bg-destructive/20",
        outline: "text-foreground border-border/50 bg-background/50 backdrop-blur-sm",
        success:
          "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
        neutral:
          "border-muted-foreground/20 bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
