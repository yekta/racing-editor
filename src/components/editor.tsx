"use client";

import ButtonsBar from "@/components/buttons-bar";
import Indicators from "@/components/indicators";

import PlayPauseSection from "@/components/play-pause-section";
import Sidebar from "@/components/sidebar";
import TimestampSection from "@/components/timestamp-section";
import { TFrameStamps, TVideoProperties } from "@/components/types";
import { Slider } from "@/components/ui/slider";
import Video from "@/components/video";
import useAppHotkeys from "@/lib/use-app-hotkeys";
import { FFprobeWorker } from "ffprobe-wasm";
import { useCallback, useEffect, useRef, useState } from "react";

const worker = new FFprobeWorker();

export default function Editor() {
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

  const jumpToPrevIndicator = useCallback(() => {
    if (!videoRef.current || !videoProperties) return;
    videoRef.current.pause();

    const currentFrame = Math.round(
      (videoRef.current.currentTime / videoProperties.duration) *
        videoProperties.totalFrames
    );

    const allFrameStamps = [
      frameStamps.start,
      frameStamps.end,
      ...frameStamps.sectors,
    ].filter((s) => s !== null) as number[];

    const prevFrameStamp = allFrameStamps
      .filter((s) => s < currentFrame)
      .sort((a, b) => b - a)[0];

    if (prevFrameStamp !== undefined) {
      setSliderValue([prevFrameStamp]);
      const newTime =
        (prevFrameStamp / videoProperties.totalFrames) *
        videoProperties.duration;
      videoRef.current.currentTime = newTime;
    }
  }, [videoProperties, frameStamps]);

  const jumpToNextIndicator = useCallback(() => {
    if (!videoRef.current || !videoProperties) return;
    videoRef.current.pause();

    const currentFrame = Math.round(
      (videoRef.current.currentTime / videoProperties.duration) *
        videoProperties.totalFrames
    );

    const allFrameStamps = [
      frameStamps.start,
      frameStamps.end,
      ...frameStamps.sectors,
    ].filter((s) => s !== null) as number[];

    const nextFrameStamp = allFrameStamps
      .filter((s) => s > currentFrame)
      .sort((a, b) => a - b)[0];

    if (nextFrameStamp !== undefined) {
      setSliderValue([nextFrameStamp]);
      const newTime =
        (nextFrameStamp / videoProperties.totalFrames) *
        videoProperties.duration;
      videoRef.current.currentTime = newTime;
    }
  }, [videoProperties, frameStamps]);

  const Indicators_ = useCallback(() => {
    if (!videoProperties) return null;
    return (
      <Indicators frameStamps={frameStamps} videoProperties={videoProperties} />
    );
  }, [frameStamps, videoProperties]);

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

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, videoProperties, updateSliderPosition]);

  useAppHotkeys({
    togglePlayPause,
    goToPrevFrame,
    goToNextFrame,
    frameStamps,
    setFrameStamps,
    sliderValue,
    jumpToPrevIndicator,
    jumpToNextIndicator,
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
              <Video
                videoRef={videoRef}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                videoProperties={videoProperties}
              />
            </div>
            <div className="w-full flex flex-col border-t p-4">
              <div className="w-full flex items-start gap-4">
                <PlayPauseSection
                  togglePlayPause={togglePlayPause}
                  goToPrevFrame={goToPrevFrame}
                  goToNextFrame={goToNextFrame}
                  isPlaying={isPlaying}
                />
                <div className="flex-1 flex flex-col gap-4">
                  <TimestampSection
                    videoProperties={videoProperties}
                    sliderValue={sliderValue}
                    videoRef={videoRef}
                    frameStamps={frameStamps}
                  />
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
                    className="group/slider"
                    data-at-start={
                      frameStamps.start === sliderValue[0] ? true : undefined
                    }
                    data-at-end={
                      frameStamps.end === sliderValue[0] ? true : undefined
                    }
                    data-at-sector={
                      frameStamps.sectors.includes(sliderValue[0])
                        ? true
                        : undefined
                    }
                    classNameThumb="group-data-[at-start]/slider:bg-progress group-data-[at-end]/slider:bg-success group-data-[at-sector]/slider:bg-warning"
                    classNameThumbIndicator="group-data-[at-start]/slider:bg-progress group-data-[at-end]/slider:bg-success group-data-[at-sector]/slider:bg-warning"
                    min={0}
                    max={videoProperties.totalFrames}
                    step={1}
                    Indicators={Indicators_}
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
