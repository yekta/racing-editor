import { TFrameStamps } from "@/components/types";
import { Button } from "@/components/ui/button";
import { FlagIcon, MapPinIcon, RocketIcon } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

type TProps = {
  frameStamps: TFrameStamps;
  setFrameStamps: Dispatch<SetStateAction<TFrameStamps>>;
  sliderValue: number[];
};

export default function ButtonsBar({
  frameStamps,
  setFrameStamps,
  sliderValue,
}: TProps) {
  return (
    <div className="w-full gap-2 flex flex-wrap">
      <Button
        variant="progress"
        className="font-extrabold px-3 py-1.5 rounded-sm"
        type="button"
        onClick={() => {
          setFrameStamps((prev) => ({
            ...prev,
            start: sliderValue[0],
          }));
        }}
      >
        <RocketIcon className="size-4.5 -ml-0.75" />
        <p>Set Start</p>
      </Button>
      <Button
        variant="success"
        className="font-extrabold px-3 py-1.5 rounded-sm"
        type="button"
        onClick={() => {
          setFrameStamps((prev) => ({
            ...prev,
            end: sliderValue[0],
          }));
        }}
      >
        <FlagIcon className="size-4.5 -ml-0.75" />
        Set Finish
      </Button>
      <Button
        variant="warning"
        disabled={
          (frameStamps.start !== null && sliderValue[0] <= frameStamps.start) ||
          (frameStamps.end !== null && sliderValue[0] >= frameStamps.end)
        }
        className="font-extrabold px-3 py-1.5 rounded-sm"
        type="button"
        onClick={() => {
          if (frameStamps.sectors.includes(sliderValue[0])) {
            setFrameStamps((prev) => ({
              ...prev,
              sectors: prev.sectors.filter((s) => s !== sliderValue[0]),
            }));
            return;
          }
          setFrameStamps((prev) => ({
            ...prev,
            sectors: [...prev.sectors, sliderValue[0]].sort((a, b) => a - b),
          }));
        }}
      >
        <MapPinIcon className="size-4.5 -ml-0.75" />
        {frameStamps.sectors.includes(sliderValue[0])
          ? "Remove Sector"
          : "Add Sector"}
      </Button>
    </div>
  );
}
