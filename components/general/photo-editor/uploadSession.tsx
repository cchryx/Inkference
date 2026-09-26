"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { discardUploads } from "@/actions/content/photos/discardUploads";
import { isStaged, unstage } from "@/lib/pendingUploads";

/*
 * Keeps track of pictures picked while a popup is open. If you close the
 * popup without saving (or swap a picture for another), they're thrown
 * away: waiting ones are just forgotten, uploaded ones are deleted.
 */

export type UploadSession = {
    /** Remember a picture picked in this popup. */
    track: (url: string) => void;
    /** This picture isn't needed anymore: throw it away if it came from this popup. */
    discard: (url: string | null | undefined) => void;
    /** Popup closed without saving: throw away everything picked in it. */
    discardAll: () => void;
    /** Saved: keep everything. */
    keepAll: () => void;
};

function drop(list: string[]) {
    const uploaded: string[] = [];
    for (const url of list) {
        if (isStaged(url)) unstage(url);
        else uploaded.push(url);
    }
    if (uploaded.length) void discardUploads(uploaded);
}

export function useUploadSession(): UploadSession {
    // Made once per popup; the list lives inside it.
    const [session] = useState<UploadSession>(() => {
        const urls = new Set<string>();
        return {
            track: (url) => void urls.add(url),
            discard: (url) => {
                if (!url || !urls.has(url)) return;
                urls.delete(url);
                drop([url]);
            },
            discardAll: () => {
                const list = [...urls];
                urls.clear();
                drop(list);
            },
            keepAll: () => urls.clear(),
        };
    });
    return session;
}

const Ctx = createContext<UploadSession | null>(null);

export function UploadSessionProvider({ session, children }: { session: UploadSession; children: ReactNode }) {
    return <Ctx.Provider value={session}>{children}</Ctx.Provider>;
}

/** The upload session of the popup this is inside (if any). */
export const useCurrentUploadSession = () => useContext(Ctx);
