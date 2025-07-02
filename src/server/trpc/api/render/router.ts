import {
  FrameStampsSchema,
  TFrameStamps,
  TVideoProperties,
} from "@/components/editor/types";
import { rendersPath, uploadsPath } from "@/server/constants";
import { createTRPCRouter, privateProcedure } from "@/server/trpc/setup/trpc";
import { TRPCError } from "@trpc/server";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { renderOverlayVideo } from "@/components/editor/video/overlay-video/overlay-video-server";

const execFileAsync = promisify(execFile);

const ffmpegExePath = ffmpegPath ?? process.env.FFMPEG_PATH ?? "ffmpeg";
const ffprobeExePath = (ffprobePath.path ??
  process.env.FFPROBE_PATH ??
  "ffprobe") as string;

export const renderRouter = createTRPCRouter({
  renderVideo: privateProcedure
    .input(
      z
        .object({
          id: z.string(),
          pilotName: z.string(),
        })
        .merge(FrameStampsSchema)
    )
    .mutation(async function ({
      input: { id, start, end, sectors, pilotName },
    }) {
      // Create renders directory if it doesn't exist
      try {
        await fs.mkdir(rendersPath, { recursive: true });
      } catch (error) {
        console.log("Error creating renders directory", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating renders directory",
        });
      }

      // Check if ffmpeg is available properly via a spawn
      try {
        await fs.access(ffmpegExePath);
      } catch (error) {
        console.log(`FFmpeg executable not found at ${ffmpegExePath}`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `FFmpeg executable not found at ${ffmpegExePath}`,
        });
      }

      // Check if ffprobe is available properly via a spawn
      try {
        await fs.access(ffprobeExePath);
      } catch (error) {
        console.log(`FFprobe executable not found at ${ffprobeExePath}`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `FFprobe executable not found at ${ffprobeExePath}`,
        });
      }

      // Check upload directory for a file that starts with the id
      const files = await fs.readdir(uploadsPath);
      const fileName = files.find((f) => f.startsWith(id));
      if (!fileName) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Video with id "${id}" not found`,
        });
      }
      console.log("Render specs", fileName, start, end, sectors, pilotName);

      // Read the video file
      const input = path.join(uploadsPath, fileName);

      // Check metadata
      const { stdout } = await execFileAsync(ffprobeExePath, [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        input,
      ]);
      const videoMetadata = JSON.parse(stdout);
      const firstStream = videoMetadata.streams[0];
      if (!firstStream || firstStream.codec_type !== "video") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `No video stream found in the file "${fileName}"`,
        });
      }
      const videoProperties: TVideoProperties = {
        id,
        width: firstStream.width,
        height: firstStream.height,
        duration: parseFloat(videoMetadata.format.duration),
        frameRate: Number(firstStream.avg_frame_rate.split("/")[0]),
        totalFrames: Math.floor(
          Number(firstStream.duration) *
            Number(firstStream.avg_frame_rate.split("/")[0])
        ),
        extension: path.extname(fileName).slice(1),
        url: path.join(uploadsPath, fileName),
      };
      const frameStamps: TFrameStamps = {
        start,
        end,
        sectors,
      };
      const res = renderOverlayVideo({
        videoProperties,
        frameStamps,
        pilotName,
      });
    }),
});
