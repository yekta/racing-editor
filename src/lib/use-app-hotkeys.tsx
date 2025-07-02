import { TFrameStamps } from "@/components/editor/types";
import { Dispatch, SetStateAction } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type TProps = {
  togglePlayPause: () => void;
  goToPrevFrame: () => void;
  goToNextFrame: () => void;
  jumpToPrevIndicator: () => void;
  jumpToNextIndicator: () => void;
  sliderValue: number[];
  frameStamps: TFrameStamps;
  setFrameStamps: Dispatch<SetStateAction<TFrameStamps>>;
};

export default function useAppHotkeys({
  togglePlayPause,
  goToPrevFrame,
  goToNextFrame,
  jumpToPrevIndicator,
  jumpToNextIndicator,
  frameStamps,
  setFrameStamps,
  sliderValue,
}: TProps) {
  useHotkeys("space", togglePlayPause, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
    preventDefault: true,
  });

  useHotkeys("arrowleft", goToPrevFrame, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys("arrowright", goToNextFrame, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys("shift+arrowleft", jumpToPrevIndicator, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys("shift+arrowright", jumpToNextIndicator, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys(
    "backspace,delete",
    () => {
      if (sliderValue[0] === frameStamps.start) {
        setFrameStamps((prev) => ({
          ...prev,
          start: null,
        }));
        return;
      }
      if (sliderValue[0] === frameStamps.end) {
        setFrameStamps((prev) => ({
          ...prev,
          end: null,
        }));
        return;
      }
      if (frameStamps.sectors.includes(sliderValue[0])) {
        setFrameStamps((prev) => ({
          ...prev,
          sectors: prev.sectors.filter((s) => s !== sliderValue[0]),
        }));
        return;
      }
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: false,
    }
  );
}
