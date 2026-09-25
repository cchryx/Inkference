/**
 * Structured data for Google (JSON-LD). Invisible on the page; tells search
 * engines "this is a person / project / post" so results look richer.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            // Escape "<" so user text can never close the script tag.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
    );
}
