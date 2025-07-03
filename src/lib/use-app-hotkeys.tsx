import { TFrameStamps } from "@/components/types";
import { Dispatch, SetStateAction } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type TProps = {
  togglePlayPause: () => void;
  goToPrevFrame: () => void;
  goToNextFrame: () => void;
  goToPrevFrameMulti: () => void;
  goToNextFrameMulti: () => void;
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
  goToPrevFrameMulti,
  goToNextFrameMulti,
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

  useHotkeys("shift+arrowleft", goToPrevFrameMulti, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys("shift+arrowright", goToNextFrameMulti, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys("shift+mod+arrowleft", jumpToPrevIndicator, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys("shift+mod+arrowright", jumpToNextIndicator, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys(
    "s",
    () => {
      if (frameStamps.start !== null && sliderValue[0] === frameStamps.start) {
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
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: false,
    }
  );

  useHotkeys(
    "f",
    () => {
      if (frameStamps.end !== null && sliderValue[0] === frameStamps.end) {
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
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: false,
    }
  );

  useHotkeys("d", () => {
    if (frameStamps.sectors.includes(sliderValue[0])) {
      setFrameStamps((prev) => ({
        ...prev,
        sectors: prev.sectors.filter((s) => s !== sliderValue[0]),
      }));
      return;
    }
    if (frameStamps.start !== null && sliderValue[0] <= frameStamps.start) {
      return;
    }
    if (frameStamps.end !== null && sliderValue[0] >= frameStamps.end) {
      return;
    }
    setFrameStamps((prev) => ({
      ...prev,
      sectors: Array.from(new Set([...prev.sectors, sliderValue[0]])).sort(
        (a, b) => {
          return a - b;
        }
      ),
    }));
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
