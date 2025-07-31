"use client";

import { useState } from "react";

import ContentsBar from "./Contentsbar";
import Projects from "./sections/Projects";
import Experiences from "./sections/Experiences";
import Education from "./sections/Education";
import Skills from "./sections/Skills";
import Photos from "./sections/Photos";
import Posts from "./sections/Posts";
import CreateContent from "../project/create/CreateContent";
import CreateProjectModal from "../project/create/CreateProjectModal";

type Props = {
    content: any;
    rootUser?: boolean;
};

const Content = ({ content, rootUser = false }: Props) => {
    const [active, setActive] = useState("projects");
    const [openModal, setOpenModal] = useState<"project" | null>(null);

    return (
        <div className="w-full">
            {/* Sticky ContentsBar */}
            <ContentsBar active={active} setActive={setActive} />

            {/* Content below */}
            {active === "projects" && (
                <>
                    {rootUser && (
                        <>
                            <CreateContent
                                label="Projects"
                                onClick={() => setOpenModal("project")}
                            />

                            {openModal === "project" && (
                                <CreateProjectModal
                                    onCloseModal={() => setOpenModal(null)}
                                />
                            )}
                        </>
                    )}
                    <Projects rootUser={rootUser} projects={content.projects} />
                </>
            )}
            {active === "experiences" && <Experiences />}
            {active === "education" && <Education />}
            {active === "skills" && <Skills />}
            {active === "photos" && <Photos />}
            {active === "posts" && <Posts />}
        </div>
    );
};

export default Content;
