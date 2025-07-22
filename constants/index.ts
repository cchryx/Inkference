import {
    Bell,
    BookUser,
    Compass,
    Contact,
    Home,
    KeySquare,
    Library,
    User,
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
        icon: User,
        id: "profile",
        label: "Profile",
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
