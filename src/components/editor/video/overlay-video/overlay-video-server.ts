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
import { overlayVideoFramesFolderName, rendersPath } from "@/server/constants";
import { createCanvas } from "@napi-rs/canvas";
import { execa } from "execa";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import Konva from "konva";
import fs from "node:fs/promises";
import path from "node:path";

export const ffmpegExePath = ffmpegPath ?? process.env.FFMPEG_PATH ?? "ffmpeg";
export const ffprobeExePath = (ffprobePath.path ??
  process.env.FFPROBE_PATH ??
  "ffprobe") as string;

function initKonva({
  videoProperties,
  frameStamps,
  pilotName,
}: {
  videoProperties: TVideoProperties;
  frameStamps: TFrameStamps;
  pilotName: string;
}) {
  const { width, height } = videoProperties;
  const canvas = createCanvas(width, height);
  const stage = new Konva.Stage({
    width,
    height,
    _canvas: canvas,
  });
  const mainLayer = new Konva.Layer();

  const sectors = getSectors(frameStamps);
  const mainGroupProps = getMainGroupProps({
    videoProperties,
    pilotName,
    sectors,
  });
  const mainGroup = new Konva.Group(mainGroupProps);

  mainLayer.add(mainGroup);
  stage.add(mainLayer);

  return { canvas, stage, mainLayer, mainGroup };
}

export async function renderOverlayVideo({
  videoProperties,
  frameStamps,
  pilotName,
}: {
  videoProperties: TVideoProperties;
  frameStamps: TFrameStamps;
  pilotName: string;
}) {
  const mainFolderPath = path.join(rendersPath, videoProperties.id);
  const overlayVideoFramesFolderPath = path.join(
    mainFolderPath,
    overlayVideoFramesFolderName
  );
  const outputVideoPath = path.join(mainFolderPath, "overlay.mov");

  // Create the render folder for this video
  try {
    await fs.mkdir(overlayVideoFramesFolderPath, {
      recursive: true,
    });
  } catch (error) {
    console.error("Error creating uploads directory", error);
    throw new Error("Error creating uploads directory");
  }

  const { mainGroup, mainLayer } = initKonva({
    videoProperties,
    frameStamps,
    pilotName,
  });

  const sectors = getSectors(frameStamps);

  for (let i = 0; i < videoProperties.totalFrames; i++) {
    const buffer = await renderFrame({
      currentFrame: i,
      videoProperties,
      frameStamps,
      pilotName,
      mainGroup,
      mainLayer,
      sectors,
    });
    // Save data url to a storage
    const filePath = path.join(
      overlayVideoFramesFolderPath,
      `frame_${i.toString().padStart(8, "0")}.png`
    );
    await fs.writeFile(filePath, buffer);
  }

  const pattern = path.join(overlayVideoFramesFolderPath, "frame_%08d.png");

  await execa(ffmpegExePath, [
    "-y",
    "-start_number",
    "0",
    "-framerate",
    videoProperties.frameRate.toString(),
    "-i",
    pattern,

    // ----- Apple ProRes 4444 w/ alpha -----
    "-c:v",
    "prores_ks",
    "-profile:v",
    "4", // 4 = 4444
    "-pix_fmt",
    "yuva444p10le", // 10-bit RGBA keeps transparency

    // ----- keep exact fps on the output -----
    "-r",
    videoProperties.frameRate.toString(),
    outputVideoPath,
  ]);

  // Delete the frames folder after rendering
  try {
    await fs.rm(overlayVideoFramesFolderPath, { recursive: true, force: true });
  } catch (error) {
    console.error("Error deleting frames folder", error);
    throw new Error("Error deleting frames folder");
  }

  return {
    videoPath: outputVideoPath,
  };
}

async function renderFrame({
  currentFrame,
  videoProperties,
  frameStamps,
  pilotName,
  sectors,
  mainGroup,
  mainLayer,
}: {
  currentFrame: number;
  videoProperties: TVideoProperties;
  frameStamps: TFrameStamps;
  pilotName: string;
  sectors: ReturnType<typeof getSectors>;
  mainGroup: Konva.Group;
  mainLayer: Konva.Layer;
}) {
  const start = performance.now();
  const lapTimeProps = getLapTimeProps({
    currentFrame,
    frameStamps,
    videoProperties,
    pilotName,
  });

  const sectorWidth = getSectorWidth({
    totalFrames: videoProperties.totalFrames,
    frameRate: videoProperties.frameRate,
  });

  const sectorGroupProps = getSectorGroupProps({
    sectors,
    sectorWidth,
    pilotName,
    videoProperties,
  });

  const pilotNameProps =
    pilotName !== "" ? getPilotNameProps({ videoProperties, pilotName }) : null;

  if (pilotNameProps !== null) {
    const pilotNameText = new Konva.Text(pilotNameProps);
    mainGroup.add(pilotNameText);
  }

  const lapTimeText = new Konva.Text(lapTimeProps);
  mainGroup.add(lapTimeText);

  if (sectors.length > 0) {
    const sectorGroup = new Konva.Group(sectorGroupProps);
    mainGroup.add(sectorGroup);

    sectors.forEach((sector, index) => {
      const { groupProps, titleProps, valueProps } = getSectorProps({
        currentFrame,
        sector,
        sectorWidth,
        frameStamps,
        videoProperties,
        index,
      });

      const group = new Konva.Group(groupProps);
      group.add(new Konva.Text(titleProps));
      group.add(new Konva.Text(valueProps));

      sectorGroup.add(group);
    });
  }

  mainLayer.clear();
  mainLayer.draw();

  const canvas = mainLayer.getCanvas()._canvas;
  // @ts-expect-error - This is fine
  const png = canvas.toBuffer("image/png");

  mainGroup.removeChildren();

  const end = performance.now();
  console.log(
    `Rendered frame ${currentFrame} in: ${Math.round(end - start)}ms`
  );
  return png as Buffer;
}
