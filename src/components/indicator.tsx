import { TVideoProperties } from "@/components/types";
import { cn } from "@/lib/utils";
import { FC } from "react";

export function Indicator({
  frame,
  videoProperties,
  className,
  Icon,
  classNameIcon,
}: {
  frame: number;
  videoProperties: TVideoProperties;
  className?: string;
  Icon: FC<{ className?: string }>;
  classNameIcon?: string;
}) {
  return (
    <div
      style={{
        left: `${(frame / videoProperties.totalFrames) * 100}%`,
      }}
      className={cn(
        "bg-foreground absolute top-1/2 -translate-y-1/2 h-full w-0.5 -translate-x-1/2 pointer-events-none",
        className
      )}
    >
      <div
        className={cn(
          "absolute top-1/2 p-0.75 -translate-y-1/2 size-5 left-0 -translate-x-1/2 text-background rounded-sm",
          classNameIcon
        )}
      >
        <Icon className="size-full" />
      </div>
    </div>
  );
}
