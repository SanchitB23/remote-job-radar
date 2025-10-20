"use client";

import { useAuth } from "@clerk/nextjs";
import type { RefetchOptions } from "@tanstack/react-query";
import _ from "lodash";
import { AlertCircleIcon, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSetUserSkills, useUserSkills } from "@/lib/hooks";

function LoadingSkillsCard() {
  return (
    <div className="flex items-center justify-center min-h-[120px] bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
      <div className="flex flex-col items-center gap-3 p-6">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
        <div className="text-center">
          <span className="text-sm font-medium text-foreground block">Loading your skills...</span>
          <span className="text-xs text-muted-foreground">Please wait</span>
        </div>
      </div>
    </div>
  );
}

function ErrorSkillsCard({
  handleRefresh,
}: {
  handleRefresh: (options?: RefetchOptions | undefined) => Promise<any>;
}) {
  return (
    <div className="flex items-center justify-center min-h-[120px] bg-destructive/5 rounded-lg border border-destructive/20">
      <div className="flex flex-col items-center gap-3 p-6">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive">
          <AlertCircleIcon className="h-5 w-5" />
        </span>
        <div className="text-center">
          <span className="text-sm font-medium text-destructive block">Error loading skills</span>
          <span className="text-xs text-muted-foreground">Please try again</span>
        </div>
        <Button
          onClick={() => handleRefresh()}
          size="sm"
          variant="outline"
          className="flex items-center gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <RotateCcw className="h-3 w-3" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

function TagInput({ tags, setTags }: { tags: string[]; setTags: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleClearTags = () => {
    setTags([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[50px] p-3 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20">
        {tags.length === 0 ? (
          <div className="flex items-center justify-center w-full text-muted-foreground text-sm">
            No skills added yet. Start typing to add your first skill...
          </div>
        ) : (
          tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => handleRemoveTag(tag)}
            >
              {tag}
              <span className="ml-1 text-xs">&times;</span>
            </Badge>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Type a skill and press Enter or comma..."
          className="flex-1 h-9"
        />
        <Button
          onClick={handleClearTags}
          disabled={tags.length === 0}
          variant="outline"
          size="sm"
          className="flex-shrink-0 text-destructive hover:bg-destructive/10 border-destructive/20"
        >
          Clear All
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <span className="font-medium">Tip:</span> Use Enter or comma to add skills • Click any skill
        to remove it
      </div>
    </div>
  );
}

export function PersonalizationPanel() {
  const { isSignedIn, isLoaded } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const {
    data: userSkills,
    isPending: isLoadingUserSkills,
    isError: isErrorUserSkills,
    refetch,
  } = useUserSkills();

  const {
    mutate: setUserSkills,
    isPending: isSavingSkills,
    isError: isErrorSavingSkills,
    isSuccess: isSuccessSavingSkills,
  } = useSetUserSkills();

  useEffect(() => {
    if (userSkills && userSkills.skills) {
      setTags(userSkills.skills);
    }
  }, [userSkills]);

  const ctaToolTipMsg = useMemo(() => {
    let tooltipMsg = null;
    if (isSavingSkills) tooltipMsg = "Saving, please wait…";
    else if (_.isEqual(tags, userSkills?.skills)) tooltipMsg = "Make changes to your skills";
    return tooltipMsg;
  }, [isSavingSkills, tags, userSkills]);

  if (!isLoaded || isLoadingUserSkills) return <LoadingSkillsCard />;
  if (isErrorUserSkills) return <ErrorSkillsCard handleRefresh={refetch} />;

  return (
    <Card className="rounded-lg border bg-card p-0 shadow-sm">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <AlertCircleIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground mb-1">Skills & Expertise</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add your technical skills and expertise areas. Our AI uses these to calculate
              personalized fit scores and recommend relevant job opportunities.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-background/50 p-4 space-y-4">
          <TagInput tags={tags} setTags={setTags} />

          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild className="disabled:pointer-events-auto">
                  <Button
                    onClick={() => setUserSkills({ skills: tags })}
                    disabled={!!ctaToolTipMsg}
                    variant="default"
                    className={`flex-shrink-0 min-w-[100px] h-9 flex items-center justify-center gap-2 font-medium${
                      isSavingSkills ? " cursor-wait" : ""
                    }`}
                  >
                    {isSavingSkills && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>
                      {isErrorSavingSkills
                        ? "Try Again"
                        : isSavingSkills
                          ? "Saving…"
                          : "Save Skills"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="z-[100001]">
                  {ctaToolTipMsg || "Save Changes"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Success/Error states */}
            <div className="flex-1">
              {isSuccessSavingSkills && (
                <Alert
                  variant="default"
                  className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200 py-2"
                >
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle className="text-sm">Skills saved successfully!</AlertTitle>
                </Alert>
              )}
              {isErrorSavingSkills && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle className="text-sm">
                    Unable to save skills. Please try again.
                  </AlertTitle>
                </Alert>
              )}
            </div>
          </div>

          <Separator />

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              🚀 <span className="font-medium">Coming Soon:</span> Resume upload & automatic skill
              extraction
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
