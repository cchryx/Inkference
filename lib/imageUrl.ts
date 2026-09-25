/**
 * Returns a small, compressed version of a Cloudinary image for previews.
 *
 * Cloudinary resizes on the fly when you add settings to the URL:
 *   .../image/upload/v123/photo.jpg
 *   .../image/upload/c_limit,w_640,f_auto,q_auto/v123/photo.jpg
 *
 * c_limit,w_640 = shrink to at most 640px wide (never enlarge)
 * f_auto        = best format for the browser (WebP/AVIF)
 * q_auto        = smart compression
 *
 * Non-Cloudinary URLs are returned unchanged.
 */
export function previewUrl(url: string | undefined | null, width = 640) {
    if (!url) return "";

    const marker = "/image/upload/";
    const i = url.indexOf(marker);
    if (!url.includes("res.cloudinary.com") || i === -1) return url;

    const at = i + marker.length;
    return `${url.slice(0, at)}c_limit,w_${width},f_auto,q_auto/${url.slice(at)}`;
}
