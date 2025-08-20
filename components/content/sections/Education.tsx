import EducationCard from "../cards/EducationCard";

type Props = {
    educations: any[];
    rootUser?: boolean;
};

const Education = ({ educations, rootUser = false }: Props) => {
    if (!educations || educations.length === 0) {
        return (
            <div className="my-8 select-none flex items-center justify-center bg-gray-200 p-12 rounded-md text-center text-muted-foreground">
                {!rootUser
                    ? "This profile has not added any educations yet."
                    : "You have not added any educations yet. You can try adding some now."}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-10">
            {educations.map((item) => (
                <EducationCard
                    key={item.id}
                    education={item}
                    rootUser={rootUser}
                />
            ))}
        </div>
    );
};

export default Education;
