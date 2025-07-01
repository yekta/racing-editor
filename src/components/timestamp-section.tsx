import { getTimeString } from "@/components/helpers";
import { TVideoProperties } from "@/components/types";

type TProps = {
  videoProperties: TVideoProperties;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sliderValue: number[];
};

export default function TimestampSection({
  videoProperties,
  sliderValue,
  videoRef,
}: TProps) {
  return (
    <p className="w-full leading-tight -mt-1 px-1">
      {getTimeString(videoRef.current?.currentTime || 0)}
      <span className="px-[0.5ch]">{"/"}</span>
      {getTimeString(
        videoProperties.totalFrames / videoProperties.frameRate
      )}{" "}
      <span className="text-muted-foreground">
        <span>(</span>
        {sliderValue[0]
          .toString()
          .padStart(videoProperties.totalFrames.toString().length, "0")}
        <span className="px-[0.5ch]">{"/"}</span>
        {videoProperties.totalFrames}
        <span>)</span>
      </span>
    </p>
  );
}
