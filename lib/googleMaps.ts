"use server";

import {
    Client,
    PlaceAutocompleteType,
} from "@googlemaps/google-maps-services-js";
import { toast } from "sonner";

const client = new Client();
export const autocomplete = async (input: string) => {
    if (!input) return [];

    try {
        const response = await client.textSearch({
            params: {
                query: input,
                key: process.env.GOOGLE_API_KEY!,
            },
        });

        return response.data.results || [];
    } catch (error) {
        toast.error(
            "Failed to fetch address suggestions. Please try again later."
        );
        return [];
    }
};
