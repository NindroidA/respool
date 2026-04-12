import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  hex: string;
  hexSecondary?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-10 w-10",
};

const RADIUS = {
  xs: "rounded-full",
  sm: "rounded-full",
  md: "rounded-full",
  lg: "rounded-lg",
};

export function ColorSwatch({
  hex,
  hexSecondary,
  size = "md",
  className,
}: ColorSwatchProps) {
  return (
    <div
      className={cn(
        SIZES[size],
        RADIUS[size],
        "shrink-0 border border-(--border-subtle)",
        className
      )}
      style={{
        background: hexSecondary
          ? `linear-gradient(135deg, ${hex} 50%, ${hexSecondary} 50%)`
          : hex,
      }}
    />
  );
}
