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

  // Debounce all filter values with 500ms delay
  const debouncedMinFit = useDebounce(minFit, 500);
  const debouncedMinSalary = useDebounce(minSalary, 500);
  const debouncedLocation = useDebounce(location, 500);
  const debouncedSearch = useDebounce(search, 500);
  const debouncedSources = useDebounce(sources, 500);
  const debouncedSortBy = useDebounce(sortBy, 500);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedMinFit) params.set("minFit", String(debouncedMinFit));
    if (debouncedMinSalary) params.set("minSalary", String(debouncedMinSalary));
    if (debouncedLocation) params.set("location", debouncedLocation);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (debouncedSources.length > 0) {
      debouncedSources.forEach((s) => params.append("source", s));
    }
    if (debouncedSortBy && debouncedSortBy !== "fit")
      params.set("sortBy", debouncedSortBy);
    router.replace(`/jobs?${params.toString()}`, { scroll: false });
  }, [
    debouncedMinFit,
    debouncedMinSalary,
    debouncedLocation,
    debouncedSearch,
    debouncedSources,
    debouncedSortBy,
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
        lg:shadow-lg lg:rounded-2xl lg:bg-zinc-50 dark:lg:bg-zinc-950 lg:border-none"
    >
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4">
        <div>
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Min Fit
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={minFit}
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
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            type="number"
            value={minSalary}
            onChange={(e) => setMinSalary(Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Location
          </label>
          <input
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-zinc-700 dark:text-zinc-200">
            Search
          </label>
          <input
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            value={search}
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
              className="block text-sm text-zinc-700 dark:text-zinc-200"
            >
              <input
                type="checkbox"
                checked={sources.includes(s)}
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
            className="border p-1 w-full bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="fit">Fit (desc)</option>
            <option value="date">Newest</option>
            <option value="salary">Salary</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
