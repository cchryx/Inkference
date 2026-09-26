// Server-side checks for photo URLs sent from the browser.

/**
 * True if the URL is a photo this user uploaded through uploadPhotos
 * (it lives in their own folder on our Cloudinary account).
 * Stops people from attaching random outside images, or someone else's.
 */
export function isOwnUpload(url: unknown, userId: string) {
    if (typeof url !== "string") return false;
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const prefix = `https://res.cloudinary.com/${cloud}/image/upload/`;
    return url.startsWith(prefix) && url.includes(`/${userId}/`);
}
