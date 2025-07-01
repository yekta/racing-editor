import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PauseIcon, PlayIcon } from "lucide-react";

type TProps = {
  togglePlayPause: () => void;
  goToPrevFrame: () => void;
  goToNextFrame: () => void;
  isPlaying: boolean;
};

export default function PlayPauseSection({
  togglePlayPause,
  goToPrevFrame,
  goToNextFrame,
  isPlaying,
}: TProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="w-full leading-tight -mt-1 px-1 select-none opacity-0">
        Placeholder
      </p>
      <div className="flex gap-2">
        <Button
          className="size-12 border-none"
          size="icon"
          variant="outline"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <PauseIcon className="size-6" />
          ) : (
            <PlayIcon className="size-6" />
          )}
        </Button>
        <div className="flex">
          <Button
            className="size-12 rounded-r-none border-none"
            size="icon"
            variant="outline"
            onClick={goToPrevFrame}
          >
            <ChevronLeft className="size-6" />
          </Button>
          <Button
            className="size-12 rounded-l-none border-none"
            size="icon"
            variant="outline"
            onClick={goToNextFrame}
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
