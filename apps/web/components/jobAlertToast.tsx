"use client";
import { useEffect } from "react";
import { getWSClient } from "@/lib/gqlClient.client";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";

export default function JobAlerts() {
  const { getToken } = useAuth();

  useEffect(() => {
    (async () => {
      const jwt = await getToken({ template: "remote-job-radar" });
      const ws = await getWSClient(jwt || undefined);
      ws.subscribe(
        { query: "subscription{ newJob(minFit:80){ title company url } }" },
        {
          next: ({ data }) => {
            const job = (
              data as {
                newJob: { title: string; company: string; url: string };
              }
            )?.newJob;
            toast.success(
              <a href={job?.url} target="_blank">
                New match: {job?.title} — {job?.company}
              </a>
            );
          },
          error: console.error,
          complete: console.log,
          
        }
      );
    })();
  }, [getToken]);

  return null;
}
