"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "../lib/useDebounce";

export default function FilterSidebar() {
  const router = useRouter();
  const q = useSearchParams();
  const [minFit, setMinFit] = useState(Number(q.get("minFit") ?? 10));
  const [minSalary, setMinSalary] = useState(Number(q.get("minSalary") ?? 0));
  const [location, setLocation] = useState(q.get("location") ?? "");
  const [search, setSearch] = useState(q.get("search") ?? "");
  const [sources, setSources] = useState<string[]>(
    q.getAll("source").length ? q.getAll("source") : []
  );
  const [sortBy, setSortBy] = useState(q.get("sortBy") ?? "fit");

  // Track if we're applying filters (for UX feedback)
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  // Three-state filters: null = all, true = only show, false = only hide
  const [bookmarked, setBookmarked] = useState<boolean | null>(() => {
    const param = q.get("bookmarked");
    return param === "true" ? true : param === "false" ? false : null;
  });
  const [isTracked, setIsTracked] = useState<boolean | null>(() => {
    const param = q.get("isTracked");
    return param === "true" ? true : param === "false" ? false : null;
  });

  // Debounce only text/number inputs that change frequently
  const debouncedMinFit = useDebounce(minFit, 300);
  const debouncedMinSalary = useDebounce(minSalary, 300);
  const debouncedLocation = useDebounce(location, 300);
  // Using 300ms debounce for more responsive filtering UX; increase to 500ms if API load is a concern
  const debouncedSearch = useDebounce(search, 300);
  // No debouncing needed for click-based filters: sources, sortBy, bookmarked, isTracked

  useEffect(() => {
    setIsApplyingFilters(true);

    const params = new URLSearchParams();
    if (debouncedMinFit) params.set("minFit", String(debouncedMinFit));
    if (debouncedMinSalary) params.set("minSalary", String(debouncedMinSalary));
    if (debouncedLocation) params.set("location", debouncedLocation);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sources.length > 0) {
      sources.forEach((s) => params.append("sources", s.toUpperCase()));
    }
    if (sortBy && sortBy !== "fit") params.set("sortBy", sortBy);

    // Add bookmark filter
    if (bookmarked !== null) {
      params.set("bookmarked", String(bookmarked));
    }

    // Add tracking filter
    if (isTracked !== null) {
      params.set("isTracked", String(isTracked));
    }

    router.replace(`/jobs?${params.toString()}`, { scroll: false });

    // Reset loading state after a short delay
    const timer = setTimeout(() => {
      setIsApplyingFilters(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [
    debouncedMinFit,
    debouncedMinSalary,
    debouncedLocation,
    debouncedSearch,
    sources,
    sortBy,
    bookmarked,
    isTracked,
    router,
  ]);

  function toggleSource(s: string) {
    setSources((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  return (
    <aside
      className="border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-3 flex flex-col gap-3 w-full mb-4
      sm:rounded-lg
      lg:w-72 lg:mb-0 lg:mr-4 lg:sticky lg:top-4
      lg:shadow-lg lg:rounded-2xl lg:bg-zinc-50 dark:lg:bg-zinc-950 lg:border-none relative"
    >
      {/* Subtle loading overlay */}
      {isApplyingFilters && (
        <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      <div
        className={`grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4 transition-opacity ${
          isApplyingFilters
            ? "pointer-events-none opacity-60"
            : "pointer-events-auto opacity-100"
        }`}
      >
        <div>
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Min Fit
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={minFit}
            disabled={isApplyingFilters}
            onChange={(e) => setMinFit(Number(e.target.value))}
          />
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            {minFit}%
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Min Salary (USD)
          </label>
          <input
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="number"
            value={minSalary}
            disabled={isApplyingFilters}
            onChange={(e) => setMinSalary(Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Location
          </label>
          <input
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={location}
            disabled={isApplyingFilters}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Search
          </label>
          <input
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={search}
            disabled={isApplyingFilters}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <div className="text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-200">
            Sources
          </div>
          {["remotive", "adzuna"].map((s) => (
            <label
              key={s}
              className={`block text-sm text-zinc-700 dark:text-zinc-200 ${
                isApplyingFilters
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                checked={sources.includes(s)}
                disabled={isApplyingFilters}
                onChange={() => toggleSource(s)}
              />{" "}
              {s}
            </label>
          ))}
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Sort by
          </label>
          <select
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={sortBy}
            disabled={isApplyingFilters}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="fit">Fit (desc)</option>
            <option value="date">Newest</option>
            <option value="salary">Salary (desc)</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200 mb-1">
            Bookmarks
          </label>
          <select
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={
              bookmarked === null
                ? "all"
                : bookmarked
                ? "bookmarked"
                : "unbookmarked"
            }
            disabled={isApplyingFilters}
            onChange={(e) => {
              const value = e.target.value;
              setBookmarked(
                value === "bookmarked"
                  ? true
                  : value === "unbookmarked"
                  ? false
                  : null
              );
            }}
          >
            <option value="all">All Jobs</option>
            <option value="bookmarked">Only Bookmarked</option>
            <option value="unbookmarked">Only Unbookmarked</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200 mb-1">
            Tracking Status
          </label>
          <select
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={
              isTracked === null ? "all" : isTracked ? "tracked" : "untracked"
            }
            disabled={isApplyingFilters}
            onChange={(e) => {
              const value = e.target.value;
              setIsTracked(
                value === "tracked"
                  ? true
                  : value === "untracked"
                  ? false
                  : null
              );
            }}
          >
            <option value="all">All Jobs</option>
            <option value="tracked">Only Tracked</option>
            <option value="untracked">Only Untracked</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
