export default function Cargando() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="animate-gqgpulse flex flex-col gap-4"
    >
      <div className="flex gap-2">
        <div className="h-9 w-full max-w-[360px] rounded-md border border-line bg-surface" />
        <div className="flex-1" />
        <div className="h-9 w-32 rounded-md bg-line" />
      </div>
      <div className="rounded-md border border-line bg-surface p-4">
        <div className="mb-6 h-3 w-44 rounded-xs bg-line" />
        <div className="mb-4 h-2.5 rounded-xs bg-head" />
        <div className="mb-4 h-2.5 rounded-xs bg-head" />
        <div className="mb-4 h-2.5 rounded-xs bg-head" />
        <div className="h-2.5 rounded-xs bg-head" />
      </div>
    </div>
  );
}
