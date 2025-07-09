"use client";

import { createFFprobeWorker } from "@/components/helpers";
import Indicators from "@/components/indicators";

import PlayPauseSection from "@/components/play-pause-section";
import Sidebar from "@/components/sidebar";
import TimestampSection from "@/components/timestamp-section";
import { TFrameStamps, TVideoProperties } from "@/components/types";
import { Slider } from "@/components/ui/slider";
import Video from "@/components/video";
import VideoDropzone from "@/components/video-dropzone";
import useAppHotkeys from "@/lib/use-app-hotkeys";
import Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const [pilotName, setPilotName] = useState("");
  const stageRef = useRef<Konva.Stage | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  const [overlayProgress, setOverlayProgress] = useState(0);

  // Safe play function that handles promises properly
  const safePlay = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      // Wait for any pending play promise to resolve
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }

      playPromiseRef.current = videoRef.current.play();
      await playPromiseRef.current;
      playPromiseRef.current = null;
    } catch (error) {
      // Handle play interruption gracefully
      console.log("Play interrupted:", error);
      playPromiseRef.current = null;
    }
  }, []);

  // Safe pause function
  const safePause = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      // Wait for any pending play promise to resolve first
      if (playPromiseRef.current) {
        await playPromiseRef.current;
        playPromiseRef.current = null;
      }

      videoRef.current.pause();
    } catch (error) {
      console.log("Pause error:", error);
    }
  }, []);

  const onDropFile = async (file: File) => {
    if (file && file.type.startsWith("video/")) {
      const worker = await createFFprobeWorker();
      if (worker === null) {
        console.error("Failed to create FFprobe worker");
        return;
      }
      const result = await worker.getFileInfo(file);
      if (result.streams.length > 0) {
        const stream = result.streams[0];
        setVideoProperties({
          url: URL.createObjectURL(file),
          extension: file.name.split(".").pop() || "mp4",
          width: stream.codec_width,
          height: stream.codec_height,
          frameRate: Number(stream.avg_frame_rate.split("/")[0]),
          totalFrames: Math.floor(
            Number(stream.duration) *
              Number(stream.avg_frame_rate.split("/")[0])
          ),
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

  const togglePlayPause = useCallback(async () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    if (newIsPlaying) {
      await safePlay();
    } else {
      await safePause();
    }
  }, [isPlaying, safePlay, safePause]);

  const getCurrentTime = useCallback(
    (value: number) => {
      if (videoRef.current && videoProperties) {
        return (value / videoProperties.totalFrames) * videoProperties.duration;
      }
      return 0;
    },
    [videoProperties]
  );

  const goToPrevFrame = useCallback(async () => {
    if (!videoRef.current || !videoProperties) return;

    // Always pause first and update playing state
    setIsPlaying(false);
    await safePause();

    setSliderValue((value) => {
      const newValue = [Math.max(0, value[0] - 1)];
      if (videoRef.current) {
        videoRef.current.currentTime = getCurrentTime(newValue[0]);
      }
      return newValue;
    });
  }, [videoProperties, safePause, getCurrentTime]);

  const goToNextFrame = useCallback(async () => {
    if (!videoRef.current || !videoProperties) return;

    // Always pause first and update playing state
    setIsPlaying(false);
    await safePause();

    setSliderValue((value) => {
      const newValue = [Math.min(videoProperties.totalFrames, value[0] + 1)];
      if (videoRef.current) {
        videoRef.current.currentTime = getCurrentTime(newValue[0]);
      }
      return newValue;
    });
  }, [videoProperties, safePause, getCurrentTime]);

  const goToPrevFrameMulti = useCallback(async () => {
    if (!videoRef.current || !videoProperties) return;

    // Always pause first and update playing state
    setIsPlaying(false);
    await safePause();

    setSliderValue((value) => {
      const newValue = [Math.max(0, value[0] - videoProperties.frameRate / 2)];
      if (videoRef.current !== null) {
        videoRef.current.currentTime = getCurrentTime(newValue[0]);
      }
      return newValue;
    });
  }, [videoProperties, safePause, getCurrentTime]);

  const goToNextFrameMulti = useCallback(async () => {
    if (!videoRef.current || !videoProperties) return;

    // Always pause first and update playing state
    setIsPlaying(false);
    await safePause();

    setSliderValue((value) => {
      const newValue = [
        Math.min(
          videoProperties.totalFrames,
          value[0] + videoProperties.frameRate / 2
        ),
      ];
      if (videoRef.current !== null) {
        videoRef.current.currentTime = getCurrentTime(newValue[0]);
      }
      return newValue;
    });
  }, [videoProperties, safePause, getCurrentTime]);

  const jumpToPrevIndicator = useCallback(async () => {
    if (!videoRef.current || !videoProperties) return;

    setIsPlaying(false);
    await safePause();

    const currentFrame = sliderValue[0];

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
      videoRef.current.currentTime = getCurrentTime(prevFrameStamp);
      return;
    }

    videoRef.current.currentTime = 0;
    setSliderValue([0]);
  }, [videoProperties, frameStamps, safePause, sliderValue, getCurrentTime]);

  const jumpToNextIndicator = useCallback(async () => {
    if (!videoRef.current || !videoProperties) return;

    setIsPlaying(false);
    await safePause();

    const currentFrame = sliderValue[0];

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
      videoRef.current.currentTime = getCurrentTime(nextFrameStamp);
      return;
    }

    setSliderValue([videoProperties.totalFrames]);
    videoRef.current.currentTime = videoProperties.duration;
  }, [videoProperties, frameStamps, safePause, sliderValue, getCurrentTime]);

  const Indicators_ = useCallback(() => {
    if (!videoProperties) return null;
    return (
      <Indicators frameStamps={frameStamps} videoProperties={videoProperties} />
    );
  }, [frameStamps, videoProperties]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        safePlay();
        // Start the smooth update loop
        updateSliderPosition();
      } else {
        safePause();
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
  }, [isPlaying, videoProperties, updateSliderPosition, safePlay, safePause]);

  useAppHotkeys({
    togglePlayPause,
    goToPrevFrame,
    goToNextFrame,
    goToNextFrameMulti,
    goToPrevFrameMulti,
    frameStamps,
    setFrameStamps,
    sliderValue,
    jumpToPrevIndicator,
    jumpToNextIndicator,
  });

  return (
    <div className="w-full h-[100svh] flex flex-col">
      {!videoProperties && <VideoDropzone onDropFile={onDropFile} />}
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
                frameStamps={frameStamps}
                sliderValue={sliderValue}
                pilotName={pilotName}
                stageRef={stageRef}
                isRendering={isRendering}
                ffmpegProgress={ffmpegProgress}
                overlayProgress={overlayProgress}
              />
            </div>
            <div className="w-full flex flex-col border-t px-4 pt-4 pb-[calc(var(--safe-area-inset-bottom)+1rem)]">
              <div className="w-full flex flex-col lg:flex-row gap-4">
                <PlayPauseSection
                  togglePlayPause={togglePlayPause}
                  goToPrevFrame={goToPrevFrame}
                  goToNextFrame={goToNextFrame}
                  isPlaying={isPlaying}
                  frameStamps={frameStamps}
                  setFrameStamps={setFrameStamps}
                  sliderValue={sliderValue}
                />
                <div className="w-full flex flex-col gap-3 order-first lg:order-none">
                  <TimestampSection
                    videoProperties={videoProperties}
                    sliderValue={sliderValue}
                    frameStamps={frameStamps}
                    isPlaying={isPlaying}
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
                      // Only pause if we're currently playing
                      if (isPlaying) {
                        setIsPlaying(false);
                        safePause();
                      }
                    }}
                    onPointerDown={() => {
                      setIsDragging(true);
                      // Pause when starting to drag
                      if (isPlaying) {
                        setIsPlaying(false);
                        safePause();
                      }
                    }}
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
                </div>
              </div>
            </div>
          </div>
          <Sidebar
            pilotName={pilotName}
            onPilotNameChange={setPilotName}
            frameStamps={frameStamps}
            setFrameStamps={setFrameStamps}
            videoProperties={videoProperties}
            isRendering={isRendering}
            setIsRendering={setIsRendering}
            ffmpegProgress={ffmpegProgress}
            setFfmpegProgress={setFfmpegProgress}
            overlayProgress={overlayProgress}
            setOverlayProgress={setOverlayProgress}
          />
        </div>
      )}
    </div>
  );
}
