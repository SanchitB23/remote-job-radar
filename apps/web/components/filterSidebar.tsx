"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "../lib/useDebounce";

export default function FilterSidebar() {
  const router = useRouter();
  const q = useSearchParams();
  const [minFit, setMinFit] = useState(Number(q.get("minFit") ?? 70));
  const [minSalary, setMinSalary] = useState(Number(q.get("minSalary") ?? 0));
  const [location, setLocation] = useState(q.get("location") ?? "");
  const [search, setSearch] = useState(q.get("search") ?? "");
  const [sources, setSources] = useState<string[]>(
    q.getAll("source").length ? q.getAll("source") : []
  );
  const [sortBy, setSortBy] = useState(q.get("sortBy") ?? "fit");

  // Debounce text inputs with 500ms delay
  const debouncedMinSalary = useDebounce(minSalary, 500);
  const debouncedLocation = useDebounce(location, 500);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const params = new URLSearchParams();
    if (minFit) params.set("minFit", String(minFit));
    if (debouncedMinSalary) params.set("minSalary", String(debouncedMinSalary));
    if (debouncedLocation) params.set("location", debouncedLocation);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sources.length > 0) {
      sources.forEach((s) => params.append("source", s));
    }
    if (sortBy && sortBy !== "fit") params.set("sortBy", sortBy);
    router.replace(`/jobs?${params.toString()}`, { scroll: false });
  }, [
    minFit,
    debouncedMinSalary,
    debouncedLocation,
    debouncedSearch,
    sources,
    sortBy,
    router,
  ]);

  function toggleSource(s: string) {
    setSources((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  return (
    <aside className="w-72 shrink-0 border-l p-3 space-y-3">
      <div>
        <label className="block text-sm">Min Fit</label>
        <input
          type="range"
          min={0}
          max={100}
          value={minFit}
          onChange={(e) => setMinFit(Number(e.target.value))}
        />
        <div className="text-sm">{minFit}%</div>
      </div>
      <div>
        <label className="block text-sm">Min Salary (USD)</label>
        <input
          className="border p-1 w-full"
          type="number"
          value={minSalary}
          onChange={(e) => setMinSalary(Number(e.target.value))}
        />
      </div>
      <div>
        <label className="block text-sm">Location</label>
        <input
          className="border p-1 w-full"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm">Search</label>
        <input
          className="border p-1 w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div>
        <div className="text-sm font-medium mb-1">Sources</div>
        {["remotive", "adzuna"].map((s) => (
          <label key={s} className="block text-sm">
            <input
              type="checkbox"
              checked={sources.includes(s)}
              onChange={() => toggleSource(s)}
            />{" "}
            {s}
          </label>
        ))}
      </div>
      <div>
        <label className="block text-sm">Sort by</label>
        <select
          className="border p-1 w-full"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="fit">Fit (desc)</option>
          <option value="date">Newest</option>
          <option value="salary">Salary</option>
        </select>
      </div>
    </aside>
  );
}
