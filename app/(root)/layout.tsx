import { ChooseUsernameForm } from "@/components/auth/ChooseUsernameForm";
import NavbarLeft from "@/components/root/NavbarLeft";
import NavbarMobile from "@/components/root/NavbarMobile";
import { getRawSession } from "@/lib/session";
import { activeBan, getAccount, isAdminAccount } from "@/lib/admin";
import BannedScreen from "@/components/auth/BannedScreen";
import { ReactNode, Suspense } from "react";
import NavigationLoader from "@/components/general/NavigationLoader";
import UploadQueue from "@/components/general/UploadQueue";
import PushPrompt from "@/components/general/PushPrompt";

type LayoutProps = {
    children: ReactNode;
};

export default async function Layout({ children }: LayoutProps) {
    const session = await getRawSession();

    // Banned: show why and for how long, with a sign-out button. Nothing else.
    const account = session ? await getAccount(session.user.id) : null;
    const ban = activeBan(account);
    if (session && ban) {
        return <BannedScreen reason={ban.reason} until={ban.until} username={session.user.username} />;
    }
    const isAdmin = isAdminAccount(account);

    return (
        <div className="flex flex-col md:flex-row h-full w-full fixed">
            {session && (
                <div className="hidden md:flex max-w-[250px]">
                    <NavbarLeft session={session} isAdmin={isAdmin} />
                </div>
            )}

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="relative flex min-h-0 flex-1 flex-col">
                    <section className="flex-1 overflow-x-scroll no-scrollbar">
                        {session ? (
                            session.user.username ? (
                                children
                            ) : (
                                <ChooseUsernameForm />
                            )
                        ) : (
                            children
                        )}
                    </section>

                    {/* Uploads that keep going while you use the app */}
                    {session && <UploadQueue />}

                    {/* Asks once per device to turn on push notifications */}
                    {session?.user.username && <PushPrompt />}

                    {/* Loading screen shown instantly when you open another page */}
                    <Suspense fallback={null}>
                        <NavigationLoader />
                    </Suspense>
                </div>
                {session && (
                    <section className="md:hidden">
                        <NavbarMobile session={session} isAdmin={isAdmin} />
                    </section>
                )}
            </div>
        </div>
    );
}
