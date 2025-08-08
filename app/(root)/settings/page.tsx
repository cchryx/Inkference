import { getLinkedAccounts } from "@/actions/auth/getLinkedAccounts";
import SettingsWrapper from "@/components/settings/SettingsWrapper";

export default async function Page() {
    const { accounts, error, hasPassword } = await getLinkedAccounts();

    return <SettingsWrapper accounts={accounts} hasPassword={hasPassword} />;
}
