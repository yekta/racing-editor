"use client";

import { getTimeString } from "@/components/helpers";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { FFprobeWorker } from "ffprobe-wasm";
import {
  ChevronLeft,
  ChevronRight,
  FlagIcon,
  MapPin,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const worker = new FFprobeWorker();

export default function Player() {
  const [videoProperties, setVideoProperties] =
    useState<TVideoProperties | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderValue, setSliderValue] = useState([0]);
  const [isDragging, setIsDragging] = useState(false);
  const [frameStamps, setFrameStamps] = useState<TFrameStamps>({
    start: null,
    end: null,
    sectors: [],
  });

  const animationFrameRef = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const result = await worker.getFileInfo(file);
      if (result.streams.length > 0) {
        const stream = result.streams[0];
        console.log(stream);
        setVideoProperties({
          url: URL.createObjectURL(file),
          width: stream.codec_width,
          height: stream.codec_height,
          frameRate: Number(stream.avg_frame_rate.split("/")[0]),
          totalFrames: Number(stream.nb_frames),
          duration: Number(stream.duration),
        });
      }
    }
  };

  // Update slider as video plays
  const handleTimeUpdate = () => {
    if (videoRef.current && videoProperties && !isDragging) {
      const currentTime = videoRef.current.currentTime;
      const currentFrame = Math.round(
        (currentTime / videoProperties.duration) * videoProperties.totalFrames
      );
      setSliderValue([currentFrame]);
    }
  };

  const updateSliderPosition = () => {
    if (videoRef.current && videoProperties && !isDragging && isPlaying) {
      const currentTime = videoRef.current.currentTime;
      const currentFrame = Math.round(
        (currentTime / videoProperties.duration) * videoProperties.totalFrames
      );
      setSliderValue([currentFrame]);
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateSliderPosition);
    }
  };

  const togglePlayPause = useCallback(() => {
    setIsPlaying((p) => {
      const newIsPlaying = !p;
      if (newIsPlaying) {
        videoRef.current?.play();
      } else {
        videoRef.current?.pause();
      }
      return newIsPlaying;
    });
  }, []);

  const goToPrevFrame = useCallback(() => {
    if (!videoRef.current || !videoProperties) return;
    videoRef.current.pause();
    const currentFrame = Math.round(
      (videoRef.current.currentTime / videoProperties.duration) *
        videoProperties.totalFrames
    );
    const newFrame = Math.max(0, currentFrame - 1);
    setSliderValue([newFrame]);
    const newTime =
      (newFrame / videoProperties.totalFrames) * videoProperties.duration;
    videoRef.current.currentTime = newTime;
  }, []);

  const goToNextFrame = useCallback(() => {
    if (!videoRef.current || !videoProperties) return;
    videoRef.current.pause();
    const currentFrame = Math.round(
      (videoRef.current.currentTime / videoProperties.duration) *
        videoProperties.totalFrames
    );
    const newFrame = Math.min(videoProperties.totalFrames, currentFrame + 1);
    setSliderValue([newFrame]);
    const newTime =
      (newFrame / videoProperties.totalFrames) * videoProperties.duration;
    videoRef.current.currentTime = newTime;
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
        // Start the smooth update loop
        updateSliderPosition();
      } else {
        videoRef.current.pause();
        // Cancel the animation frame when paused
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, videoProperties]);

  useHotkeys("space", togglePlayPause, {
    enableOnContentEditable: true,
    enableOnFormTags: true,
  });

  useHotkeys("arrowleft", goToPrevFrame, {
    enableOnContentEditable: true,
    enableOnFormTags: true,
  });

  useHotkeys("arrowright", goToNextFrame, {
    enableOnContentEditable: true,
    enableOnFormTags: true,
  });

  return (
    <div className="w-full h-[100svh] flex flex-col">
      {!videoProperties && (
        <input className="m-auto" type="file" onChange={handleFileUpload} />
      )}
      {videoProperties && (
        <div className="w-full flex flex-1 overflow-hidden">
          <div className="w-full flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="w-full flex-1 min-h-0 overflow-hidden flex justify-center">
              <video
                className="w-full h-full object-contain"
                ref={videoRef}
                src={videoProperties.url}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
            <div className="w-full flex flex-col border-t p-4">
              <div className="w-full flex items-start gap-4">
                <div className="flex flex-col gap-4">
                  <p className="w-full leading-tight -mt-1 px-1 select-none opacity-0">
                    a
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="size-12 border-none"
                      size="icon"
                      variant="outline"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? (
                        <PauseIcon className="size-6" />
                      ) : (
                        <PlayIcon className="size-6" />
                      )}
                    </Button>
                    <div className="flex">
                      <Button
                        className="size-12 rounded-r-none border-none"
                        size="icon"
                        variant="outline"
                        onClick={goToPrevFrame}
                      >
                        <ChevronLeft className="size-6" />
                      </Button>
                      <Button
                        className="size-12 rounded-l-none border-none"
                        size="icon"
                        variant="outline"
                        onClick={goToNextFrame}
                      >
                        <ChevronRight className="size-6" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <p className="w-full leading-tight -mt-1 px-1">
                    {getTimeString(videoRef.current?.currentTime || 0)}
                    <span className="px-[0.5ch]">{"/"}</span>
                    {getTimeString(
                      videoProperties.totalFrames / videoProperties.frameRate
                    )}{" "}
                    <span className="text-muted-foreground">
                      <span className="px-[0.25ch]">(</span>
                      {sliderValue[0]
                        .toString()
                        .padStart(
                          videoProperties.totalFrames.toString().length,
                          "0"
                        )}
                      <span className="px-[0.5ch]">{"/"}</span>
                      {videoProperties.totalFrames}
                      <span className="px-[0.25ch]">)</span>
                    </span>
                  </p>
                  <div className="flex-1 relative">
                    {frameStamps.start !== null && (
                      <Indicator
                        frame={frameStamps.start}
                        videoProperties={videoProperties}
                        className="bg-destructive"
                      />
                    )}
                    {frameStamps.end !== null && (
                      <Indicator
                        frame={frameStamps.end}
                        videoProperties={videoProperties}
                        className="bg-success"
                      />
                    )}

                    {frameStamps.sectors.map((sector, index) => (
                      <Indicator
                        key={index}
                        frame={sector}
                        videoProperties={videoProperties}
                        className="bg-warning"
                      />
                    ))}
                    <Slider
                      value={sliderValue}
                      onKeyDown={(e) => {
                        e.preventDefault();
                      }}
                      onValueChange={(value) => {
                        setSliderValue(value);
                        if (videoRef.current && videoProperties) {
                          const newTime =
                            (value[0] / videoProperties.totalFrames) *
                            videoProperties.duration;
                          videoRef.current.currentTime = newTime;
                        }
                        videoRef.current?.pause();
                      }}
                      onPointerDown={() => setIsDragging(true)}
                      onPointerUp={() => setIsDragging(false)}
                      min={0}
                      max={videoProperties.totalFrames}
                      step={1}
                    />
                  </div>
                  <div className="w-full gap-2 flex">
                    <Button
                      variant="destructive"
                      className="font-extrabold px-3 py-1.5 rounded-sm"
                      onClick={() => {
                        setFrameStamps((prev) => ({
                          ...prev,
                          start: sliderValue[0],
                        }));
                      }}
                    >
                      <FlagIcon className="size-4 -ml-0.75" />
                      <p>Set Start</p>
                    </Button>
                    <Button
                      variant="success"
                      className="font-extrabold px-3 py-1.5 rounded-sm"
                      onClick={() => {
                        setFrameStamps((prev) => ({
                          ...prev,
                          end: sliderValue[0],
                        }));
                      }}
                    >
                      <FlagIcon className="size-4 -ml-0.75 rotate-y-180" />
                      Set End
                    </Button>
                    <Button
                      variant="warning"
                      disabled={
                        frameStamps.start === null ||
                        frameStamps.end === null ||
                        sliderValue[0] <= frameStamps.start ||
                        sliderValue[0] >= frameStamps.end
                      }
                      className="font-extrabold px-3 py-1.5 rounded-sm"
                      onClick={() => {
                        if (frameStamps.sectors.includes(sliderValue[0])) {
                          setFrameStamps((prev) => ({
                            ...prev,
                            sectors: prev.sectors.filter(
                              (s) => s !== sliderValue[0]
                            ),
                          }));
                          return;
                        }
                        setFrameStamps((prev) => ({
                          ...prev,
                          sectors: [...prev.sectors, sliderValue[0]].sort(
                            (a, b) => a - b
                          ),
                        }));
                      }}
                    >
                      <MapPin className="size-4 -ml-0.75" />
                      {frameStamps.sectors.includes(sliderValue[0])
                        ? "Remove Sector"
                        : "Set Sector"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Sidebar
            frameStamps={frameStamps}
            videoProperties={videoProperties}
          />
        </div>
      )}
    </div>
  );
}

function Indicator({
  frame,
  videoProperties,
  className,
}: {
  frame: number;
  videoProperties: TVideoProperties;
  className?: string;
}) {
  return (
    <div
      style={{
        left: `${(frame / videoProperties.totalFrames) * 100}%`,
      }}
      className={cn(
        "bg-foreground ring-2 ring-background absolute top-1/2 -translate-y-1/2 h-[calc(100%+0.75rem)] rounded-full w-1 -translate-x-1/2 pointer-events-none",
        className
      )}
    />
  );
}

export type TVideoProperties = {
  url: string;
  width: number;
  height: number;
  frameRate: number;
  totalFrames: number;
  duration: number;
};

export type TFrameStamps = {
  start: number | null;
  end: number | null;
  sectors: number[];
};
