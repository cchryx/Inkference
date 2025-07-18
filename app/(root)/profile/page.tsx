import { auth } from "@/lib/auth";
import { User } from "lucide-react";
import { headers } from "next/headers";

export default async function page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex w-full py-10 px-[5%] space-x-8">
            {/* Left box: full width by default, 70% on large screens */}
            <div className="w-full lg:w-[80%] space-y-4">
                <div className="rounded-md overflow-hidden shadow-md w-full">
                    <div className="relative">
                        <img
                            src="https://wallup.net/wp-content/uploads/2018/03/19/546507-forest-environment-lake-mountains-digital_art-water-landscape-waterfall-clouds.jpg"
                            alt="Scenic landscape"
                            className="w-full h-[200px] md:h-[300px] object-cover object-center"
                        />
                        {/* Profile circle placeholder */}
                        <div className="absolute left-[3%] -bottom-[10%] w-30 h-30 md:w-40 md:h-40 rounded-full border-3 border-gray-200 flex items-center justify-center bg-gray-700">
                            <User className="text-gray-300" size={80} />
                        </div>
                    </div>
                    <div className="bg-gray-200 p-4 font-medium pt-10">
                        {/* Your long text */}
                        Lorem ipsum dolor sit amet consectetur adipisicing
                        elit...
                    </div>
                </div>
                <div className="rounded-md overflow-hidden shadow-md w-full bg-gray-200">
                    Here will be a mennu for projects, posts, reposts,
                    experiences
                </div>
            </div>

            {/* Right box: hidden on small, block on large screens */}
            <div className="hidden lg:block lg:w-[20%] space-y-4">
                <div className="bg-gray-200 p-4 font-medium shadow-md rounded-md">
                    Social Links Will be listed here
                </div>
                <div className="bg-gray-200 p-4 font-medium shadow-md rounded-md">
                    Social Links Will be listed here
                </div>
            </div>
        </div>
    );
}
