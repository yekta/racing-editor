import { uploadsPath } from "@/server/constants";
import { createTRPCRouter, privateProcedure } from "@/server/trpc/setup/trpc";
import path from "node:path";
import { zfd } from "zod-form-data";
import fs from "node:fs/promises";
import { v4 as uuidv4 } from "uuid";

export const uploadRouter = createTRPCRouter({
  uploadVideo: privateProcedure
    .input(
      zfd.formData({
        video: zfd.file(),
      })
    )
    .mutation(async function ({ input }) {
      const { video } = input;
      const id = uuidv4();
      const filePath = path.join(uploadsPath, `${id}-${video.name}`);
      await fs.mkdir(uploadsPath, { recursive: true });
      const fileBuffer = await video.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(fileBuffer));
      return {
        id,
      };
    }),
});
