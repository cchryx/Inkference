import { useState } from "react";
import { Skeleton } from "./Skeleton";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
    fallbackSrc?: string;
};

const Img = ({
    src,
    alt,
    fallbackSrc = "/assets/general/fillerImage.png",
    className = "",
    ...props
}: Props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div className="relative">
            {/* Skeleton while loading */}
            {loading && !error && (
                <Skeleton className={`absolute inset-0 ${className}`} />
            )}

            <img
                src={error ? fallbackSrc : src}
                alt={alt}
                className={`object-contain transition-opacity duration-300 ${
                    loading ? "opacity-0" : "opacity-100"
                } ${className}`}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setError(true);
                    setLoading(false);
                }}
                {...props}
            />
        </div>
    );
};

export default Img;
