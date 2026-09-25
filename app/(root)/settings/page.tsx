import { getLinkedAccounts } from "@/actions/auth/getLinkedAccounts";
import SettingsWrapper from "@/components/settings/SettingsWrapper";

interface PageProps {
    searchParams: Promise<{ section?: string; error?: string; linked?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
    const [{ accounts, hasPassword }, params] = await Promise.all([
        getLinkedAccounts(),
        searchParams,
    ]);

    return (
        <SettingsWrapper
            accounts={accounts}
            hasPassword={hasPassword}
            initialSection={params.section}
            linkError={params.error}
            linked={params.linked}
        />
    );
}
