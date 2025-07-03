import { getTimeStringFromFrame } from "@/components/helpers";
import { TFrameStamps, TVideoProperties } from "@/components/types";
import Konva from "konva";
import { LoaderIcon } from "lucide-react";
import { Ref, RefObject, useMemo } from "react";
import { Group, Layer, Rect, Stage, Text } from "react-konva";
import AutoSizer from "react-virtualized-auto-sizer";

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
  isRendering: boolean;
  ffmpegProgress: number;
  overlayProgress: number;
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
  isRendering,
  ffmpegProgress,
  overlayProgress,
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
        autoPlay={false}
      />
      <OverlayVideo
        stageRef={stageRef}
        frameStamps={frameStamps}
        videoProperties={videoProperties}
        sliderValue={sliderValue}
        pilotName={pilotName}
      />
      {isRendering && (
        <div className="w-full h-full absolute left-0 top-0 bg-background/60 px-4 py-3 flex items-center justify-center gap-2 z-50">
          <LoaderIcon className="size-6 shrink-0 animate-spin" />
          <p className="min-w-0 leading-tight shrink font-semibold text-xl">
            {ffmpegProgress > 0
              ? `Rendering Video: ${Math.ceil(ffmpegProgress * 100)}%`
              : `Rendering Overlay: ${Math.ceil(overlayProgress * 100)}%`}
          </p>
        </div>
      )}
    </div>
  );
}

const pilotNameFontSize = 32;
const lapTimeFontSize = 52;
const sectorTitleFontSize = 24;
const sectorValueFontSize = 36;
const mainGap = 16;
const pilotNameGap = 10;
const sectorGap = 8;
const margin = 24;
const fontFamily = "Geist Mono";
const finishedSectorColor = "hsl(40 100% 70%)";
const finishedRaceColor = "hsl(131 100% 75%)";
const shadowColor = "rgba(0, 0, 0, 0.5)";
const shadowOffsetY = 3;

const textColor = "white";
const mutedTextColor = "rgba(180, 180, 180, 1)";

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
      (pilotName !== "" ? pilotNameFontSize + pilotNameGap : 0) +
      lapTimeFontSize +
      (sectors.length > 0
        ? mainGap + sectorTitleFontSize + sectorGap + sectorValueFontSize
        : 0)
    );
  }, [sectors.length, pilotName]);

  const rectHeight = useMemo(() => divHeight * 1.5, [divHeight]);

  return (
    <div className="w-full h-full absolute z-10 left-0 top-0">
      <AutoSizer>
        {({ height, width }) => {
          const canvasContainerWidth =
            videoProperties.width / videoProperties.height >= width / height
              ? width
              : height * (videoProperties.width / videoProperties.height);

          const canvasContainerHeight =
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

          const scale = canvasContainerWidth / videoProperties.width;

          const fullWidth = videoProperties.width * scale;
          const fullHeight = videoProperties.height * scale;

          return (
            <Stage
              ref={stageRef}
              style={{
                marginTop,
                marginLeft,
                width: canvasContainerWidth,
                height: canvasContainerHeight,
              }}
              className="overflow-hidden"
              width={fullWidth}
              height={fullHeight}
              scale={{
                x: scale,
                y: scale,
              }}
            >
              <Layer>
                <Rect
                  width={videoProperties.width}
                  height={rectHeight}
                  x={0}
                  y={videoProperties.height - rectHeight}
                  fillLinearGradientColorStops={[
                    0,
                    "rgba(0, 0, 0, 0)",
                    1,
                    "rgba(0, 0, 0, 0.5)",
                  ]}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ x: 0, y: rectHeight }}
                />
                <Group y={videoProperties.height - divHeight - margin}>
                  {pilotName !== "" && (
                    <Text
                      width={videoProperties.width}
                      height={videoProperties.height}
                      align="center"
                      text={pilotName !== "" ? pilotName : `Pilot name`}
                      fontSize={pilotNameFontSize}
                      fill={textColor}
                      shadowEnabled={true}
                      shadowColor={shadowColor}
                      shadowOffsetY={shadowOffsetY}
                      fontFamily={fontFamily}
                    />
                  )}
                  <Text
                    width={videoProperties.width}
                    height={videoProperties.height}
                    align="center"
                    fontSize={lapTimeFontSize}
                    fontStyle="bold"
                    fill={
                      frameStamps.start !== null &&
                      currentFrame < frameStamps.start
                        ? mutedTextColor
                        : frameStamps.end !== null &&
                          currentFrame >= frameStamps.end
                        ? finishedRaceColor
                        : textColor
                    }
                    offsetY={
                      -1 *
                      (pilotName !== "" ? pilotNameFontSize + pilotNameGap : 0)
                    }
                    text={getDisplayTime({
                      current: currentFrame,
                      start: frameStamps.start !== null ? frameStamps.start : 0,
                      end:
                        frameStamps.end !== null
                          ? frameStamps.end
                          : videoProperties.totalFrames,
                      frameRate: videoProperties.frameRate,
                    })}
                    shadowEnabled={true}
                    shadowColor={shadowColor}
                    shadowOffsetY={shadowOffsetY}
                    fontFamily={fontFamily}
                  />
                  {sectors.length > 0 && (
                    <Group
                      x={
                        videoProperties.width / 2 -
                        (sectorWidth * sectors.length) / 2
                      }
                      offsetY={
                        -1 *
                        ((pilotName !== ""
                          ? pilotNameFontSize + pilotNameGap
                          : 0) +
                          lapTimeFontSize +
                          mainGap)
                      }
                    >
                      {sectors.map((sector, i) => (
                        <Sector
                          offsetX={-1 * i * sectorWidth}
                          width={sectorWidth}
                          key={i}
                          title={`S${i + 1}`}
                          titleFontSize={sectorTitleFontSize}
                          valueFontSize={sectorValueFontSize}
                          gap={sectorGap}
                          titleFill={
                            currentFrame <
                            (i === 0
                              ? frameStamps.start!
                              : frameStamps.sectors[i - 1])
                              ? mutedTextColor
                              : textColor
                          }
                          valueFill={
                            currentFrame <
                            (i === 0
                              ? frameStamps.start!
                              : frameStamps.sectors[i - 1])
                              ? mutedTextColor
                              : currentFrame >= sector
                              ? finishedSectorColor
                              : textColor
                          }
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
  titleFontSize,
  valueFontSize,
  titleFill = "white",
  valueFill = "white",
  gap,
  offsetX,
}: {
  title: string;
  value: string;
  width: number;
  titleFontSize: number;
  valueFontSize: number;
  titleFill?: string;
  valueFill?: string;
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
        fill={titleFill}
        fontSize={titleFontSize}
        shadowColor={shadowColor}
        shadowOffsetY={shadowOffsetY}
        fontFamily={fontFamily}
      />
      <Text
        width={width}
        text={value}
        align="center"
        verticalAlign="middle"
        fill={valueFill}
        fontStyle="bold"
        fontSize={valueFontSize}
        offsetY={-1 * (titleFontSize + gap)}
        shadowColor={shadowColor}
        shadowOffsetY={shadowOffsetY}
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
  return length * sectorValueFontSize * (3 / 4) + 12;
}
