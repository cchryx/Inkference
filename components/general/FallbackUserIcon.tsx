import { User } from "lucide-react";

type Props = {
    size?: string;
};

const FallbackUserIcon = ({ size = "size-12" }: Props) => {
    return (
        <div
            className={`rounded-full bg-gray-700 flex items-center justify-center ${size}`}
        >
            <User className={`text-gray-300 size-[60%]`} />
        </div>
    );
};

export default FallbackUserIcon;
