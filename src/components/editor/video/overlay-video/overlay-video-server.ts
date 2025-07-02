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
import { overlayVideoFolderName, rendersPath } from "@/server/constants";
import { createCanvas } from "@napi-rs/canvas";
import Konva from "konva";
import fs from "node:fs/promises";
import path from "node:path";

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
  const stage = new Konva.Stage({ width, height, _canvas: canvas });
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

  return { stage, canvas, mainLayer, mainGroup };
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
  const folderPath = path.join(
    rendersPath,
    videoProperties.id,
    overlayVideoFolderName
  );

  // Create the render folder for this video
  try {
    await fs.mkdir(folderPath, {
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
    const dataUrl = renderFrame({
      currentFrame: i,
      videoProperties,
      frameStamps,
      pilotName,
      mainGroup,
      mainLayer,
      sectors,
    });
    // Save data url to a storage
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filePath = path.join(
      folderPath,
      `frame_${i.toString().padStart(8, "0")}.png`
    );
    await fs.writeFile(filePath, buffer);
  }
}

function renderFrame({
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

  mainGroup.draw();
  const dataUrl = mainLayer.getCanvas().toDataURL("image/png", 10);
  mainLayer.clear();
  mainGroup.removeChildren();
  mainLayer.batchDraw();
  return dataUrl;
}
