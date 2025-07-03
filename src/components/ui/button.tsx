import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

const buttonVariants = cva(
  "inline-flex max-w-full min-w-0 items-center justify-center gap-1.5 rounded-md font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        destructive:
          "bg-destructive text-background hover:bg-destructive/80 focus-visible:ring-destructive/20",
        success:
          "bg-success text-background hover:bg-success/80 focus-visible:ring-success/20",
        warning:
          "bg-warning text-background hover:bg-warning/80 focus-visible:ring-warning/20",
        progress:
          "bg-progress text-background hover:bg-progress/80 focus-visible:ring-progress/20",
        outline:
          "border bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        "ghost-destructive":
          "text-destructive hover:bg-destructive/20 hover:text-destructive",
        "ghost-progress":
          "text-progress hover:bg-progress/20 hover:text-progress",
        "ghost-warning": "text-warning hover:bg-warning/20 hover:text-warning",
        "ghost-success": "text-success hover:bg-success/20 hover:text-success",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2 has-[>svg]:px-3",
        sm: "rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isPending?: boolean;
  };

function Button({
  className,
  variant,
  size,
  isPending,
  children,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isPending && <LoaderIcon className="size-4.5 animate-spin shrink-0" />}
      {typeof children === "string" ? (
        <p className="shrink min-w-0">{children}</p>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
