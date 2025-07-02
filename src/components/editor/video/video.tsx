import { TFrameStamps, TVideoProperties } from "@/components/editor/types";
import OverlayVideo from "@/components/editor/video/overlay-video/overlay-video-client";

import { RefObject } from "react";

type TProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoProperties: TVideoProperties;
  frameStamps: TFrameStamps;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  sliderValue: number[];
  pilotName: string;
};

export default function Video({
  videoRef,
  videoProperties,
  frameStamps,
  onPlay,
  onPause,
  onTimeUpdate,
  sliderValue,
  pilotName,
}: TProps) {
  return (
    <div className="w-full h-full relative">
      <video
        className="w-full h-full object-contain"
        ref={videoRef}
        src={videoProperties.url}
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTimeUpdate}
      />
      <OverlayVideo
        frameStamps={frameStamps}
        videoProperties={videoProperties}
        sliderValue={sliderValue}
        pilotName={pilotName}
      />
    </div>
  );
}
