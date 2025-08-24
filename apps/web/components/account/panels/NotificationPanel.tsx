"use client";

import { useEffect, useState } from "react";
// import { useAuthedFetcher } from "@/lib/gqlClient.client";

type Cadence = "OFF" | "DAILY" | "WEEKLY";

/**
 * NOTE: Backend resolvers for jobAlertPrefs / setJobAlertPrefs are not implemented yet.
 * This panel renders safely and will no-op until you add those API fields.
 */
export function NotificationsPanel() {
  // const gql = useAuthedFetcher();
  const [cadence, setCadence] = useState<Cadence>("OFF");
  const [email, setEmail] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // When API is ready, uncomment:
        // const res = await gql<{ jobAlertPrefs: { cadence: Cadence; channels: string[] } | null }>(
        //   `{ jobAlertPrefs { cadence channels } }`
        // );
        // if (!mounted) return;
        // if (res.jobAlertPrefs) {
        //   setCadence(res.jobAlertPrefs.cadence);
        //   setEmail(res.jobAlertPrefs.channels?.includes("EMAIL") ?? true);
        // }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      // When API is ready, uncomment:
      // await gql(
      //   `mutation($cadence:Cadence!,$channels:[String!]!){
      //     setJobAlertPrefs(cadence:$cadence, channels:$channels)
      //   }`,
      //   { cadence, channels: email ? ["EMAIL"] : [] }
      // );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-base font-semibold">Job alerts</h2>

      <label className="text-sm">Cadence</label>
      <select
        className="border rounded px-2 py-1"
        value={cadence}
        onChange={(e) => setCadence(e.target.value as Cadence)}
      >
        <option value="OFF">Off</option>
        <option value="DAILY">Daily</option>
        <option value="WEEKLY">Weekly</option>
      </select>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
        Email me job alerts
      </label>

      <button className="border px-3 py-1 rounded" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>

      <p className="text-xs text-muted-foreground">
        (Coming soon) Alerts are sent when new high‑fit jobs match your profile.
      </p>
    </div>
  );
}
