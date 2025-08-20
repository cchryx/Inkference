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
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {merits.map((merit) => (
                <MeritCard rootUser={rootUser} key={merit.id} merit={merit} />
            ))}
        </div>
    );
};

export default Merits;
