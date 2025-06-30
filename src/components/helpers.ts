export function getTimeString(time: number): string {
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 1000);
  return `${seconds.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(3, "0")
    .slice(0, 2)}`;
}

export function getTimeStringFromFrame({
  frame,
  frameRate,
}: {
  frame: number;
  frameRate: number;
}): string {
  const time = frame / frameRate;
  return getTimeString(time);
}
