import { getTimeStringFromFrame } from "@/components/helpers";
import { TFrameStamps, TVideoProperties } from "@/components/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  ClockIcon,
  FlagIcon,
  MapPinIcon,
  RocketIcon,
  SquareDashedIcon,
  TimerIcon,
  Trash2Icon,
  TvIcon,
} from "lucide-react";
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

type TProps = {
  frameStamps: TFrameStamps;
  setFrameStamps: Dispatch<SetStateAction<TFrameStamps>>;
  videoProperties: TVideoProperties;
  pilotName: string;
  onPilotNameChange: (value: string) => void;
};

export default function Sidebar({
  frameStamps,
  setFrameStamps,
  videoProperties,
  pilotName,
  onPilotNameChange,
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
      <div className="flex-1 flex flex-col overflow-auto px-5 py-5 gap-5">
        <Input
          className="w-full"
          value={pilotName}
          onChange={(e) => onPilotNameChange(e.target.value)}
          placeholder="Pilot name"
        />
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
            onClickDelete={() => {
              setFrameStamps((prev) => {
                const newSectors = [...prev.sectors];
                newSectors.splice(index, 1);
                return {
                  ...prev,
                  sectors: newSectors,
                };
              });
            }}
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
            onClickDelete={() => {
              setFrameStamps((prev) => ({
                ...prev,
                start: null,
              }));
            }}
            Icon={RocketIcon}
          />
        )}
        {frameStamps.end !== null && (
          <Section
            title="End"
            frame={frameStamps.end}
            videoProperties={videoProperties}
            onClickDelete={() => {
              setFrameStamps((prev) => ({
                ...prev,
                end: null,
              }));
            }}
            Icon={FlagIcon}
          />
        )}
        <div className="w-[calc(100%+1rem)] -mx-2 h-px bg-border rounded-full" />
        <Section
          title="Resolution"
          text={`${videoProperties.width} x ${videoProperties.height}`}
          Icon={SquareDashedIcon}
          videoProperties={videoProperties}
        />
        <Section
          title="Frame Rate"
          text={`${videoProperties.frameRate}`}
          Icon={TvIcon}
          videoProperties={videoProperties}
        />
        <Section
          title="Duration"
          text={getTimeStringFromFrame({
            frame: videoProperties.totalFrames,
            frameRate: videoProperties.frameRate,
            totalFrames: videoProperties.totalFrames,
          })}
          videoProperties={videoProperties}
          Icon={ClockIcon}
        />
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
  text,
  frame,
  videoProperties,
  className,
  classNameParagraph,
  onClickDelete,
  Icon,
}: {
  title: string;
  videoProperties: TVideoProperties;
  className?: string;
  classNameParagraph?: string;
  onClickDelete?: () => void;
  Icon: FC<{ className?: string }>;
} & (
  | {
      text: string;
      frame?: never;
    }
  | {
      text?: never;
      frame: number | null;
    }
)) {
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
          {text !== undefined
            ? text
            : frame !== null
            ? getTimeStringFromFrame({
                frame,
                frameRate: videoProperties.frameRate,
                totalFrames: videoProperties.totalFrames,
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
