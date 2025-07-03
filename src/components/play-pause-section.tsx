import { TFrameStamps } from "@/components/types";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FlagIcon,
  MapPinIcon,
  PauseIcon,
  PlayIcon,
  RocketIcon,
} from "lucide-react";

type TProps = {
  togglePlayPause: () => void;
  goToPrevFrame: () => void;
  goToNextFrame: () => void;
  isPlaying: boolean;
  frameStamps: TFrameStamps;
  setFrameStamps: React.Dispatch<React.SetStateAction<TFrameStamps>>;
  sliderValue: number[];
};

export default function PlayPauseSection({
  togglePlayPause,
  goToPrevFrame,
  goToNextFrame,
  isPlaying,
  frameStamps,
  setFrameStamps,
  sliderValue,
}: TProps) {
  return (
    <div className="flex self-stretch lg:flex-col gap-2">
      <div className="flex-1 flex gap-2">
        <Button
          className="flex-1 bg-foreground/8"
          variant="ghost"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <PauseIcon className="size-5" />
          ) : (
            <PlayIcon className="size-5" />
          )}
        </Button>
        <Button
          className="flex-1 bg-foreground/8"
          variant="ghost"
          onClick={goToPrevFrame}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <Button
          className="flex-1 bg-foreground/8"
          variant="ghost"
          onClick={goToNextFrame}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
      <div className="flex-1 flex gap-2">
        <Button
          variant="ghost-progress"
          className="flex-1 bg-progress/10"
          type="button"
          onClick={() => {
            if (
              frameStamps.start !== null &&
              sliderValue[0] === frameStamps.start
            ) {
              setFrameStamps((prev) => ({
                ...prev,
                start: null,
              }));
              return;
            }

            setFrameStamps((prev) => ({
              ...prev,
              start: sliderValue[0],
            }));
          }}
        >
          <RocketIcon className="size-5" />
        </Button>
        <Button
          variant="ghost-warning"
          className="flex-1 bg-warning/10"
          disabled={
            (frameStamps.start !== null &&
              sliderValue[0] <= frameStamps.start) ||
            (frameStamps.end !== null && sliderValue[0] >= frameStamps.end)
          }
          type="button"
          onClick={() => {
            if (isPlaying && frameStamps.sectors.includes(sliderValue[0])) {
              return;
            }
            if (frameStamps.sectors.includes(sliderValue[0])) {
              setFrameStamps((prev) => ({
                ...prev,
                sectors: prev.sectors.filter((s) => s !== sliderValue[0]),
              }));
              return;
            }
            setFrameStamps((prev) => ({
              ...prev,
              sectors: Array.from(
                new Set([...prev.sectors, sliderValue[0]])
              ).sort((a, b) => a - b),
            }));
          }}
        >
          <MapPinIcon className="size-5" />
        </Button>
        <Button
          variant="ghost-success"
          className="flex-1 bg-success/10"
          type="button"
          onClick={() => {
            if (
              frameStamps.end !== null &&
              sliderValue[0] === frameStamps.end
            ) {
              setFrameStamps((prev) => ({
                ...prev,
                end: null,
              }));
              return;
            }
            setFrameStamps((prev) => ({
              ...prev,
              end: sliderValue[0],
            }));
          }}
        >
          <FlagIcon className="size-5" />
        </Button>
      </div>
    </div>
  );
}
