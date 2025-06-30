import Player from "@/components/player";

export default function Home() {
  return (
    <div className="h-[100svh] break-words font-mono dark bg-background text-foreground w-full overflow-hidden fixed left-0 top-0 flex flex-col">
      <main className="w-full h-[100svh] overflow-hidden">
        <Player />
      </main>
    </div>
  );
}
