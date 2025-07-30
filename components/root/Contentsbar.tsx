import { PROFILE_LINKS } from "@/constants";

const ContentsBar = ({
    active,
    setActive,
}: {
    active: string;
    setActive: React.Dispatch<React.SetStateAction<string>>;
}) => (
    <div className="sticky top-0 z-40 bg-gray-200 rounded-md shadow-md">
        <div className="w-full p-2 flex justify-center">
            <div className="flex gap-8 md:gap-10">
                {PROFILE_LINKS.map((link) => {
                    const isActive = active === link.id;

                    return (
                        <div key={link.id} className="relative">
                            <button
                                onClick={() => setActive(link.id)}
                                className="group flex flex-col items-center text-gray-800 cursor-pointer"
                            >
                                <link.icon
                                    className={`w-5 h-5 transition-colors duration-300 ${
                                        isActive
                                            ? "text-black"
                                            : "text-gray-600 group-hover:text-black"
                                    }`}
                                />
                                <span className="hidden sm:inline text-xs mt-1 text-gray-600 group-hover:text-black transition-colors duration-300">
                                    {link.label}
                                </span>

                                <div
                                    className={`absolute -bottom-1 h-0.5 w-6 rounded-full bg-black transition-all duration-300 ${
                                        isActive
                                            ? "opacity-100 scale-100"
                                            : "opacity-0 scale-50 group-hover:opacity-50 group-hover:scale-100"
                                    }`}
                                />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);

export default ContentsBar;
