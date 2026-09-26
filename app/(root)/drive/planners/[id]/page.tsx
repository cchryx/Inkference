import { redirect } from "next/navigation";

// Planners moved to Productivity.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/productivity/planners/${id}`);
}
