import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        theme_color: "#FFFFFF",
        background_color: "#FFFFFF",
        icons: [
            {
                purpose: "maskable",
                sizes: "512x512",
                src: "icon512_maskable.png",
                type: "image/png",
            },
            {
                purpose: "any",
                sizes: "512x512",
                src: "icon512_rounded.png",
                type: "image/png",
            },
        ],
        orientation: "any",
        display: "standalone",
        dir: "auto",
        lang: "en-US",
        name: "Inkference",
        short_name: "Inkference",
    };
}
