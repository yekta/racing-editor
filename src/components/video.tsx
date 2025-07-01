import { getTimeStringFromFrame } from "@/components/helpers";
import { TFrameStamps, TVideoProperties } from "@/components/types";
import { cn } from "@/lib/utils";
import { Player, PlayerRef } from "@remotion/player";
import { RefObject, useCallback } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

type TProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayVideoRef: RefObject<PlayerRef | null>;
  videoProperties: TVideoProperties;
  frameStamps: TFrameStamps;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
};

export default function Video({
  videoRef,
  overlayVideoRef,
  videoProperties,
  frameStamps,
  onPlay,
  onPause,
  onTimeUpdate,
}: TProps) {
  const OverlayVideo_ = useCallback(
    () => (
      <OverlayVideo
        frameStamps={frameStamps}
        videoProperties={videoProperties}
      />
    ),
    [frameStamps, videoProperties]
  );

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
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: "auto",
          aspectRatio: `${videoProperties.width} / ${videoProperties.height}`,
          maxHeight: "100%",
          maxWidth: "100%",
        }}
      >
        <Player
          ref={overlayVideoRef}
          component={OverlayVideo_}
          durationInFrames={videoProperties.totalFrames}
          compositionWidth={videoProperties.width}
          compositionHeight={videoProperties.height}
          fps={videoProperties.frameRate}
          style={{
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}

function OverlayVideo({
  frameStamps,
  videoProperties,
}: {
  frameStamps: TFrameStamps;
  videoProperties: TVideoProperties;
}) {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        textAlign: "center",
        justifyContent: "end",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <div className="rounded-md bg-background/50 overflow-hidden">
        <p className="bg-background/50 w-full text-left px-3 text-xl font-bold py-2">
          Pilot Name
        </p>
        <p
          data-before={
            frameStamps.start !== null && frame < frameStamps.start
              ? true
              : undefined
          }
          data-after={
            frameStamps.end !== null && frame >= frameStamps.end
              ? true
              : undefined
          }
          className="font-bold text-3xl px-3 py-2 data-before:text-muted-foreground data-after:text-success data-before:data-after:text-success"
        >
          {getDisplayTime({
            current: frame,
            start: frameStamps.start !== null ? frameStamps.start : 0,
            end:
              frameStamps.end !== null
                ? frameStamps.end
                : videoProperties.totalFrames,
            frameRate: videoProperties.frameRate,
          })}
        </p>
        {frameStamps.sectors.length > 0 && (
          <div className="bg-background/50 flex text-lg leading-tight">
            {frameStamps.sectors.map((sector, i) => (
              <Sector
                key={i}
                data-before={
                  frame <
                  (i === 0
                    ? frameStamps.start || 0
                    : frameStamps.sectors[i - 1])
                    ? true
                    : undefined
                }
                data-after={frame >= sector ? true : undefined}
                className="group/sector"
                classNameValue="group-data-before/sector:text-muted-foreground group-data-after/sector:text-success group-data-before/sector:data-after/sector:text-success"
                title={`S${i + 1}`}
                value={getDisplayTime({
                  current: frame,
                  start:
                    i === 0 ? frameStamps.start! : frameStamps.sectors[i - 1],
                  end: sector,
                  frameRate: videoProperties.frameRate,
                })}
              />
            ))}
            {frameStamps.end !== null && (
              <Sector
                title={`S${frameStamps.sectors.length + 1}`}
                value={getDisplayTime({
                  current: frame,
                  start: frameStamps.sectors[frameStamps.sectors.length - 1],
                  end:
                    frameStamps.end !== null
                      ? frameStamps.end
                      : videoProperties.totalFrames,
                  frameRate: videoProperties.frameRate,
                })}
                data-before={
                  frame < frameStamps.sectors[frameStamps.sectors.length - 1]
                    ? true
                    : undefined
                }
                data-after={frame >= frameStamps.end ? true : undefined}
                className="group/sector"
                classNameValue="group-data-before/sector:text-muted-foreground group-data-after/sector:text-success group-data-before/sector:data-after/sector:text-success"
              />
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}

function Sector({
  title,
  value,
  className,
  classNameValue,
  ...rest
}: {
  title: string;
  value: string;
  classNameValue?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col flex-1 px-4 py-2 gap-0.5", className)}
      {...rest}
    >
      <p className="font-medium text-muted-foreground leading-tight">{title}</p>
      <p className={cn("font-bold leading-tight", classNameValue)}>{value}</p>
    </div>
  );
}

function getDisplayTime({
  current,
  start,
  end,
  frameRate,
}: {
  start: number;
  end: number;
  current: number;
  frameRate: number;
}) {
  const frame = Math.min(Math.max(0, current - start), end - start);
  return getTimeStringFromFrame({
    frame,
    totalFrames: end - start,
    frameRate: frameRate,
  });
}
