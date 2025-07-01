export function getTimeString({
  time,
  maxTime,
}: {
  time: number;
  maxTime?: number;
}): string {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 1000);

  const shouldHaveHours = maxTime !== undefined && maxTime >= 3600;
  const shouldHaveMinutes = maxTime !== undefined && maxTime >= 60;

  if (hours >= 1 || shouldHaveHours) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
      .toString()
      .padStart(3, "0")
      .slice(0, 2)}`;
  }

  if (minutes >= 1 || shouldHaveMinutes) {
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds
      .toString()
      .padStart(3, "0")
      .slice(0, 2)}`;
  }

  return `${seconds.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(3, "0")
    .slice(0, 2)}`;
}

export function getTimeStringFromFrame({
  frame,
  frameRate,
  totalFrames,
}: {
  frame: number;
  frameRate: number;
  totalFrames: number;
}): string {
  const time = frame / frameRate;
  const maxTime = totalFrames / frameRate;
  return getTimeString({ time, maxTime });
}
