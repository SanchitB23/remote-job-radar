export default function FilterSidebarSkeleton() {
  return (
    <aside
      className="border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-3 flex flex-col gap-3 w-full mb-4
        sm:rounded-lg
        lg:w-72 lg:mb-0 lg:mr-4 lg:sticky lg:top-4
        lg:shadow-lg lg:rounded-2xl lg:bg-zinc-50 dark:lg:bg-zinc-950 lg:border-none animate-pulse"
    >
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
        <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
        <div className="col-span-2 h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
        <div className="col-span-2 h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
        <div className="col-span-2 h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
        <div className="col-span-2 h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
      </div>
    </aside>
  );
}
