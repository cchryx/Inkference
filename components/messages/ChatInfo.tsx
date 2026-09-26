"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, LogOut, Trash2, UserMinus, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/general/Loader";
import ConfirmModal from "@/components/general/ConfirmModal";
import { UserIcon } from "@/components/general/UserIcon";
import UserPicker, { type PickedUser } from "@/components/general/UserPicker";
import { blockUser } from "@/actions/users/blockUser";
import {
    addToGroup,
    hideConversation,
    leaveGroup,
    removeFromGroup,
    renameGroup,
    setMuted,
    type ConversationDetail,
} from "@/actions/messages";
import { ChatAvatar } from "./chatUtils";

type Confirm = "delete" | "leave" | "block" | { remove: { id: string; name: string } } | null;

const ROW = "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-gray-100 cursor-pointer";

/** Side panel: name, people, mute, leave/delete. */
export default function ChatInfo({
    detail,
    meId,
    onClose,
    onGone,
}: {
    detail: ConversationDetail;
    meId: string;
    onClose: () => void;
    onGone: () => void;
}) {
    const qc = useQueryClient();
    const others = detail.members.filter((m) => m.id !== meId);
    const other = !detail.isGroup ? others[0] : undefined;
    const isOwner = detail.myRole === "owner";
    const active = detail.myStatus === "active";

    const [name, setName] = useState<string | null>(null);
    const [adding, setAdding] = useState<PickedUser[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<Confirm>(null);

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ["conversation", detail.id] });
        qc.invalidateQueries({ queryKey: ["conversations"] });
    };

    const run = async (key: string, fn: () => Promise<{ error: string | null }>, done?: string) => {
        setBusy(key);
        const res = await fn();
        setBusy(null);
        if (res.error) {
            toast.error(res.error);
            return false;
        }
        if (done) toast.success(done);
        refresh();
        return true;
    };

    const saveName = async () => {
        if (name === null) return;
        if (await run("name", () => renameGroup(detail.id, name))) setName(null);
    };

    const add = async () => {
        setBusy("add");
        const res = await addToGroup(
            detail.id,
            adding.map((u) => u.id)
        );
        setBusy(null);
        if (res.error) return toast.error(res.error);
        if (res.skipped) toast.message(`${res.skipped} ${res.skipped === 1 ? "person doesn't" : "people don't"} take messages from you.`);
        setAdding([]);
        refresh();
    };

    const doConfirm = async () => {
        if (!confirm) return;
        if (confirm === "delete") {
            if (await run("confirm", () => hideConversation(detail.id))) onGone();
        } else if (confirm === "leave") {
            if (await run("confirm", () => leaveGroup(detail.id))) onGone();
        } else if (confirm === "block" && other) {
            if (await run("confirm", () => blockUser(other.id), `Blocked @${other.username}.`)) onGone();
        } else if (typeof confirm === "object") {
            await run("confirm", () => removeFromGroup(detail.id, confirm.remove.id));
        }
        setConfirm(null);
    };

    const confirmText =
        confirm === "delete"
            ? { title: "Delete this chat?", text: "It's removed from your list only. It comes back if someone sends a new message.", ok: "Delete" }
            : confirm === "leave"
            ? { title: "Leave this group?", text: "You won't get new messages from it anymore.", ok: "Leave" }
            : confirm === "block"
            ? { title: `Block ${other?.name ?? "this person"}?`, text: "They won't be able to message you, see your profile or find your content. They aren't told.", ok: "Block" }
            : confirm
            ? { title: `Remove ${confirm.remove.name}?`, text: "They'll leave the group and stop getting its messages.", ok: "Remove" }
            : { title: "", text: "", ok: "" };

    return (
        <aside className="absolute inset-0 z-20 flex flex-col bg-white md:left-auto md:w-80 md:border-l md:border-gray-200 md:shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h3 className="font-semibold">Details</h3>
                <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-gray-600 hover:bg-gray-100 cursor-pointer">
                    <X className="size-5" />
                </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <div className="flex flex-col items-center gap-2 text-center">
                    <ChatAvatar people={others} isGroup={detail.isGroup} />
                    <p className="font-semibold">{detail.title}</p>
                    {other?.username && <p className="-mt-2 text-xs text-gray-500">@{other.username}</p>}
                </div>

                {/* Group name */}
                {detail.isGroup && active && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Group name</label>
                        <div className="flex gap-2">
                            <input
                                value={name ?? detail.name ?? ""}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={80}
                                placeholder="Name this group"
                                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-500"
                            />
                            {name !== null && (
                                <button
                                    onClick={saveName}
                                    disabled={busy === "name"}
                                    className="flex items-center gap-1 rounded-md bg-neutral-900 px-3 text-sm text-white hover:bg-neutral-700 cursor-pointer"
                                >
                                    {busy === "name" && <Loader size={3} />} Save
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Mute */}
                {active && (
                    <label className="flex items-center justify-between gap-3 text-sm">
                        <span>
                            <span className="block font-medium">Mute notifications</span>
                            <span className="block text-xs text-gray-500">No push alerts or badge for this chat</span>
                        </span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={detail.muted}
                            disabled={busy === "mute"}
                            onClick={() => run("mute", () => setMuted(detail.id, !detail.muted))}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition cursor-pointer disabled:opacity-50 ${
                                detail.muted ? "bg-neutral-900" : "bg-gray-300"
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                                    detail.muted ? "left-[22px]" : "left-0.5"
                                }`}
                            />
                        </button>
                    </label>
                )}

                {/* People */}
                {detail.isGroup && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            People · {detail.members.length}
                        </p>
                        <ul className="space-y-1">
                            {detail.members.map((m) => (
                                <li key={m.id} className="flex items-center gap-3">
                                    <Link href={`/profile/${m.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                                        <UserIcon image={m.image} size="size-8" />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium">
                                                {m.name}
                                                {m.id === meId && <span className="text-gray-400"> (you)</span>}
                                            </span>
                                            <span className="block truncate text-xs text-gray-500">
                                                {m.role === "owner" ? "Owner" : m.status === "request" ? "Invited" : `@${m.username}`}
                                            </span>
                                        </span>
                                    </Link>
                                    {isOwner && m.id !== meId && (
                                        <button
                                            onClick={() => setConfirm({ remove: { id: m.id, name: m.name } })}
                                            aria-label={`Remove ${m.name}`}
                                            className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                        >
                                            <UserMinus className="size-4" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {active && (
                            <div className="space-y-2 pt-2">
                                <UserPicker
                                    value={adding}
                                    onChange={setAdding}
                                    excludeIds={detail.members.map((m) => m.id)}
                                    placeholder="Add people…"
                                    disabled={busy === "add"}
                                />
                                {adding.length > 0 && (
                                    <button
                                        onClick={add}
                                        disabled={busy === "add"}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-md bg-neutral-900 py-2 text-sm text-white hover:bg-neutral-700 cursor-pointer"
                                    >
                                        {busy === "add" && <Loader size={3} />} Add {adding.length}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-0.5 border-t border-gray-200 pt-3">
                    {other?.username && (
                        <Link href={`/profile/${other.username}`} className={ROW}>
                            <UserRound className="size-4" /> View profile
                        </Link>
                    )}
                    <button onClick={() => setConfirm("delete")} className={`${ROW} text-red-600 hover:bg-red-50`}>
                        <Trash2 className="size-4" /> Delete chat
                    </button>
                    {detail.isGroup && (
                        <button onClick={() => setConfirm("leave")} className={`${ROW} text-red-600 hover:bg-red-50`}>
                            <LogOut className="size-4" /> Leave group
                        </button>
                    )}
                    {other && (
                        <button onClick={() => setConfirm("block")} className={`${ROW} text-red-600 hover:bg-red-50`}>
                            <Ban className="size-4" /> Block
                        </button>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={!!confirm}
                isPending={busy === "confirm"}
                title={confirmText.title}
                text={confirmText.text}
                confirmText={confirmText.ok}
                onConfirm={doConfirm}
                onClose={() => setConfirm(null)}
            />
        </aside>
    );
}
