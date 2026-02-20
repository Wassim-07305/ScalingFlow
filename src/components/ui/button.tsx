import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-neon-orange text-white shadow-[0_0_20px_rgba(255,107,44,0.3),0_0_60px_rgba(255,107,44,0.1)] hover:shadow-[0_0_30px_rgba(255,107,44,0.5),0_0_80px_rgba(255,107,44,0.2)] hover:brightness-110",
        secondary:
          "border border-neon-blue text-neon-blue bg-transparent hover:bg-neon-blue-glow",
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
        destructive:
          "bg-neon-red text-white hover:bg-neon-red/90 shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        outline:
          "border border-border-default text-text-primary bg-transparent hover:border-border-hover hover:bg-bg-tertiary",
        link: "text-neon-blue underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
