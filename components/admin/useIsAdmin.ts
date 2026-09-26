"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminStatus } from "@/actions/admin";

/** Your staff role (checked once, then remembered for the visit). */
export function useAdminStatus() {
    const { data } = useQuery({
        queryKey: ["adminStatus"],
        queryFn: () => getAdminStatus(),
        staleTime: Infinity,
    });
    return data ?? { isAdmin: false, role: "user" as const, canAssign: [] };
}

/** True for admins, HR and the CEO. */
export function useIsAdmin() {
    return useAdminStatus().isAdmin;
}
