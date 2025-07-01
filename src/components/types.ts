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
