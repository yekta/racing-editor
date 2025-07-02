import { getTimeStringFromFrame } from "@/components/editor/helpers";
import { TFrameStamps, TVideoProperties } from "@/components/editor/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/server/trpc/setup/client";
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
import { Dispatch, FC, SetStateAction } from "react";

type TProps = {
  frameStamps: TFrameStamps;
  setFrameStamps: Dispatch<SetStateAction<TFrameStamps>>;
  videoProperties: TVideoProperties;
  pilotName: string;
  onPilotNameChange: (value: string) => void;
  isPendingUploadVideo: boolean;
  errorUploadVideo: string | undefined;
};

export default function Sidebar({
  frameStamps,
  setFrameStamps,
  videoProperties,
  pilotName,
  onPilotNameChange,
  isPendingUploadVideo,
}: /* errorUploadVideo, */
TProps) {
  const {
    mutate: renderVideo,
    isPending: isPendingRenderVideo,
    /* error: errorPendingVideo, */
  } = api.render.renderVideo.useMutation();

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
          onClick={() =>
            renderVideo({ id: videoProperties.id, pilotName, ...frameStamps })
          }
          disabled={isPendingRenderVideo || isPendingUploadVideo}
          className="w-full font-extrabold"
        >
          {isPendingUploadVideo
            ? "Uploading Video"
            : isPendingRenderVideo
            ? `Rendering Video...`
            : "Render"}
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
