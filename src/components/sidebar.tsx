import { getTimeStringFromFrame } from "@/components/helpers";
import { TFrameStamps, TVideoProperties } from "@/components/player";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  FlagIcon,
  MapPinIcon,
  RocketIcon,
  TimerIcon,
  Trash2Icon,
} from "lucide-react";
import { FC, useEffect, useRef, useState } from "react";

type TProps = {
  frameStamps: TFrameStamps;
  onClickDeleteSector: (index: number) => void;
  onClickDeleteStart: () => void;
  onClickDeleteEnd: () => void;
  videoProperties: TVideoProperties;
};

export default function Sidebar({
  frameStamps,
  videoProperties,
  onClickDeleteSector,
  onClickDeleteStart,
  onClickDeleteEnd,
}: TProps) {
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      console.log(message);
    });
    ffmpeg.on("progress", ({ progress }) => {
      setProgress(progress);
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    setIsFfmpegLoaded(true);
  };

  const render = async () => {
    if (isRendering) return;
    setIsRendering(true);
    if (!isFfmpegLoaded) {
      console.error("FFmpeg is not loaded yet.");
      setIsRendering(false);
      return;
    }
    try {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile(
        "input.webm",
        await fetchFile(videoProperties.url)
      );
      await ffmpeg.exec(["-i", "input.webm", "output.mp4"]);
      const data = await ffmpeg.readFile("output.mp4");
      // download the output file
      const blob = new Blob([data], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.log("Error during rendering:", error);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="w-80 border-l overflow-hidden flex flex-col relative">
      <div className="flex-1 flex flex-col overflow-auto px-5 py-4 gap-5">
        <Section
          title="Lap Time"
          frame={
            frameStamps.start !== null && frameStamps.end !== null
              ? frameStamps.end - frameStamps.start
              : null
          }
          videoProperties={videoProperties}
          Icon={TimerIcon}
        />
        {frameStamps.sectors.map((sector, index) => (
          <Section
            key={index}
            title={`Sector ${index + 1}`}
            frame={
              frameStamps.start === null
                ? null
                : index === 0
                ? sector - frameStamps.start!
                : sector - frameStamps.sectors[index - 1]
            }
            videoProperties={videoProperties}
            onClickDelete={() => onClickDeleteSector(index)}
            Icon={MapPinIcon}
          />
        ))}
        {frameStamps.start !== null &&
          frameStamps.end !== null &&
          frameStamps.sectors.length >= 1 && (
            <Section
              title={`Sector ${frameStamps.sectors.length + 1}`}
              frame={
                frameStamps.end -
                frameStamps.sectors[frameStamps.sectors.length - 1]
              }
              videoProperties={videoProperties}
              Icon={MapPinIcon}
            />
          )}
        {(frameStamps.start !== null || frameStamps.end !== null) && (
          <div className="w-[calc(100%+1rem)] -mx-2 h-px bg-border rounded-full" />
        )}
        {frameStamps.start !== null && (
          <Section
            title="Start"
            frame={frameStamps.start}
            videoProperties={videoProperties}
            onClickDelete={onClickDeleteStart}
            Icon={RocketIcon}
          />
        )}
        {frameStamps.end !== null && (
          <Section
            title="End"
            frame={frameStamps.end}
            videoProperties={videoProperties}
            onClickDelete={onClickDeleteEnd}
            Icon={FlagIcon}
          />
        )}
      </div>
      <div className="w-full p-4 border-t">
        <Button
          onClick={render}
          disabled={!isFfmpegLoaded || isRendering}
          className="w-full font-extrabold"
        >
          {isRendering
            ? `Rendering: ${Math.ceil(progress * 100)}%`
            : isFfmpegLoaded
            ? "Render"
            : "Loading FFmpeg"}
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  frame,
  videoProperties,
  className,
  classNameParagraph,
  onClickDelete,
  Icon,
}: {
  title: string;
  frame: number | null;
  videoProperties: TVideoProperties;
  className?: string;
  classNameParagraph?: string;
  onClickDelete?: () => void;
  Icon: FC<{ className?: string }>;
}) {
  return (
    <div className={cn("w-full flex items-end", className)}>
      <div className="w-full flex flex-col gap-1">
        <div className="w-full flex text-muted-foreground gap-1.5">
          <Icon className="size-4 shrink-0" />
          <h3 className="min-w-0 shrink leading-tight text-sm font-medium">
            {title}
          </h3>
        </div>

        <p
          className={cn(
            "w-full text-xl font-bold leading-tight",
            classNameParagraph
          )}
        >
          {frame !== null
            ? getTimeStringFromFrame({
                frame,
                frameRate: videoProperties.frameRate,
              })
            : "N/A"}
        </p>
      </div>
      {onClickDelete && (
        <Button
          size="icon"
          variant="destructive-ghost"
          className="text-muted-foreground"
          onClick={onClickDelete}
        >
          <Trash2Icon className="size-4.5" />
        </Button>
      )}
    </div>
  );
}
