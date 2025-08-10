import WelcomeWrapper from "@/components/welcome/WelcomeWrapper";
import { prisma } from "@/lib/prisma";

export default async function WelcomePage() {
    const [userCount, projectCount] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
    ]);

    return <WelcomeWrapper userCount={userCount} projectCount={projectCount} />;
}
