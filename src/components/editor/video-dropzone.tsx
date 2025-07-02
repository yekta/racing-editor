import {
  Dropzone,
  DropZoneArea,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneFileMessage,
  DropzoneTrigger,
  DropzoneRemoveFile,
  DropzoneRetryFile,
  InfiniteProgress,
  useDropzone,
} from "@/components/ui/dropzone";
import { UploadIcon } from "lucide-react";

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
        <DropzoneTrigger className="flex min-h-0 flex-col px-8 py-8 items-center justify-center gap-2">
          <UploadIcon className="size-10 shrink-0" />
          <p className="text-xl leading-tight text-center font-bold">
            Add a video
          </p>
          <p className="w-full text-sm leading-tight text-center text-muted-foreground">
            Click here or drag & drop your video
          </p>
        </DropzoneTrigger>
        <DropzoneFileList>
          {dropzone.fileStatuses.map((file) => (
            <DropzoneFileListItem key={file.id} file={file}>
              <DropzoneRetryFile>Retry</DropzoneRetryFile>
              <DropzoneRemoveFile>Remove</DropzoneRemoveFile>
              <DropzoneFileMessage />
              <InfiniteProgress status={file.status} />
            </DropzoneFileListItem>
          ))}
        </DropzoneFileList>
      </DropZoneArea>
    </Dropzone>
  );
}
