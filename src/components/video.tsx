import { getTimeStringFromFrame } from "@/components/helpers";
import { TFrameStamps, TVideoProperties } from "@/components/types";
import { Ref, RefObject, useMemo } from "react";
import { Group, Layer, Stage, Text } from "react-konva";
import AutoSizer from "react-virtualized-auto-sizer";
import Konva from "konva";

type TProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoProperties: TVideoProperties;
  frameStamps: TFrameStamps;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  sliderValue: number[];
  pilotName: string;
  stageRef: Ref<Konva.Stage | null>;
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
  stageRef,
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
        stageRef={stageRef}
        frameStamps={frameStamps}
        videoProperties={videoProperties}
        sliderValue={sliderValue}
        pilotName={pilotName}
      />
    </div>
  );
}

const pilotNameFontSize = 16;
const lapTimeFontSize = 32;
const sectorFontSize = 16;
const gap = 8;
const sectorGap = 4;
const margin = 16;
const fontFamily = "Geist Mono";

export function OverlayVideo({
  stageRef,
  frameStamps,
  videoProperties,
  sliderValue,
  pilotName,
}: {
  stageRef: Ref<Konva.Stage | null>;
  frameStamps: TFrameStamps;
  videoProperties: TVideoProperties;
  sliderValue: number[];
  pilotName: string;
}) {
  const currentFrame = useMemo(() => sliderValue[0] || 0, [sliderValue]);
  const sectorWidth = useMemo(
    () =>
      getSectorWidth({
        totalFrames: videoProperties.totalFrames,
        frameRate: videoProperties.frameRate,
      }),
    [videoProperties.totalFrames, videoProperties.frameRate]
  );

  const sectors = useMemo(() => {
    return [
      ...frameStamps.sectors,
      ...(frameStamps.sectors.length >= 1 && frameStamps.end !== null
        ? [frameStamps.end]
        : []),
    ];
  }, [frameStamps.sectors, frameStamps.end]);

  const divHeight = useMemo(() => {
    return (
      pilotNameFontSize +
      gap +
      lapTimeFontSize +
      (sectors.length > 0
        ? gap + sectorFontSize + sectorGap + sectorFontSize
        : 0)
    );
  }, [sectors.length]);

  return (
    <div className="w-full h-full absolute z-10 left-0 top-0">
      <AutoSizer>
        {({ height, width }) => {
          const canvasWidth =
            videoProperties.width / videoProperties.height >= width / height
              ? width
              : height * (videoProperties.width / videoProperties.height);

          const canvasHeight =
            videoProperties.width / videoProperties.height < width / height
              ? height
              : width / (videoProperties.width / videoProperties.height);

          const marginTop =
            videoProperties.width / videoProperties.height >= width / height
              ? height / 2 -
                width / (videoProperties.width / videoProperties.height) / 2
              : 0;

          const marginLeft =
            videoProperties.width / videoProperties.height < width / height
              ? width / 2 -
                (height * (videoProperties.width / videoProperties.height)) / 2
              : 0;

          return (
            <Stage
              ref={stageRef}
              style={{
                marginTop,
                marginLeft,
                width: canvasWidth,
                height: canvasHeight,
              }}
              className="border border-red-300 overflow-hidden"
              width={videoProperties.width}
              height={videoProperties.height}
            >
              <Layer width={canvasWidth} height={canvasHeight}>
                <Group y={canvasHeight - divHeight - margin}>
                  <Text
                    width={canvasWidth}
                    height={canvasHeight}
                    align="center"
                    text={pilotName !== "" ? pilotName : `Pilot name`}
                    fontSize={pilotNameFontSize}
                    fill="white"
                    shadowEnabled={true}
                    shadowColor="rgba(0, 0, 0, 0.3)"
                    shadowOffsetY={2}
                    shadowBlur={4}
                    shadowOffsetX={0}
                    fontFamily={fontFamily}
                  />
                  <Text
                    width={canvasWidth}
                    height={canvasHeight}
                    align="center"
                    fontSize={lapTimeFontSize}
                    fontStyle="bold"
                    offsetY={-1 * (pilotNameFontSize + gap)}
                    text={getDisplayTime({
                      current: currentFrame,
                      start: frameStamps.start !== null ? frameStamps.start : 0,
                      end:
                        frameStamps.end !== null
                          ? frameStamps.end
                          : videoProperties.totalFrames,
                      frameRate: videoProperties.frameRate,
                    })}
                    fill="white"
                    shadowEnabled={true}
                    shadowColor="rgba(0, 0, 0, 0.3)"
                    shadowOffsetY={4}
                    shadowBlur={8}
                    shadowOffsetX={0}
                    fontFamily={fontFamily}
                  />
                  {sectors.length > 0 && (
                    <Group
                      x={canvasWidth / 2 - (sectorWidth * sectors.length) / 2}
                      offsetY={
                        -1 * (pilotNameFontSize + lapTimeFontSize + gap * 2)
                      }
                      className="bg-background/50 flex text-lg leading-tight"
                    >
                      {sectors.map((sector, i) => (
                        <Sector
                          offsetX={-1 * i * sectorWidth}
                          width={sectorWidth}
                          key={i}
                          title={`S${i + 1}`}
                          fontSize={sectorFontSize}
                          gap={sectorGap}
                          value={getDisplayTime({
                            current: currentFrame,
                            start:
                              i === 0
                                ? frameStamps.start!
                                : frameStamps.sectors[i - 1],
                            end:
                              i === frameStamps.sectors.length
                                ? frameStamps.end !== null
                                  ? frameStamps.end
                                  : videoProperties.totalFrames
                                : sector,
                            frameRate: videoProperties.frameRate,
                          })}
                        />
                      ))}
                    </Group>
                  )}
                </Group>
              </Layer>
            </Stage>
          );
        }}
      </AutoSizer>
    </div>
  );
}

function Sector({
  title,
  value,
  width,
  fontSize,
  gap,
  offsetX,
}: {
  title: string;
  value: string;
  width: number;
  fontSize: number;
  gap: number;
  offsetX: number;
}) {
  return (
    <Group offsetX={offsetX} width={width}>
      <Text
        width={width}
        text={title}
        align="center"
        verticalAlign="middle"
        fill="white"
        fontSize={fontSize}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowOffsetY={2}
        shadowBlur={4}
        shadowOffsetX={0}
        fontFamily={fontFamily}
      />
      <Text
        width={width}
        text={value}
        align="center"
        verticalAlign="middle"
        fill="white"
        fontStyle="bold"
        fontSize={fontSize}
        offsetY={-1 * (fontSize + gap)}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowOffsetY={2}
        shadowBlur={4}
        shadowOffsetX={0}
        fontFamily={fontFamily}
      />
    </Group>
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

function getSectorWidth({
  totalFrames,
  frameRate,
}: {
  totalFrames: number;
  frameRate: number;
}) {
  let length = "00:00".length;
  const seconds = totalFrames / frameRate;
  if (seconds >= 3600) {
    length = "00:00:00.00".length;
  } else if (seconds >= 60) {
    length = "00:00.00".length;
  }
  return length * 12 + 12;
}
