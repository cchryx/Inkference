import EducationCard from "../cards/EducationCard";

type Props = {
    educations: any[];
    rootUser?: boolean;
};

const Education = ({ educations, rootUser = false }: Props) => {
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
