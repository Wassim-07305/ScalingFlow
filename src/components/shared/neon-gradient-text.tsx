import { cn } from "@/lib/utils/cn";

interface NeonGradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export function NeonGradientText({
  children,
  className,
  as: Component = "span",
}: NeonGradientTextProps) {
  return (
    <Component
      className={cn(
        "text-accent font-semibold",
        className
      )}
    >
      {children}
    </Component>
  );
}
