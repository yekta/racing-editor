import path from "node:path";

export const rootPath = process.cwd();
export const uploadsPath = path.join(rootPath, "uploads");
export const rendersPath = path.join(rootPath, "renders");
export const overlayVideoFramesFolderName = "overlay-video-frames";
