import { TFrameStamps, TVideoProperties } from "@/components/editor/types";
import { cn } from "@/lib/utils";
import { FlagIcon, MapPinIcon, RocketIcon } from "lucide-react";
import { FC } from "react";

export default function Indicators({
  frameStamps,
  videoProperties,
}: {
  frameStamps: TFrameStamps;
  videoProperties: TVideoProperties;
}) {
  return (
    <>
      {frameStamps.start !== null && (
        <Indicator
          frame={frameStamps.start}
          videoProperties={videoProperties}
          className="bg-progress"
          Icon={RocketIcon}
          classNameIcon="bg-progress"
        />
      )}
      {frameStamps.end !== null && (
        <Indicator
          frame={frameStamps.end}
          videoProperties={videoProperties}
          className="bg-success"
          Icon={FlagIcon}
          classNameIcon="bg-success"
        />
      )}
      {frameStamps.sectors.map((sector, index) => (
        <Indicator
          key={index}
          frame={sector}
          videoProperties={videoProperties}
          className="bg-warning"
          Icon={MapPinIcon}
          classNameIcon="bg-warning"
        />
      ))}
    </>
  );
}

function Indicator({
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
