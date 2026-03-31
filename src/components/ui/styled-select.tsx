"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  className?: string;
  size?: "default" | "sm";
}

export function StyledSelect({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  name,
  id,
  placeholder = "Select...",
  className,
  size = "default",
}: StyledSelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedOption = options.find((o) => o.value === value);

  const select = useCallback(
    (optValue: string) => {
      if (controlledValue === undefined) setInternalValue(optValue);
      onChange?.(optValue);
      setOpen(false);
    },
    [controlledValue, onChange],
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setFocusedIndex(options.findIndex((o) => o.value === value));
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0) select(options[focusedIndex].value);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-option]");
    items[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex, open]);

  const sizeClasses =
    size === "sm"
      ? "h-7 px-2 text-xs rounded-md"
      : "h-10 px-3 text-sm rounded-lg";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger */}
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen((o) => !o);
          if (!open)
            setFocusedIndex(options.findIndex((o) => o.value === value));
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex w-full items-center justify-between border border-input bg-transparent font-medium text-foreground outline-none transition-all",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "dark:bg-input/30",
          open && "border-ring ring-3 ring-ring/50",
          sizeClasses,
        )}
      >
        <span
          className={cn(!selectedOption && "text-muted-foreground font-normal")}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "ml-2 size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-xl shadow-black/20 ring-1 ring-white/5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1"
        >
          {options.map((opt, i) => (
            <div
              key={opt.value}
              data-option
              role="option"
              aria-selected={opt.value === value}
              onClick={() => select(opt.value)}
              onMouseEnter={() => setFocusedIndex(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
                i === focusedIndex && "bg-primary/10 text-foreground",
                i !== focusedIndex && "text-muted-foreground hover:text-foreground",
                opt.value === value && "font-medium text-primary",
              )}
            >
              <span>{opt.label}</span>
              {opt.value === value && (
                <Check className="size-3.5 text-primary" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
