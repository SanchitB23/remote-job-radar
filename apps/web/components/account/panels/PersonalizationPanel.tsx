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
    <Card className="p-6 bg-muted/50 shadow-none border-0 flex items-center justify-center min-h-[160px]">
      <CardContent className="flex flex-col items-center justify-center p-0">
        <div className="flex flex-col items-center gap-2">
          <span className="animate-spin text-primary">
            <Loader2 className="h-6 w-6" />
          </span>
          <span className="text-sm text-muted-foreground font-medium tracking-wide">
            Loading your skills…
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorSkillsCard({
  handleRefresh,
}: {
  handleRefresh: (options?: RefetchOptions | undefined) => Promise<any>;
}) {
  // Use a reload for now; in a real app, pass a refetch function as prop

  return (
    <Card className="p-6 bg-destructive/10 shadow-none border-0 flex items-center justify-center min-h-[160px]">
      <CardContent className="flex flex-col items-center justify-center p-0">
        <div className="flex flex-col items-center gap-2">
          <AlertCircleIcon className="h-7 w-7 text-destructive" />
          <span className="text-sm text-destructive font-semibold tracking-wide">
            Error loading user skills
          </span>
          <span className="text-xs text-muted-foreground">Please refresh or try again later.</span>
          <Button
            onClick={() => handleRefresh()}
            size="sm"
            variant="outline"
            className="mt-2 flex items-center gap-1 border-destructive text-destructive hover:bg-destructive/20"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => handleRemoveTag(tag)}
          >
            {tag}
            <span className="ml-1">&times;</span>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Type a skill and press Enter or ,"
          className="flex-1"
        />
        <Button
          onClick={handleClearTags}
          disabled={tags.length === 0}
          variant="destructive"
          className="flex-shrink-0"
        >
          Reset
        </Button>
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
    <Card className="p-4 shadow-none border-0">
      <CardContent className="space-y-3 p-0">
        <h2 className="text-base font-semibold">Personalization</h2>
        <p className="text-xs text-muted-foreground">
          Add your skills. We&apos;ll use these to calculate fit scores and personalize your job
          recommendations. Later, you can upload a résumé to auto‑extract skills.
        </p>

        <TagInput tags={tags} setTags={setTags} />

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild className="disabled:pointer-events-auto">
                <Button
                  onClick={() => setUserSkills({ skills: tags })}
                  disabled={!!ctaToolTipMsg}
                  variant="default"
                  className={`flex-shrink-0 w-24 h-9 flex items-center justify-center gap-2${
                    isSavingSkills ? " cursor-wait" : ""
                  }`}
                >
                  {isSavingSkills && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {isErrorSavingSkills ? "Try Again" : isSavingSkills ? "Saving…" : "Save"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="z-[100001]">
                {ctaToolTipMsg || "Save Changes"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isSuccessSavingSkills && (
            <Alert variant="success" className="flex-1 border-0 shadow-none">
              <AlertCircleIcon />
              <AlertTitle>Skills saved successfully!</AlertTitle>
            </Alert>
          )}
          {isErrorSavingSkills && (
            <Alert variant="destructive" className="flex-1 border-0 shadow-none">
              <AlertCircleIcon />
              <AlertTitle>Unable to save skills.</AlertTitle>
            </Alert>
          )}
        </div>
        <Separator className="my-4" />
        <div className="text-xs text-muted-foreground text-center">
          🚀 Resume upload & skill extraction coming soon!
        </div>
      </CardContent>
    </Card>
  );
}
