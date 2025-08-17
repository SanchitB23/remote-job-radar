import JobCardSkeleton from "./JobCardSkeleton";
import FilterSidebarSkeleton from "./FilterSidebarSkeleton";

export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start pt-0 lg:pt-0">
      <div className="lg:col-span-1 lg:sticky lg:top-4">
        <FilterSidebarSkeleton />
      </div>
      <div className="lg:col-span-3">
        <ul className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}
