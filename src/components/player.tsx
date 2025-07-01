"use client";

import ButtonsBar from "@/components/buttons-bar";
import { getTimeString } from "@/components/helpers";
import { Indicator } from "@/components/indicator";
import Sidebar from "@/components/sidebar";
import { TFrameStamps, TVideoProperties } from "@/components/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FFprobeWorker } from "ffprobe-wasm";
import {
  ChevronLeft,
  ChevronRight,
  FlagIcon,
  MapPinIcon,
  PauseIcon,
  PlayIcon,
  RocketIcon,
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

  const updateSliderPosition = useCallback(() => {
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
  }, [isDragging, isPlaying, videoProperties]);

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
  }, [videoProperties]);

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
  }, [videoProperties]);

  const Indicators = useCallback(() => {
    if (!videoProperties) return null;
    return (
      <>
        {frameStamps.start !== null && (
          <Indicator
            frame={frameStamps.start}
            videoProperties={videoProperties}
            className="bg-progress"
            Icon={RocketIcon}
            classNameIcon="bg-progress"
          />
        )}
        {frameStamps.end !== null && (
          <Indicator
            frame={frameStamps.end}
            videoProperties={videoProperties}
            className="bg-success"
            Icon={FlagIcon}
            classNameIcon="bg-success"
          />
        )}
        {frameStamps.sectors.map((sector, index) => (
          <Indicator
            key={index}
            frame={sector}
            videoProperties={videoProperties}
            className="bg-warning"
            Icon={MapPinIcon}
            classNameIcon="bg-warning"
          />
        ))}
      </>
    );
  }, [videoProperties, frameStamps]);

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
  }, [isPlaying, videoProperties, updateSliderPosition]);

  useHotkeys("space", togglePlayPause, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys("arrowleft", goToPrevFrame, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys("arrowright", goToNextFrame, {
    enableOnContentEditable: true,
    enableOnFormTags: false,
  });

  useHotkeys(
    "backspace,delete",
    () => {
      if (sliderValue[0] === frameStamps.start) {
        setFrameStamps((prev) => ({
          ...prev,
          start: null,
        }));
        return;
      }
      if (sliderValue[0] === frameStamps.end) {
        setFrameStamps((prev) => ({
          ...prev,
          end: null,
        }));
        return;
      }
      if (frameStamps.sectors.includes(sliderValue[0])) {
        setFrameStamps((prev) => ({
          ...prev,
          sectors: prev.sectors.filter((s) => s !== sliderValue[0]),
        }));
        return;
      }
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: false,
    }
  );

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
                    Indicators={Indicators}
                  />
                  <ButtonsBar
                    frameStamps={frameStamps}
                    setFrameStamps={setFrameStamps}
                    sliderValue={sliderValue}
                  />
                </div>
              </div>
            </div>
          </div>
          <Sidebar
            frameStamps={frameStamps}
            setFrameStamps={setFrameStamps}
            videoProperties={videoProperties}
          />
        </div>
      )}
    </div>
  );
}
