import { BookUser, Compass, Group, Home, Library } from "lucide-react";

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
