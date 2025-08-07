"use client";

import { useState } from "react";

import ContentsBar from "./Contentsbar";
import Projects from "./sections/Projects";
import Experiences from "./sections/Experiences";
import Education from "./sections/Education";
import Skills from "./sections/Skills";
import Photos from "./sections/Photos";
import Posts from "./sections/Posts";
import CreateContent from "./CreateContent";
import CreateProjectModal from "../project/create/CreateProjectModal";
import Subnavbar from "../root/Subnavbar";
import AddExperienceModal from "../experience/create/AddExperienceModal";

type Props = {
    userData: any;
    rootUser?: boolean;
};

const Content = ({ userData, rootUser = false }: Props) => {
    const [active, setActive] = useState("projects");
    const [openModal, setOpenModal] = useState<string | null>(null);
    const [projectView, setProjectView] = useState("myProjects");

    return (
        <div className="w-full">
            {/* Sticky ContentsBar */}
            <ContentsBar active={active} setActive={setActive} />

            {/* Content below */}
            {active === "projects" && (
                <>
                    {rootUser && (
                        <>
                            <Subnavbar
                                categories={[
                                    { key: "myProjects", label: "My Projects" },
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
                            {openModal === "education"}
                        </>
                    )}
                    <Education />
                </>
            )}
            {active === "skills" && (
                <>
                    <>
                        {rootUser && (
                            <>
                                <CreateContent
                                    label="Add a skill"
                                    onClick={() => setOpenModal("skill")}
                                />
                                {openModal === "skill"}
                            </>
                        )}
                        <Education />
                    </>
                    <Skills />
                </>
            )}
            {active === "photos" && (
                <>
                    <>
                        {rootUser && (
                            <>
                                <CreateContent
                                    label="Upload photos"
                                    onClick={() => setOpenModal("photo")}
                                />
                                {openModal === "photo"}
                            </>
                        )}
                        <Education />
                    </>
                    <Photos />
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
                                {openModal === "post"}
                            </>
                        )}
                        <Education />
                    </>
                    <Posts />
                </>
            )}
        </div>
    );
};

export default Content;
