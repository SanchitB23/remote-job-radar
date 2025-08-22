"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
// import { useAuthedFetcher } from "@/lib/gqlClient.client";

export function PersonalizationPanel() {
  const { isSignedIn } = useAuth();
  // const gql = useAuthedFetcher();
  const [skillsText, setSkillsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;
    // (async () => {
    //   try {
    //     const res = await gql<{ meProfile: { skills: string[] } | null }>(
    //       `{ meProfile { skills } }`,
    //     );
    //     if (!mounted) return;
    //     setSkillsText(res.meProfile?.skills?.join(", ") ?? "");
    //   } finally {
    //     if (mounted) setLoading(false);
    //   }
    // })();
    return () => {
      mounted = false;
    };
  }, []);

  async function saveSkills() {
    setSaving(true);
    try {
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 64);
      // await gql(`mutation($skills:[String!]!){ setSkills(skills:$skills) }`, { skills });
      toast.success("Saved! Your feed will be personalized.");
    } catch (e) {
      toast.error("Failed to save skills");
    } finally {
      setSaving(false);
    }
  }

  async function onResumeSelected(file: File) {
    try {
      setUploading(true);
      // FUTURE:
      // 1) Upload file to storage (UploadThing/R2/S3/Vercel Blob) → returns URL
      // 2) gql(`mutation($url:String!){ parseResume(uploadUrl:$url){ extractedSkills } }`)
      // 3) Merge extracted skills into skillsText (dedupe)
      // For now, just a placeholder:
      toast("Résumé upload coming soon");
    } finally {
      setUploading(false);
    }
  }

  if (!isSignedIn) return <div className="p-4">Please sign in.</div>;
  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-base font-semibold">Personalization</h2>
      <p className="text-xs text-gray-500">
        Add your skills (comma‑separated). Later, you can upload a résumé to auto‑extract skills.
      </p>

      <textarea
        className="w-full border rounded p-2 min-h-[120px] outline-none"
        placeholder="react, typescript, graphql, nextjs, tailwind"
        value={skillsText}
        onChange={(e) => setSkillsText(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          onClick={saveSkills}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>

        <label className="border px-3 py-1 rounded cursor-pointer">
          {uploading ? "Uploading…" : "Upload résumé (PDF)"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onResumeSelected(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}
