"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

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
    <Alert variant="destructive">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertDescription>
        <div className="text-center">
          <div className="font-medium mb-1">Unable to load filter options</div>
          <p className="text-sm mb-3">Using default values. Some filter options may be limited.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchFilterMetadata()}
            className="cursor-pointer"
          >
            Try Again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );

  return (
    <Card className="sm:w-full lg:w-72 mb-4 lg:mb-0 lg:mr-4 lg:sticky lg:top-4 relative mt-6">
      {/* Error state */}
      {filterMetadataError && <FilterErrorComponent />}

      {/* Subtle loading overlay */}
      {(isApplyingFilters || isLoadingMetadata) && (
        <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      <CardContent className="p-6">
        <div
          className={`grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4 transition-opacity ${
            isApplyingFilters || isLoadingMetadata
              ? "pointer-events-none opacity-60"
              : "pointer-events-auto opacity-100"
          } ${filterMetadataError ? "opacity-90" : ""}`}
        >
          <div>
            <Label className="text-sm">
              Min Fit Score
              {filterMetadataError && (
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                  (default range)
                </span>
              )}
            </Label>
            <Slider
              value={[minFit]}
              min={fitScoreMin}
              max={fitScoreMax}
              step={1}
              disabled={isApplyingFilters || isLoadingMetadata}
              onValueChange={(value) => setMinFit(value[0] ?? 0)}
              className="mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">
              {minFit}% (range: {fitScoreMin}-{fitScoreMax})
            </div>
          </div>
          <div>
            <Label className="text-sm">
              Min Salary (USD)
              {filterMetadataError && (
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                  (estimated max)
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={minSalary}
              min={0}
              max={salaryMax}
              disabled={isApplyingFilters || isLoadingMetadata}
              onChange={(e) => setMinSalary(Number(e.target.value))}
              className="mt-1"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {filterMetadataError ? "Est. max: " : "Max in data: "}${salaryMax.toLocaleString()}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-sm">Search</Label>
            <Input
              value={search}
              disabled={isApplyingFilters || isLoadingMetadata}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="mt-1"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-medium mb-2 block">
              Sources
              {filterMetadataError && (
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-1 font-normal">
                  (default list)
                </span>
              )}
            </Label>
            <div className="space-y-2">
              {availableSources.map((s) => (
                <div key={s} className="flex items-center space-x-2">
                  <Checkbox
                    id={`source-${s}`}
                    checked={sources.includes(s)}
                    disabled={isApplyingFilters || isLoadingMetadata}
                    onCheckedChange={() => toggleSource(s)}
                  />
                  <Label
                    htmlFor={`source-${s}`}
                    className={`text-sm cursor-pointer ${
                      isApplyingFilters || isLoadingMetadata ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-medium mb-2 block">
              Work Type
              {filterMetadataError && (
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-1 font-normal">
                  (no data)
                </span>
              )}
            </Label>
            {availableWorkTypes.length > 0 ? (
              <div className="max-h-32 overflow-y-auto space-y-2">
                {availableWorkTypes.map((w) => (
                  <div key={w} className="flex items-center space-x-2">
                    <Checkbox
                      id={`worktype-${w}`}
                      checked={workTypes.includes(w)}
                      disabled={isApplyingFilters || isLoadingMetadata}
                      onCheckedChange={() => toggleWorkType(w)}
                    />
                    <Label
                      htmlFor={`worktype-${w}`}
                      className={`text-sm cursor-pointer ${
                        isApplyingFilters || isLoadingMetadata
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {w}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">
                {filterMetadataError ? "Unable to load work types" : "No work types available"}
              </div>
            )}
          </div>
          <div className="col-span-2">
            <Label className="text-sm">Sort by</Label>
            <Select
              value={sortBy}
              disabled={isApplyingFilters || isLoadingMetadata}
              onValueChange={(value) => setSortBy(value as "FIT" | "DATE" | "SALARY")}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIT">Fit (desc)</SelectItem>
                <SelectItem value="DATE">Newest</SelectItem>
                <SelectItem value="SALARY">Salary (desc)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-sm">Bookmarks</Label>
            <Select
              value={bookmarked === null ? "all" : bookmarked ? "bookmarked" : "unbookmarked"}
              disabled={isApplyingFilters || isLoadingMetadata}
              onValueChange={(value) => {
                setBookmarked(
                  value === "bookmarked" ? true : value === "unbookmarked" ? false : null,
                );
              }}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="bookmarked">Only Bookmarked</SelectItem>
                <SelectItem value="unbookmarked">Only Unbookmarked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-sm">Tracking Status</Label>
            <Select
              value={isTracked === null ? "all" : isTracked ? "tracked" : "untracked"}
              disabled={isApplyingFilters || isLoadingMetadata}
              onValueChange={(value) => {
                setIsTracked(value === "tracked" ? true : value === "untracked" ? false : null);
              }}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="tracked">Only Tracked</SelectItem>
                <SelectItem value="untracked">Only Untracked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
