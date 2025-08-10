import MeritCard from "../cards/MeritCard";

type Props = {
    merits: Merit[];
    rootUser?: boolean;
};

type Merit = {
    id: string;
    title: string;
    issuer: string;
    meritType: string;
    summary: string;
    issueDate: number | null;
    expiryDate?: number | null;
    image: string;
};

// const dummyMerits: Merit[] = [
//     {
//         id: "1",
//         title: "JavaScript Mastery",
//         issuer: "OpenAI Academy",
//         meritType: "Certification",
//         summary: "Completed the advanced JavaScript course with distinction.",
//         timeline: {
//             issueDate: 1688908800, // July 10, 2023
//             expiryDate: null,
//         },
//         image: "https://via.placeholder.com/80?text=JS",
//     },
//     {
//         id: "2",
//         title: "React Developer Badge",
//         issuer: "React Community",
//         meritType: "Badge",
//         summary:
//             "Recognized as an official React developer after contributing to open source.",
//         timeline: {
//             issueDate: 1672444800, // Dec 31, 2022
//             expiryDate: 1735689600, // Dec 31, 2024
//         },
//         image: "https://via.placeholder.com/80?text=React",
//     },
// ];

const Merits = ({ merits, rootUser = false }: Props) => {
    if (!merits || merits.length === 0) {
        return (
            <div className="my-8 select-none flex items-center justify-center bg-gray-200 p-12 rounded-md text-center text-muted-foreground">
                {!rootUser
                    ? "This profile has not added any merits yet."
                    : "You have not added any merits yet. You can try adding some now."}
            </div>
        );
    }

    return (
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 cursor-pointer">
            {merits.map((merit) => (
                <MeritCard rootUser={rootUser} key={merit.id} merit={merit} />
            ))}
        </div>
    );
};

export default Merits;
