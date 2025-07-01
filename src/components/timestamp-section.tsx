import { getTimeString, getTimeStringFromFrame } from "@/components/helpers";
import { TFrameStamps, TVideoProperties } from "@/components/types";
import { cn } from "@/lib/utils";
import { FlagIcon, MapPinIcon, RocketIcon } from "lucide-react";

type TProps = {
  videoProperties: TVideoProperties;
  frameStamps: TFrameStamps;
  sliderValue: number[];
  isPlaying: boolean;
};

export default function TimestampSection({
  videoProperties,
  sliderValue,
  frameStamps,
  isPlaying,
}: TProps) {
  return (
    <div className="w-full -mt-1 px-1 flex items-center gap-1.5">
      <p className="shrink min-w-0 leading-tight px-1">
        {getTimeStringFromFrame({
          frame: sliderValue[0],
          totalFrames: videoProperties.totalFrames,
          frameRate: videoProperties.frameRate,
        })}
        <span className="px-[0.5ch]">{"/"}</span>
        {getTimeString({
          time: videoProperties.duration,
          maxTime: videoProperties.duration,
        })}{" "}
        <span className="text-muted-foreground">
          (
          {sliderValue[0]
            .toString()
            .padStart(videoProperties.totalFrames.toString().length, "0")}
          <span className="px-[0.5ch]">{"/"}</span>
          {videoProperties.totalFrames})
        </span>
      </p>
      {!isPlaying && (
        <div className="flex flex-wrap gap-1.5">
          {frameStamps.start !== null &&
            sliderValue[0] === frameStamps.start && (
              <Chip
                text="Start"
                Icon={RocketIcon}
                className="bg-progress/15 text-progress"
              />
            )}
          {frameStamps.end !== null && sliderValue[0] === frameStamps.end && (
            <Chip
              text="End"
              Icon={FlagIcon}
              className="bg-success/15 text-success"
            />
          )}
          {frameStamps.sectors.length > 0 &&
            frameStamps.sectors.includes(sliderValue[0]) && (
              <Chip
                text={`Sector ${
                  frameStamps.sectors.findIndex((i) => i === sliderValue[0]) + 1
                }`}
                Icon={MapPinIcon}
                className="bg-warning/15 text-warning"
              />
            )}
        </div>
      )}
    </div>
  );
}

function Chip({
  text,
  Icon,
  className,
}: {
  text: string;
  Icon: React.FC<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-xs -my-1 font-semibold flex items-center gap-1 px-2.5 py-0.75 leading-tight rounded-full",
        className
      )}
    >
      <Icon className="shrink-0 size-3.5 -ml-1" />
      <p className="shrink min-w-0">{text}</p>
    </div>
  );
}
