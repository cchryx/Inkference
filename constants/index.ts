import {
    Aperture,
    Bell,
    BookUser,
    Brain,
    BriefcaseBusiness,
    Compass,
    Contact,
    Folders,
    GraduationCap,
    Home,
    Inbox,
    KeySquare,
    Library,
    LogOut,
    Mail,
    Mailbox,
    Send,
    Settings,
    User,
    UserCircle,
    UserPlus,
} from "lucide-react";

export const NAVBARLEFT_LINKS = [
    {
        icon: Home,
        route: "/",
        label: "Home",
    },
    {
        icon: Compass,
        route: "/explore",
        label: "Explore",
    },
    {
        icon: Library,
        route: "/library",
        label: "Library",
    },
    {
        icon: BookUser,
        route: "/social",
        label: "Social",
    },
];

export const SETTINGS_LINKS = [
    {
        icon: UserCircle,
        id: "profile",
        label: "Profile",
    },
    {
        icon: User,
        id: "user",
        label: "User",
    },
    {
        icon: KeySquare,
        id: "authentication",
        label: "Authentication",
    },
    {
        icon: Contact,
        id: "relations",
        label: "Relations",
    },
    {
        icon: Bell,
        id: "notifications",
        label: "Notifications",
    },
];

export const PROFILE_LINKS = [
    {
        icon: Folders,
        id: "projects",
        label: "Projects",
    },
    {
        icon: BriefcaseBusiness,
        id: "experiences",
        label: "Experiences",
    },
    {
        icon: GraduationCap,
        id: "education",
        label: "Education",
    },
    {
        icon: Brain,
        id: "skills",
        label: "Skills",
    },
    {
        icon: Aperture,
        id: "photos",
        label: "Photos",
    },
    {
        icon: Send,
        id: "posts",
        label: "Posts",
    },
];

export const INBOX_LINKS = [
    {
        icon: Mail,
        id: "general",
        label: "General",
    },
    {
        icon: UserPlus,
        id: "requests",
        label: "Requests",
    },
];

export const NAVBARLEFT_SUB_LINKS = [
    {
        icon: User,
        route: (username: string | undefined) =>
            username ? `/profile/${username}` : "/",
        label: "Profile",
    },
    {
        icon: Inbox,
        route: "/inbox",
        label: "Inbox",
    },
    {
        icon: Settings,
        route: "/settings",
        label: "Settings",
    },
    {
        icon: LogOut,
        action: "signout",
        label: "Signout",
    },
];

export const HOMETOP_LINKS = [
    { id: "for_you", label: "For You" },
    { id: "following", label: "Following" },
    { id: "friends", label: "Friends" },
];
