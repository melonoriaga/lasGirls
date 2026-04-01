import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-none border px-5 text-sm font-semibold uppercase tracking-[0.08em] transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variant === "primary" &&
          "border-black bg-[#ff3ea5] text-black hover:-translate-y-0.5 hover:bg-[#ff6ebe]",
        variant === "outline" &&
          "border-black bg-transparent text-black hover:-translate-y-0.5 hover:bg-black hover:text-white",
        variant === "ghost" && "border-transparent bg-transparent text-black hover:bg-black/5",
        className,
      )}
      {...props}
    />
  );
}
