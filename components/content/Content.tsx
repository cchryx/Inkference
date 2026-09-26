"use client";

import { useMemo, useState } from "react";
import { BUILD_TAB_COOKIE, pickSection, shownSections } from "@/lib/profileSections";
import StorageMeter from "@/components/general/StorageMeter";

import ContentsBar from "./Contentsbar";
import Projects from "./sections/Projects";
import Experiences from "./sections/Experiences";
import Education from "./sections/Education";
import Skills from "./sections/Skills";
import Photos from "./sections/Photos";
import Posts from "./sections/Posts";
import CreateContent from "./CreateContent";
import CreateProjectModal from "./project/create/CreateProjectModal";
import Subnavbar from "../root/Subnavbar";
import AddExperienceModal from "./experience/create/AddExperienceModal";
import AddEducationModal from "./education/create/AddEducationModal";
import AddMeritModal from "./merit/create/AddMeritModal";
import Merits from "./sections/Merits";
import AddSkillModal from "./skill/create/AddSkillModal";
import AddPhotosModal from "./photos/create/AddPhotosModal";
import CreatePostModal from "./post/create/CreatePostModal";

type Props = {
    userData: any;
    rootUser?: boolean;
    /** Tab to open first (from the link, or the one you had open last). */
    initialTab?: string;
    /** Tabs the owner hid in Settings. */
    hiddenSections?: string[];
};

const Content = ({ userData, rootUser = false, initialTab, hiddenSections }: Props) => {
    const shown = useMemo(() => shownSections(hiddenSections), [hiddenSections]);
    const [active, setActiveState] = useState<string>(() => pickSection(initialTab, shown));

    // Remember the tab: in the link (so Back returns to it) and, on your own
    // Build page, in a cookie (so it's still open next time you come back).
    const setActive = (id: string) => {
        setActiveState(id);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", id);
        url.searchParams.delete("section");
        window.history.replaceState(null, "", url);
        if (rootUser) document.cookie = `${BUILD_TAB_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
    };
    const [openModal, setOpenModal] = useState<string | null>(null);
    const [projectView, setProjectView] = useState("myProjects");

    return (
        <div className="w-full">
            {/* Sticky ContentsBar */}
            <ContentsBar active={active} setActive={setActive} shown={shown} />

            {/* Your photo space (gallery, posts, projects), on your own Build page */}
            {rootUser && <StorageMeter compact className="mt-3" />}

            {/* Content below */}
            {active === "projects" && (
                <>
                    {rootUser && (
                        <>
                            <div className="mt-4">
                                <Subnavbar
                                    categories={[
                                        {
                                            key: "myProjects",
                                            label: "My Projects",
                                        },
                                        {
                                            key: "contributedTo",
                                            label: "Contributed To",
                                        },
                                        { key: "saved", label: "Saved" },
                                        { key: "liked", label: "Liked" },
                                        { key: "viewed", label: "Viewed" },
                                    ]}
                                    active={projectView}
                                    setActive={setProjectView}
                                />
                            </div>

                            <CreateContent
                                label="Create/add a new project"
                                onClick={() => setOpenModal("project")}
                            />
                            {openModal === "project" && (
                                <CreateProjectModal
                                    onCloseModal={() => setOpenModal(null)}
                                />
                            )}
                        </>
                    )}

                    <Projects
                        rootUser={rootUser}
                        category={projectView}
                        projects={
                            projectView === "contributedTo"
                                ? userData.projectsContributedTo
                                : projectView === "saved"
                                ? userData.projectsSaved
                                : projectView === "liked"
                                ? userData.projectsLiked
                                : projectView === "viewed"
                                ? userData.projectsViewed
                                : userData.projects
                        }
                    />
                </>
            )}

            {active === "experiences" && (
                <>
                    {rootUser && (
                        <>
                            <CreateContent
                                label="Add experience"
                                onClick={() => setOpenModal("experiences")}
                            />
                            {openModal === "experiences" && (
                                <AddExperienceModal
                                    onCloseModal={() => setOpenModal(null)}
                                />
                            )}
                        </>
                    )}
                    <Experiences
                        rootUser={rootUser}
                        experiences={userData.experiences}
                    />
                </>
            )}
            {active === "education" && (
                <>
                    {rootUser && (
                        <>
                            <CreateContent
                                label="Add education"
                                onClick={() => setOpenModal("education")}
                            />
                            {openModal === "education" && (
                                <AddEducationModal
                                    onCloseModal={() => setOpenModal(null)}
                                />
                            )}
                        </>
                    )}
                    <Education
                        rootUser={rootUser}
                        educations={userData.educations}
                    />
                </>
            )}
            {active === "merits" && (
                <>
                    {rootUser && (
                        <>
                            <CreateContent
                                label="Add Merit"
                                onClick={() => setOpenModal("merits")}
                            />
                            {openModal === "merits" && (
                                <AddMeritModal
                                    onCloseModal={() => setOpenModal(null)}
                                />
                            )}
                        </>
                    )}
                    <Merits rootUser={rootUser} merits={userData.merits} />
                </>
            )}
            {active === "skills" && (
                <>
                    {rootUser && (
                        <>
                            <CreateContent
                                label="Add a skill"
                                onClick={() => setOpenModal("skills")}
                            />
                            {openModal === "skills" && (
                                <AddSkillModal
                                    skills={userData.skills}
                                    onCloseModal={() => setOpenModal(null)}
                                />
                            )}
                        </>
                    )}
                    <Skills rootUser={rootUser} skills={userData.skills} />
                </>
            )}
            {active === "photos" && (
                <>
                    {rootUser && (
                        <>
                            <CreateContent
                                label="Add photos"
                                onClick={() => setOpenModal("photos")}
                            />
                            {openModal === "photos" && (
                                <AddPhotosModal
                                    currentUserId={userData.userId}
                                    onCloseModal={() => setOpenModal(null)}
                                />
                            )}
                            {openModal === "photos"}
                        </>
                    )}
                    <Photos
                        rootUser={rootUser}
                        galleries={userData.galleries}
                    />
                </>
            )}
            {active === "posts" && (
                <>
                    <>
                        {rootUser && (
                            <>
                                <CreateContent
                                    label="Create a post"
                                    onClick={() => setOpenModal("post")}
                                />
                                {openModal === "post" && (
                                    <CreatePostModal
                                        currentUserId={userData.userId}
                                        onCloseModal={() => setOpenModal(null)}
                                    />
                                )}
                            </>
                        )}
                    </>
                    <Posts rootUser={rootUser} posts={userData.posts} />
                </>
            )}
        </div>
    );
};

export default Content;
