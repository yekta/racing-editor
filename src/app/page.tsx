import Editor from "@/components/editor";

export default function Home() {
  return (
    <div className="h-[100svh] w-full overflow-hidden fixed left-0 top-0 flex flex-col">
      <main className="w-full h-[100svh] overflow-hidden">
        <Editor />
      </main>
    </div>
  );
}
