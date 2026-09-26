import { redirect } from "next/navigation";

// Planners moved to Productivity.
export default function Page() {
    redirect("/productivity/planners");
}
