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
        "bg-clip-text text-transparent bg-gradient-to-r from-neon-orange via-neon-blue to-neon-cyan font-[family-name:var(--font-display)]",
        className
      )}
    >
      {children}
    </Component>
  );
}
