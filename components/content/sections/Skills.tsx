"use client";

import SkillCard from "../cards/SkillCard";

type Props = {
    skills: any[];
    rootUser?: boolean;
};

const Skills = ({ skills, rootUser }: Props) => {
    if (!skills || skills.length === 0) {
        return (
            <div className="my-8 select-none flex items-center justify-center bg-gray-200 p-12 rounded-md text-center text-muted-foreground">
                {!rootUser
                    ? "This profile has not added any skills yet."
                    : "You have not added any skills yet. You can try adding some now."}
            </div>
        );
    }
    return (
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map((skill, i) => (
                <SkillCard key={i} skill={skill} rootUser={rootUser} />
            ))}
        </div>
    );
};

export default Skills;
