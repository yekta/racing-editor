"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  Indicators,
  classNameThumb,
  classNameThumbIndicator,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  Indicators: React.FC;
  classNameThumb?: string;
  classNameThumbIndicator?: string;
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
        ? defaultValue
        : [min, max],
    [value, defaultValue, min, max]
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative h-12 flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden data-[orientation=horizontal]:h-12 rounded-md data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-destructive/10 absolute data-[orientation=horizontal]:h-12 data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      <Indicators />
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "bg-destructive relative ring-ring/50 w-0.5 h-12 rounded-full block focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
            classNameThumb
          )}
        >
          <div
            className={cn(
              "w-2 h-3 absolute left-1/2 top-0 -translate-y-1/2 rounded-t-xs rounded-b-sm -translate-x-1/2 bg-destructive",
              classNameThumbIndicator
            )}
          />
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
