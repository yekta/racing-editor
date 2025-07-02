import { getTimeStringFromFrame } from "@/components/editor/helpers";
import { TFrameStamps, TVideoProperties } from "@/components/editor/types";

export const pilotNameFontSize = 30;
export const lapTimeFontSize = 60;
export const sectorTitleFontSize = 30;
export const sectorValueFontSize = 40;
export const gap = 12;
export const sectorGap = 8;
export const margin = 24;
export const fontFamily = "Geist Mono";

export const textColor = "white";
export const mutedTextColor = "rgba(200, 200, 200, 1)";

export const shadowColor = "rgba(0, 0, 0, 0.3)";

export function getMainGroupProps({
  videoProperties,
  pilotName,
  sectors,
}: {
  videoProperties: TVideoProperties;
  pilotName: string;
  sectors: number[];
}) {
  const divHeight = calculateDivHeight({ pilotName, sectors });
  return { y: videoProperties.height - divHeight - margin };
}

export function getPilotNameProps({
  videoProperties,
  pilotName,
}: {
  videoProperties: TVideoProperties;
  pilotName: string;
}) {
  return {
    width: videoProperties.width,
    height: videoProperties.height,
    align: "center",
    text: pilotName !== "" ? pilotName : `Pilot name`,
    fontSize: pilotNameFontSize,
    fill: textColor,
    shadowEnabled: true,
    shadowColor: shadowColor,
    shadowOffsetY: 2,
    shadowBlur: 4,
    shadowOffsetX: 0,
    fontFamily: fontFamily,
  };
}

export function getLapTimeProps({
  currentFrame,
  frameStamps,
  videoProperties,
  pilotName,
}: {
  currentFrame: number;
  frameStamps: TFrameStamps;
  videoProperties: TVideoProperties;
  pilotName: string;
}) {
  const lapTimeStr = getDisplayTime({
    current: currentFrame,
    start: frameStamps.start !== null ? frameStamps.start : 0,
    end:
      frameStamps.end !== null ? frameStamps.end : videoProperties.totalFrames,
    frameRate: videoProperties.frameRate,
  });

  return {
    width: videoProperties.width,
    height: videoProperties.height,
    align: "center",
    fontSize: lapTimeFontSize,
    fontStyle: "bold",
    fill:
      frameStamps.start !== null && currentFrame < frameStamps.start
        ? mutedTextColor
        : textColor,

    offsetY: -1 * (pilotName !== "" ? pilotNameFontSize + gap : 0),
    text: lapTimeStr,
    shadowEnabled: true,
    shadowColor: shadowColor,
    shadowOffsetY: 4,
    shadowBlur: 8,
    shadowOffsetX: 0,
    fontFamily: fontFamily,
  };
}

export function getDisplayTime({
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

export function getSectors(frameStamps: TFrameStamps) {
  return [
    ...frameStamps.sectors,
    ...(frameStamps.sectors.length >= 1 && frameStamps.end !== null
      ? [frameStamps.end]
      : []),
  ];
}

export function getSectorGroupProps({
  sectors,
  pilotName,
  videoProperties,
  sectorWidth,
}: {
  sectors: number[];
  pilotName: string;
  videoProperties: TVideoProperties;
  sectorWidth: number;
}) {
  return {
    x: videoProperties.width / 2 - (sectorWidth * sectors.length) / 2,
    offsetY:
      -1 *
      ((pilotName !== "" ? pilotNameFontSize + gap : 0) +
        lapTimeFontSize +
        gap),
  };
}

export function getSectorProps({
  sector,
  currentFrame,
  index,
  frameStamps,
  videoProperties,
  sectorWidth,
}: {
  sector: number;
  currentFrame: number;
  index: number;
  frameStamps: TFrameStamps;
  videoProperties: TVideoProperties;
  sectorWidth: number;
}) {
  const value = getDisplayTime({
    current: currentFrame,
    start: index === 0 ? frameStamps.start! : frameStamps.sectors[index - 1],
    end:
      index === frameStamps.sectors.length
        ? frameStamps.end !== null
          ? frameStamps.end
          : videoProperties.totalFrames
        : sector,
    frameRate: videoProperties.frameRate,
  });

  const valueFill =
    currentFrame <
    (index === 0 ? frameStamps.start! : frameStamps.sectors[index - 1])
      ? mutedTextColor
      : textColor;

  const titleFill =
    currentFrame <
    (index === 0 ? frameStamps.start! : frameStamps.sectors[index - 1])
      ? mutedTextColor
      : textColor;

  const groupOffsetX = -1 * index * sectorWidth;

  const title = `S${index + 1}`;

  const sharedTextProps = {
    width: sectorWidth,
    align: "center",
    verticalAlign: "middle",
    valueFontStyle: "bold",
    shadowOffsetY: 2,
    shadowBlur: 4,
    shadowColor: shadowColor,
    shadowOffsetX: 0,
    fontFamily: fontFamily,
  };

  return {
    groupProps: {
      offsetX: groupOffsetX,
      width: sectorWidth,
    },
    titleProps: {
      text: title,
      fill: titleFill,
      fontSize: sectorTitleFontSize,
      ...sharedTextProps,
    },
    valueProps: {
      text: value,
      fill: valueFill,
      fontSize: sectorValueFontSize,
      offsetY: -1 * (sectorTitleFontSize + sectorGap),
      fontStyle: "bold",
      ...sharedTextProps,
    },
  };
}

export function getSectorWidth({
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

export function calculateDivHeight({
  pilotName,
  sectors,
}: {
  pilotName: string | undefined;
  sectors: number[];
}) {
  return (
    (pilotName !== "" ? pilotNameFontSize + gap : 0) +
    lapTimeFontSize +
    (sectors.length > 0
      ? gap + sectorTitleFontSize + sectorGap + sectorValueFontSize
      : 0)
  );
}
