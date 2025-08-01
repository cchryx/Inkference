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
    KeySquare,
    Library,
    Send,
    User,
    UserCircle,
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
