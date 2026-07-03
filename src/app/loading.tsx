export default function Loading() {
  return (
    <div className="max-w-7xl animate-pulse">
      <div className="h-8 w-48 rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-64 rounded bg-neutral-100" />
      <div className="mt-6 grid gap-3">
        <div className="h-20 rounded-lg bg-neutral-100" />
        <div className="h-20 rounded-lg bg-neutral-100" />
        <div className="h-20 rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}
