"use server";

// Calls Google's Places Text Search API directly. Replaces the
// @googlemaps/google-maps-services-js package, which relied on an
// outdated, vulnerable dependency.
type PlaceResult = {
    place_id: string;
    name?: string;
    formatted_address?: string;
};

export const autocomplete = async (input: string): Promise<PlaceResult[]> => {
    if (!input) return [];

    try {
        const params = new URLSearchParams({
            query: input,
            key: process.env.GOOGLE_API_KEY!,
        });

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
            { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as {
            status: string;
            results?: PlaceResult[];
            error_message?: string;
        };

        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            throw new Error(data.error_message || data.status);
        }

        return data.results || [];
    } catch (error) {
        // toast() only works in the browser, so log it here instead.
        console.error("Failed to fetch address suggestions:", error);
        return [];
    }
};
