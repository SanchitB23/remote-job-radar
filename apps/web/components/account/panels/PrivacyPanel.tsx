"use client";

export function PrivacyPanel() {
  function exportData() {
    // FUTURE: gql(`mutation{ exportMyData }`) -> returns a download URL
  }

  function deleteData() {
    // FUTURE: gql(`mutation{ deleteMyData }`) -> cascades bookmarks/pipeline/profile
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-base font-semibold">Privacy & Data</h2>
      <p className="text-sm text-muted-foreground">
        Export or delete your data. Deleting removes bookmarks, pipeline items, and personalization.
      </p>
      <div className="flex gap-2">
        <button className="border px-3 py-1 rounded" onClick={exportData}>
          Export my data
        </button>
        <button className="border px-3 py-1 rounded text-destructive" onClick={deleteData}>
          Delete my data
        </button>
      </div>
    </div>
  );
}
