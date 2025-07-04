import {
  Dropzone,
  DropZoneArea,
  DropzoneTrigger,
  useDropzone,
} from "@/components/ui/dropzone";
import { ClapperboardIcon } from "lucide-react";

type TProps = {
  onDropFile: (file: File) => void;
};

export default function VideoDropzone({ onDropFile }: TProps) {
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      onDropFile(file);
      return {
        status: "success",
        result: URL.createObjectURL(file),
      };
    },
    validation: {
      accept: {
        "video/*": [".mov", ".mp4"],
      },
      maxSize: 1000 * 1024 * 1024,
      maxFiles: 1,
    },
  });

  return (
    <Dropzone {...dropzone}>
      <DropZoneArea className="w-full h-full border-none">
        <DropzoneTrigger className="flex min-h-0 flex-col px-10 py-8 items-center justify-center gap-2">
          <ClapperboardIcon className="size-10 shrink-0" />
          <p className="text-xl leading-tight text-center font-bold">
            Add a video
          </p>
          <p className="w-full text-sm leading-tight text-center text-muted-foreground">
            Click or drop your video here
          </p>
        </DropzoneTrigger>
      </DropZoneArea>
    </Dropzone>
  );
}
