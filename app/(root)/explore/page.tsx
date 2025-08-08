import { getLinkedAccounts } from "@/actions/auth/getLinkedAccounts";

export default async function Page() {
    const accounts = await getLinkedAccounts();

    return (
        <div className="flex flex-col h-screen p-4 gap-4 bg-gray-100">
            <h1 className="text-2xl font-semibold">Linked Accounts</h1>

            {Array.isArray(accounts) && accounts.length === 0 && (
                <p className="text-gray-600">No linked accounts.</p>
            )}

            {Array.isArray(accounts) && accounts.length > 0 && (
                <ul className="space-y-2">
                    {accounts.map((account) => (
                        <li
                            key={account.id}
                            className="p-4 bg-white rounded shadow border border-gray-200"
                        >
                            <div className="font-medium">
                                Provider: {account.provider}
                            </div>
                            <div className="text-sm text-gray-600">
                                Type: {account.type}
                            </div>
                            <div className="text-sm text-gray-600">
                                Provider Account ID: {account.providerAccountId}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {!Array.isArray(accounts) && (
                <p className="text-red-500">Failed to fetch accounts.</p>
            )}
        </div>
    );
}
