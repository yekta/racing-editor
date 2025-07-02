import { TFrameStamps, TVideoProperties } from "@/components/editor/types";
import {
  getLapTimeProps,
  getMainGroupProps,
  getPilotNameProps,
  getSectorGroupProps,
  getSectorProps,
  getSectors,
  getSectorWidth,
} from "@/components/editor/video/overlay-video/overlay-shared";
import { useMemo } from "react";
import { Group, Layer, Stage, Text } from "react-konva";
import AutoSizer from "react-virtualized-auto-sizer";

export default function OverlayVideo({
  frameStamps,
  videoProperties,
  sliderValue,
  pilotName,
}: {
  frameStamps: TFrameStamps;
  videoProperties: TVideoProperties;
  sliderValue: number[];
  pilotName: string;
}) {
  const currentFrame = useMemo(() => sliderValue[0] || 0, [sliderValue]);

  const pilotNameProps = useMemo(
    () => getPilotNameProps({ pilotName, videoProperties }),
    [pilotName, videoProperties]
  );

  const lapTimeProps = useMemo(
    () =>
      getLapTimeProps({
        currentFrame,
        frameStamps,
        videoProperties,
        pilotName,
      }),
    [videoProperties, frameStamps, currentFrame, pilotName]
  );

  const sectors = useMemo(() => {
    return getSectors(frameStamps);
  }, [frameStamps]);

  const sectorWidth = useMemo(
    () =>
      getSectorWidth({
        totalFrames: videoProperties.totalFrames,
        frameRate: videoProperties.frameRate,
      }),
    [videoProperties.totalFrames, videoProperties.frameRate]
  );

  const sectorGroupProps = useMemo(
    () =>
      getSectorGroupProps({ sectors, sectorWidth, pilotName, videoProperties }),
    [sectors, sectorWidth, pilotName, videoProperties]
  );

  const mainGroupProps = useMemo(
    () => getMainGroupProps({ videoProperties, pilotName, sectors }),
    [videoProperties, pilotName, sectors]
  );

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

          return (
            <Stage
              style={{
                marginTop,
                marginLeft,
                width: canvasContainerWidth,
                height: canvasContainerHeight,
              }}
              className="overflow-hidden"
              width={videoProperties.width}
              height={videoProperties.height}
              scale={{
                x: canvasContainerWidth / videoProperties.width,
                y: canvasContainerWidth / videoProperties.width,
              }}
            >
              <Layer>
                <Group {...mainGroupProps}>
                  {pilotName !== "" && <Text {...pilotNameProps} />}
                  <Text {...lapTimeProps} />
                  {sectors.length > 0 && (
                    <Group {...sectorGroupProps}>
                      {sectors.map((sector, i) => {
                        const { groupProps, titleProps, valueProps } =
                          getSectorProps({
                            sector,
                            currentFrame,
                            index: i,
                            frameStamps,
                            videoProperties,
                            sectorWidth,
                          });
                        return (
                          <Group key={i} {...groupProps}>
                            <Text {...titleProps} />
                            <Text {...valueProps} />
                          </Group>
                        );
                      })}
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
