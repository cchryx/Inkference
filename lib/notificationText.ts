/** Plain-text wording for a notification (used for push messages). */
export function notificationText(input: {
    type: string;
    actorName?: string | null;
    actorCount?: number;
    preview?: string | null;
    targetKind?: "post" | "project" | null;
}) {
    const { type, actorName, actorCount = 1, preview, targetKind } = input;
    const others = Math.max(0, actorCount - 1);
    const who = actorName
        ? others > 0
            ? `${actorName} and ${others} other${others === 1 ? "" : "s"}`
            : actorName
        : "Someone";
    const thing = targetKind === "project" ? "project" : "post";

    switch (type) {
        case "like":
            return `${who} liked your ${thing}.`;
        case "comment":
            return `${who} commented${preview ? `: "${preview.slice(0, 100)}"` : " on your post."}`;
        case "follow":
            return `${who} started following you.`;
        case "friend_request":
            return `${who} sent you a friend request.`;
        case "friend_accept":
            return `${who} accepted your friend request.`;
        case "friend_post":
            return `${who} shared a new post.`;
        case "friend_project":
            return `${who} published a new project${preview ? `: ${preview}` : "."}`;
        case "views":
            return `Your ${thing} reached ${Number(preview).toLocaleString()} views.`;
        case "tip":
            return `${who} bought you a coffee ☕${preview ? ` "${preview.slice(0, 100)}"` : ""}`;
        default:
            return "You have a new notification.";
    }
}

export const NOTIFICATION_TYPES = [
    { type: "like", label: "Likes", hint: "Someone likes your post or project" },
    { type: "comment", label: "Comments", hint: "Someone comments on your post" },
    { type: "follow", label: "New followers", hint: "Someone follows you" },
    { type: "friend_request", label: "Friend requests", hint: "Someone sends you a friend request" },
    { type: "friend_accept", label: "Accepted requests", hint: "Someone accepts your friend request" },
    { type: "friend_post", label: "Friends' posts", hint: "A friend shares a new post" },
    { type: "friend_project", label: "Friends' projects", hint: "A friend publishes a new project" },
    { type: "views", label: "View milestones", hint: "Your post or project reaches 100 views, 1,000 views…" },
    { type: "tip", label: "Coffees", hint: "Someone buys you a coffee" },
] as const;
