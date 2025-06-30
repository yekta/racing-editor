import Player from "@/components/player";

export default function Home() {
  return (
    <div className="h-[100svh] font-mono dark bg-background text-foreground w-full overflow-hidden fixed left-0 top-0 flex flex-col">
      <main className="w-full flex flex-1">
        <Player />
        <div className="w-80 flex flex-col border-l"></div>
      </main>
    </div>
  );
}
