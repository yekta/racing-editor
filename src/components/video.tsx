import { TVideoProperties } from "@/components/types";
import { RefObject } from "react";

type TProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoProperties: TVideoProperties;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
};

export default function Video({
  videoRef,
  videoProperties,
  onPlay,
  onPause,
  onTimeUpdate,
}: TProps) {
  return (
    <div>
      <video
        className="w-full h-full object-contain"
        ref={videoRef}
        src={videoProperties.url}
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTimeUpdate}
      />
    </div>
  );
}
