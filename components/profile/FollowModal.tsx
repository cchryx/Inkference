import { useState } from "react";
import { User } from "lucide-react";
import Modal from "../general/Modal";
import Link from "next/link";

type FollowUser = {
    userId: string;
    name: string;
    image: string;
    username: string;
};

type FollowModalProps = {
    open: boolean;
    onClose: () => void;
    followers: FollowUser[];
    following: FollowUser[];
};

const FollowModal = ({
    open,
    onClose,
    followers,
    following,
}: FollowModalProps) => {
    const [view, setView] = useState<"followers" | "following">("followers");

    const activeList = view === "followers" ? followers : following;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="w-full p-4 max-h-[80vh] flex flex-col overflow-hidden select-none">
                {/* Toggle Nav */}
                <div className="flex border-b border-muted mb-4">
                    <button
                        onClick={() => setView("followers")}
                        className={`flex-1 py-2 text-sm cursor-pointer font-medium ${
                            view === "followers"
                                ? "border-b-2 border-black"
                                : "text-muted-foreground hover:text-black"
                        }`}
                    >
                        Followers{" "}
                        <span className="bg-blue-200 px-1 py-0.5 rounded-sm font-semibold">
                            {followers.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setView("following")}
                        className={`flex-1 py-2 text-sm cursor-pointer font-medium ${
                            view === "following"
                                ? "border-b-2 border-black"
                                : "text-muted-foreground hover:text-black"
                        }`}
                    >
                        Following{" "}
                        <span className="bg-blue-200 px-1 py-0.5 rounded-sm font-semibold">
                            {following.length}
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto space-y-3 pr-1">
                    {activeList.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">
                            No{" "}
                            {view === "followers" ? "followers" : "following"}{" "}
                            yet.
                        </p>
                    ) : (
                        activeList.map(({ user }: any, index) => (
                            <Link
                                key={index}
                                href={`/profile/${user.username}`}
                                className="flex items-center gap-3 hover:bg-gray-100 rounded-md p-1"
                            >
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-medium">
                                        {user.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        @{user.username}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default FollowModal;
