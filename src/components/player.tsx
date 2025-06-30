"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FFprobeWorker } from "ffprobe-wasm";
import { ChevronLeft, ChevronRight, PauseIcon, PlayIcon } from "lucide-react";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const worker = new FFprobeWorker();

type TProps = {};

export default function Player({}: TProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoProps, setVideoProps] = useState<TVideoProperties | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderValue, setSliderValue] = useState([0]);
  const [isDragging, setIsDragging] = useState(false);
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
        setVideoFile(file);
        console.log(stream);
        setVideoProps({
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
    if (videoRef.current && videoProps && !isDragging) {
      const currentTime = videoRef.current.currentTime;
      const currentFrame = Math.round(
        (currentTime / videoProps.duration) * videoProps.totalFrames
      );
      setSliderValue([currentFrame]);
    }
  };

  const updateSliderPosition = () => {
    if (videoRef.current && videoProps && !isDragging && isPlaying) {
      const currentTime = videoRef.current.currentTime;
      const currentFrame = Math.round(
        (currentTime / videoProps.duration) * videoProps.totalFrames
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
    if (!videoRef.current || !videoProps) return;
    videoRef.current.pause();
    const currentFrame = Math.round(
      (videoRef.current.currentTime / videoProps.duration) *
        videoProps.totalFrames
    );
    const newFrame = Math.max(0, currentFrame - 1);
    setSliderValue([newFrame]);
    const newTime = (newFrame / videoProps.totalFrames) * videoProps.duration;
    videoRef.current.currentTime = newTime;
  }, []);

  const goToNextFrame = useCallback(() => {
    if (!videoRef.current || !videoProps) return;
    videoRef.current.pause();
    const currentFrame = Math.round(
      (videoRef.current.currentTime / videoProps.duration) *
        videoProps.totalFrames
    );
    const newFrame = Math.min(videoProps.totalFrames, currentFrame + 1);
    setSliderValue([newFrame]);
    const newTime = (newFrame / videoProps.totalFrames) * videoProps.duration;
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
  }, [isPlaying, videoProps]);

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
    <div className="flex-1 flex flex-col">
      {!videoProps && <input type="file" onChange={handleFileUpload} />}
      {videoProps && (
        <div className="w-full flex flex-col flex-1">
          <div className="w-full flex-1 flex items-center">
            <video
              ref={videoRef}
              src={videoProps.url}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
          <div className="w-full flex flex-col border-t p-4">
            <div className="w-full flex items-end gap-4">
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
              <div className="flex-1 flex flex-col">
                <div className="w-full px-1 py-2 -mt-3 flex text-sm justify-between items-center">
                  <p className="text-left">
                    {getTimeString(videoRef.current?.currentTime || 0)}
                    <span className="px-[0.5ch]">{"/"}</span>
                    {getTimeString(
                      videoProps.totalFrames / videoProps.frameRate
                    )}{" "}
                    <span className="text-muted-foreground">
                      <span className="px-[0.25ch]">(</span>
                      {sliderValue[0]
                        .toString()
                        .padStart(
                          videoProps.totalFrames.toString().length,
                          "0"
                        )}
                      <span className="px-[0.5ch]">{"/"}</span>
                      {videoProps.totalFrames}
                      <span className="px-[0.25ch]">)</span>
                    </span>
                  </p>
                </div>
                <Slider
                  className="w-full"
                  value={sliderValue}
                  onKeyDown={(e) => {
                    e.preventDefault();
                  }}
                  onValueChange={(value) => {
                    setSliderValue(value);
                    if (videoRef.current && videoProps) {
                      const newTime =
                        (value[0] / videoProps.totalFrames) *
                        videoProps.duration;
                      videoRef.current.currentTime = newTime;
                    }
                    videoRef.current?.pause();
                  }}
                  onPointerDown={() => setIsDragging(true)}
                  onPointerUp={() => setIsDragging(false)}
                  min={0}
                  max={videoProps.totalFrames}
                  step={1}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeString(time: number): string {
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 1000);
  return `${seconds.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(3, "0")
    .slice(0, 2)}`;
}

type TVideoProperties = {
  url: string;
  width: number;
  height: number;
  frameRate: number;
  totalFrames: number;
  duration: number;
};
