import type { Metadata } from "next";
import TodosApp from "@/components/productivity/todos/TodosApp";
import { getTodoLists } from "@/actions/drive/drive";

export const metadata: Metadata = { title: "To-dos", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ list?: string }> }) {
    const [{ list }, lists] = await Promise.all([searchParams, getTodoLists()]);
    return <TodosApp initialLists={lists} initialListId={list ?? null} />;
}
