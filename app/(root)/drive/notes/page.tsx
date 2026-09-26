import type { Metadata } from "next";
import NotesApp from "@/components/drive/notes/NotesApp";
import { getNotes } from "@/actions/drive/drive";

export const metadata: Metadata = { title: "Notes", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
    const [{ n }, notes] = await Promise.all([searchParams, getNotes()]);
    return <NotesApp initialNotes={notes} initialId={n ?? null} />;
}
