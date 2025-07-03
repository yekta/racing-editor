import { getTimeStringFromFrame } from "@/components/helpers";
import { TFrameStamps, TVideoProperties } from "@/components/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OverlayVideo } from "@/components/video";
import { cn } from "@/lib/utils";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import Konva from "konva";
import {
  ClockIcon,
  FlagIcon,
  MapPinIcon,
  MenuIcon,
  RocketIcon,
  SquareDashedIcon,
  TimerIcon,
  Trash2Icon,
  TvIcon,
} from "lucide-react";
import {
  createRef,
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";

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
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());

  const load = async () => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      console.log(message);
    });
    ffmpeg.on("progress", ({ progress }) => {
      setFfmpegProgress(progress);
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    /* const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    }); */
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

    const container = document.createElement("div");
    container.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:${videoProperties.width}px;height: ${videoProperties.height}px;`;
    document.body.appendChild(container);
    const stageRef = createRef<Konva.Stage>();
    const root = createRoot(container);
    const overlayPrefix = "overlay";

    try {
      const ffmpeg = ffmpegRef.current;

      for (let f = 0; f < videoProperties.totalFrames; f++) {
        setOverlayProgress(f / videoProperties.totalFrames);
        root.render(
          <OverlayVideo
            stageRef={stageRef}
            pilotName={pilotName}
            frameStamps={frameStamps}
            videoProperties={videoProperties}
            sliderValue={[f]}
          />
        );
        await new Promise<void>((r) => requestAnimationFrame(() => r()));

        const dataURL = stageRef.current!.toDataURL({ pixelRatio: 1 });
        const png = await (await fetch(dataURL)).blob();
        await ffmpeg.writeFile(
          `${overlayPrefix}_${f.toString().padStart(6, "0")}.png`,
          new Uint8Array(await png.arrayBuffer())
        );
      }

      const baseVideoName = `base.${videoProperties.extension}`;

      await ffmpeg.writeFile(
        baseVideoName,
        await fetchFile(videoProperties.url)
      );

      await ffmpeg.exec([
        /* overwrite if output.mp4 exists */
        "-y",

        "-threads",
        "0",

        /* ------------ input #0 : base video ------------ */
        "-thread_queue_size",
        "256",
        "-i",
        baseVideoName,

        /* ------------ input #1 : PNG sequence ---------- */
        "-framerate",
        String(videoProperties.frameRate),
        "-thread_queue_size",
        "256",
        "-i",
        `${overlayPrefix}_%06d.png`,

        /* ------------ filters -------------------------- */
        "-filter_complex",
        `[1:v]setpts=PTS-STARTPTS,fps=${videoProperties.frameRate}[ol];` +
          `[0:v][ol]overlay=0:0:format=auto:shortest=1:eof_action=endall`,

        /* ------------ encode --------------------------- */
        "-map",
        "0:a?",
        "-c:a",
        "copy",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",

        "output.mp4",
      ]);

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
    <>
      <div className="w-80 hidden lg:flex border-l overflow-hidden flex-col relative">
        <Content
          frameStamps={frameStamps}
          onPilotNameChange={onPilotNameChange}
          pilotName={pilotName}
          setFrameStamps={setFrameStamps}
          videoProperties={videoProperties}
          isRendering={isRendering}
          isFfmpegLoaded={isFfmpegLoaded}
          ffmpegProgress={ffmpegProgress}
          overlayProgress={overlayProgress}
          render={render}
        />
      </div>
      <Sheet>
        <SheetTrigger className="lg:hidden fixed left-3 top-3 z-50" asChild>
          <Button variant="ghost" className="bg-foreground/8">
            <MenuIcon className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent hideClose side="left">
          <SheetTitle className="sr-only">Lap Time & Sector Info</SheetTitle>
          <Content
            frameStamps={frameStamps}
            onPilotNameChange={onPilotNameChange}
            pilotName={pilotName}
            setFrameStamps={setFrameStamps}
            videoProperties={videoProperties}
            isRendering={isRendering}
            isFfmpegLoaded={isFfmpegLoaded}
            ffmpegProgress={ffmpegProgress}
            overlayProgress={overlayProgress}
            render={render}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

function Content({
  frameStamps,
  onPilotNameChange,
  pilotName,
  setFrameStamps,
  videoProperties,
  isRendering,
  isFfmpegLoaded,
  ffmpegProgress,
  overlayProgress,
  render,
}: TProps & {
  isRendering: boolean;
  isFfmpegLoaded: boolean;
  ffmpegProgress: number;
  overlayProgress: number;
  render: () => void;
}) {
  return (
    <div className="w-full flex-1 min-w-0 overflow-hidden flex flex-col">
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
      <div className="w-full px-4 pt-4 pb-[calc(var(--safe-area-inset-bottom)+1rem)] border-t">
        <Button
          isPending={isRendering || !isFfmpegLoaded}
          onClick={render}
          disabled={!isFfmpegLoaded || isRendering}
          className="w-full font-extrabold"
        >
          {isRendering && ffmpegProgress > 0
            ? `Rendering Video: ${Math.ceil(ffmpegProgress * 100)}%`
            : isRendering
            ? `Rendering Overlay: ${Math.ceil(overlayProgress * 100)}%`
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
          variant="ghost-destructive"
          className="text-muted-foreground"
          onClick={onClickDelete}
        >
          <Trash2Icon className="size-4.5" />
        </Button>
      )}
    </div>
  );
}
