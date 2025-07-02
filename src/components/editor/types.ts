import { z } from "zod";

export const VideoPropertiesSchema = z.object({
  id: z.string(),
  url: z.string(),
  width: z.number(),
  height: z.number(),
  frameRate: z.number(),
  totalFrames: z.number(),
  duration: z.number(),
  extension: z.string(),
});

export type TVideoProperties = z.infer<typeof VideoPropertiesSchema>;

export const FrameStampsSchema = z.object({
  start: z.number().nullable(),
  end: z.number().nullable(),
  sectors: z.array(z.number()),
});

export type TFrameStamps = z.infer<typeof FrameStampsSchema>;
