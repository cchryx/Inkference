import { deleteMerit } from "@/actions/content/merit/deleteMerit";
import ConfirmModal from "@/components/general/ConfirmModal";
import { CalendarDays, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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

const formatDate = (timestamp: number | null | undefined) =>
    timestamp
        ? new Date(timestamp).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : "[Not Applicable]";

const MeritCard = ({
    merit,
    rootUser = false,
}: {
    merit: Merit;
    rootUser?: boolean;
}) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [confirmMopen, setConfirmMOpen] = useState(false);

    const {
        id,
        title,
        issuer,
        meritType,
        summary,
        issueDate,
        expiryDate,
        image,
    } = merit;

    const handleDeleteMerit = async () => {
        setIsPending(true);
        const { error } = await deleteMerit(id);
        if (error) {
            toast.error(error);
        } else {
            toast.success("Merit deleted successfully.");
            router.refresh();
        }
        setIsPending(false);
    };

    return (
        <>
            <ConfirmModal
                isPending={isPending}
                open={confirmMopen}
                title="Delete this merit?"
                text="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => {
                    handleDeleteMerit();
                    setConfirmMOpen(false);
                }}
                onClose={() => setConfirmMOpen(false)}
            />
            <div className="relative bg-gray-100 rounded-xl shadow-md hover:shadow-lg transition-shadow transform-gpu hover:-translate-y-1 hover:scale-[1.01] duration-300 overflow-hidden flex flex-col p-4 max-w-md">
                {/* Top: Title and Issuer */}
                <div className="flex justify-between items-start mb-2">
                    <div className="max-w-[75%]">
                        <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {title || "[No Title Provided]"}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1 font-medium">
                            Issuer: {issuer || "[No Issuer Provided]"}
                        </p>
                    </div>
                    {/* Always show filler image */}
                    <img
                        src="/assets/general/fillers/merit.png"
                        alt="Merit filler"
                        className="w-16 h-16 object-contain rounded-md border border-gray-300 shadow"
                    />
                </div>

                {/* Merit Type */}
                <p className="text-sm font-semibold text-indigo-700 mb-2">
                    {meritType || "[No Type Provided]"}
                </p>

                {/* Summary */}
                <div className="text-sm text-gray-700 mb-4 break-words line-clamp-5">
                    {summary || "[No Summary Provided]"}
                </div>

                {/* New image section below summary */}
                {image && (
                    <div className="w-full h-50 mb-4 rounded-md overflow-hidden border border-gray-300 shadow">
                        <img
                            src={image}
                            alt={`${title} merit image`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target =
                                    e.currentTarget as HTMLImageElement;
                                target.src =
                                    "/assets/general/fillers/merit.png";
                            }}
                        />
                    </div>
                )}

                {/* Timeline */}
                <div className="text-xs text-gray-500 flex flex-col gap-1 mb-2">
                    <p className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-1" />
                        <span>Issue Date: {formatDate(issueDate)}</span>
                    </p>
                    {expiryDate !== undefined && (
                        <p className="flex items-center">
                            <CalendarDays className="w-4 h-4 mr-1" />
                            <span>Expiry Date: {formatDate(expiryDate)}</span>
                        </p>
                    )}
                </div>

                {/* Delete button */}
                {rootUser && (
                    <button
                        className="absolute cursor-pointer bottom-3 right-3 text-black hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition"
                        onClick={() => setConfirmMOpen(true)}
                        aria-label="Delete Merit"
                    >
                        <Trash className="w-5 h-5" />
                    </button>
                )}
            </div>
        </>
    );
};

export default MeritCard;
