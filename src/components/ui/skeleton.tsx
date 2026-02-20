import { cn } from "@/lib/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[12px] bg-bg-tertiary animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
