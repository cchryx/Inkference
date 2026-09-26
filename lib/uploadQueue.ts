"use client";

import { useSyncExternalStore } from "react";

/*
 * Background uploads. A popup hands its slow work (uploading photos,
 * saving the post) to this queue and closes right away, so you can keep
 * using the app. Jobs run one at a time and survive moving between pages
 * (just not a full page reload or closing the tab).
 */

export type JobStatus = "waiting" | "running" | "done" | "failed";

export type UploadJob = {
    id: string;
    label: string; // e.g. "New post (3 photos)"
    status: JobStatus;
    progress: string | null; // e.g. "Uploading 2/5"
    error: string | null;
};

type Runner = (report: (progress: string) => void) => Promise<void>;
type Entry = UploadJob & { run: Runner; onDone?: () => void; cleanup?: () => void };

let jobs: Entry[] = [];
let snapshot: UploadJob[] = [];
const listeners = new Set<() => void>();
let working = false;

function emit() {
    snapshot = jobs.map(({ id, label, status, progress, error }) => ({ id, label, status, progress, error }));
    listeners.forEach((l) => l());
}

function update(id: string, patch: Partial<Entry>) {
    jobs = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
    emit();
}

async function work() {
    if (working) return;
    working = true;
    let next: Entry | undefined;
    while ((next = jobs.find((j) => j.status === "waiting"))) {
        const job = next;
        update(job.id, { status: "running", progress: "Starting...", error: null });
        try {
            await job.run((progress) => update(job.id, { progress }));
            update(job.id, { status: "done", progress: null });
            job.cleanup?.();
            job.onDone?.();
            // Done jobs tidy themselves away after a moment.
            setTimeout(() => dismiss(job.id), 4000);
        } catch (err) {
            console.error("upload job failed:", err);
            update(job.id, {
                status: "failed",
                progress: null,
                error: err instanceof Error ? err.message : "Something went wrong.",
            });
        }
    }
    working = false;
}

/** Add slow work to the queue. `cleanup` runs when it finishes or is dismissed. */
export function enqueueUpload(input: { label: string; run: Runner; onDone?: () => void; cleanup?: () => void }) {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    jobs = [...jobs, { id, status: "waiting", progress: null, error: null, ...input }];
    emit();
    void work();
    return id;
}

export function retryUpload(id: string) {
    update(id, { status: "waiting", error: null });
    void work();
}

export function dismiss(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job || job.status === "running") return;
    if (job.status !== "done") job.cleanup?.();
    jobs = jobs.filter((j) => j.id !== id);
    emit();
}

export const hasActiveUploads = () => jobs.some((j) => j.status === "waiting" || j.status === "running");

const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
};
const empty: UploadJob[] = [];

export function useUploadQueue() {
    return useSyncExternalStore(subscribe, () => snapshot, () => empty);
}
