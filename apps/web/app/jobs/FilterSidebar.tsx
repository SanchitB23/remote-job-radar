"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useFilterMetadata } from "../../lib/hooks";
import { useDebounce } from "../../lib/useDebounce";

export function FilterSidebar(): JSX.Element {
  const router = useRouter();
  const q = useSearchParams();
  const {
    data: filterMetadata,
    isLoading: isLoadingMetadata,
    error: filterMetadataError,
    refetch: refetchFilterMetadata,
  } = useFilterMetadata();

  // Default minFit changed from 10 to 0 for broader results; adjust DEFAULT_MIN_FIT to change this behavior.
  const DEFAULT_MIN_FIT = 0;
  const [minFit, setMinFit] = useState(Number(q.get("minFit") ?? DEFAULT_MIN_FIT));
  const [minSalary, setMinSalary] = useState(Number(q.get("minSalary") ?? 0));
  const [search, setSearch] = useState(q.get("search") ?? "");
  const [sources, setSources] = useState<string[]>(
    q.getAll("source").length ? q.getAll("source") : [],
  );
  const [workTypes, setWorkTypes] = useState<string[]>(
    q.getAll("workType").length ? q.getAll("workType") : [],
  );
  // Use enum values for sortBy (FIT, DATE, SALARY)
  const [sortBy, setSortBy] = useState(() => {
    const param = q.get("sortBy");
    if (param === "DATE" || param === "SALARY" || param === "FIT") return param;
    // Support legacy values for backward compatibility
    if (param === "date") return "DATE";
    if (param === "salary") return "SALARY";
    if (param === "fit") return "FIT";
    return "FIT";
  });

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
  // Using 300ms debounce for more responsive filtering UX; increase to 500ms if API load is a concern
  const debouncedSearch = useDebounce(search, 300);
  // No debouncing needed for click-based filters: sources, workTypes, sortBy, bookmarked, isTracked

  useEffect(() => {
    setIsApplyingFilters(true);

    const params = new URLSearchParams();
    if (debouncedMinFit) params.set("minFit", String(debouncedMinFit));
    if (debouncedMinSalary) params.set("minSalary", String(debouncedMinSalary));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sources.length > 0) {
      sources.forEach((s) => params.append("sources", s.toUpperCase()));
    }
    if (workTypes.length > 0) {
      workTypes.forEach((w) => params.append("workType", w));
    }
    if (sortBy && sortBy !== "FIT") params.set("sortBy", sortBy);

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
    debouncedSearch,
    sources,
    workTypes,
    sortBy,
    bookmarked,
    isTracked,
    router,
  ]);

  useEffect(() => {
    if (filterMetadataError) {
      toast.error("Failed to load filter options. Using default values.", {
        id: "filter-metadata-error",
        duration: 5000,
      });
    }
  }, [filterMetadataError]);

  function toggleSource(s: string): void {
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function toggleWorkType(w: string): void {
    setWorkTypes((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
  }

  // Get dynamic values with fallbacks
  const fitScoreMin = filterMetadata?.fitScore?.min ?? 0;
  const fitScoreMax = filterMetadata?.fitScore?.max ?? 100;
  const salaryMax = filterMetadata?.salary?.max ?? 200000;
  const availableSources = filterMetadata?.sources ?? ["remotive", "adzuna"];
  const availableWorkTypes = filterMetadata?.workTypes ?? [];

  // Error component
  const FilterErrorComponent = (): JSX.Element => (
    <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
      <div className="flex items-center justify-center mb-2">
        <svg
          className="w-5 h-5 text-red-500 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span className="text-sm font-medium text-red-800 dark:text-red-200">
          Unable to load filter options
        </span>
      </div>
      <p className="text-xs text-red-600 dark:text-red-300 mb-3">
        Using default values. Some filter options may be limited.
      </p>
      <button
        onClick={() => refetchFilterMetadata()}
        className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <aside
      className="border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-3 flex flex-col gap-3 w-full mb-4
      sm:rounded-lg
      lg:w-72 lg:mb-0 lg:mr-4 lg:sticky lg:top-4
      lg:shadow-lg lg:rounded-2xl lg:bg-zinc-50 dark:lg:bg-zinc-950 lg:border-none relative"
    >
      {/* Error state */}
      {filterMetadataError && <FilterErrorComponent />}

      {/* Subtle loading overlay */}
      {(isApplyingFilters || isLoadingMetadata) && (
        <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      <div
        className={`grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4 transition-opacity ${
          isApplyingFilters || isLoadingMetadata
            ? "pointer-events-none opacity-60"
            : "pointer-events-auto opacity-100"
        } ${filterMetadataError ? "opacity-90" : ""}`}
      >
        <div>
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Min Fit Score
            {filterMetadataError && (
              <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                (default range)
              </span>
            )}
          </label>
          <input
            type="range"
            min={fitScoreMin}
            max={fitScoreMax}
            value={minFit}
            disabled={isApplyingFilters || isLoadingMetadata}
            onChange={(e) => setMinFit(Number(e.target.value))}
          />
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            {minFit}% (range: {fitScoreMin}-{fitScoreMax})
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Min Salary (USD)
            {filterMetadataError && (
              <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                (estimated max)
              </span>
            )}
          </label>
          <input
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="number"
            value={minSalary}
            min={0}
            max={salaryMax}
            disabled={isApplyingFilters || isLoadingMetadata}
            onChange={(e) => setMinSalary(Number(e.target.value))}
          />
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            {filterMetadataError ? "Est. max: " : "Max in data: "}${salaryMax.toLocaleString()}
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">Search</label>
          <input
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={search}
            disabled={isApplyingFilters || isLoadingMetadata}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <div className="text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-200">
            Sources
            {filterMetadataError && (
              <span className="text-xs text-amber-600 dark:text-amber-400 ml-1 font-normal">
                (default list)
              </span>
            )}
          </div>
          {availableSources.map((s) => (
            <label
              key={s}
              className={`block text-sm text-zinc-700 dark:text-zinc-200 ${
                isApplyingFilters || isLoadingMetadata
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                checked={sources.includes(s)}
                disabled={isApplyingFilters || isLoadingMetadata}
                onChange={() => toggleSource(s)}
              />{" "}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </label>
          ))}
        </div>
        <div className="col-span-2">
          <div className="text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-200">
            Work Type
            {filterMetadataError && (
              <span className="text-xs text-amber-600 dark:text-amber-400 ml-1 font-normal">
                (no data)
              </span>
            )}
          </div>
          {availableWorkTypes.length > 0 ? (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {availableWorkTypes.map((w) => (
                <label
                  key={w}
                  className={`block text-sm text-zinc-700 dark:text-zinc-200 ${
                    isApplyingFilters || isLoadingMetadata
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={workTypes.includes(w)}
                    disabled={isApplyingFilters || isLoadingMetadata}
                    onChange={() => toggleWorkType(w)}
                  />{" "}
                  {w}
                </label>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">
              {filterMetadataError ? "Unable to load work types" : "No work types available"}
            </div>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">Sort by</label>
          <select
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={sortBy}
            disabled={isApplyingFilters || isLoadingMetadata}
            onChange={(e) => setSortBy(e.target.value as "FIT" | "DATE" | "SALARY")}
          >
            <option value="FIT">Fit (desc)</option>
            <option value="DATE">Newest</option>
            <option value="SALARY">Salary (desc)</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200 mb-1">Bookmarks</label>
          <select
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={bookmarked === null ? "all" : bookmarked ? "bookmarked" : "unbookmarked"}
            disabled={isApplyingFilters || isLoadingMetadata}
            onChange={(e) => {
              const value = e.target.value;
              setBookmarked(
                value === "bookmarked" ? true : value === "unbookmarked" ? false : null,
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
            value={isTracked === null ? "all" : isTracked ? "tracked" : "untracked"}
            disabled={isApplyingFilters || isLoadingMetadata}
            onChange={(e) => {
              const value = e.target.value;
              setIsTracked(value === "tracked" ? true : value === "untracked" ? false : null);
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
