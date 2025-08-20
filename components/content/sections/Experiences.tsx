import ExperienceCard from "../cards/ExperienceCard";

type Props = {
    experiences: any[];
    rootUser?: boolean;
};

type Experience = {
    title: string;
    description?: string | null;
    organization: {
        name: string;
        image?: string | null;
    } | null;
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    locationType?: string | null;
    employmentType?: string | null;
    status: "Ongoing" | "Complete";
};

const Experiences = ({ experiences, rootUser = false }: Props) => {
    if (!experiences || experiences.length === 0) {
        return (
            <div className="my-8 select-none flex items-center justify-center bg-gray-200 p-12 rounded-md text-center text-muted-foreground">
                {!rootUser
                    ? "This profile has not added any experiences yet."
                    : "You have not added any experiences yet. You can try adding some now."}
            </div>
        );
    }

    return (
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp, i) => (
                <ExperienceCard rootUser={rootUser} key={i} experience={exp} />
            ))}
        </div>
    );
};

export default Experiences;
