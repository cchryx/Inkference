import { Label } from "@radix-ui/react-label";
import React from "react";

const Preview = ({
    title,
    issuer,
    meritType,
    summary,
    timeline,
    image,
}: {
    title: string;
    issuer: string;
    meritType: string;
    summary: string;
    timeline: {
        issueDate: number | null;
        expiryDate?: number | null;
    };
    image: string;
}) => {
    return (
        <div className="space-y-4 text-sm text-gray-800">
            <div>
                <span className="font-semibold">Title:</span>{" "}
                {title || "[No Title Provided]"}
            </div>

            <div>
                <span className="font-semibold">Issuer:</span>{" "}
                {issuer || "[No Issuer Provided]"}
            </div>

            <div>
                <span className="font-semibold">Merit Type:</span>{" "}
                {meritType || "[No Type Provided]"}
            </div>

            <div>
                <span className="font-semibold">Issue Date:</span>{" "}
                {timeline.issueDate
                    ? new Date(timeline.issueDate * 1000).toLocaleDateString(
                          undefined,
                          { year: "numeric", month: "long", day: "numeric" }
                      )
                    : "N/A"}
            </div>

            {timeline.expiryDate !== undefined && (
                <div>
                    <span className="font-semibold">Expiry Date:</span>{" "}
                    {timeline.expiryDate
                        ? new Date(
                              timeline.expiryDate * 1000
                          ).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                          })
                        : "[Not Applicable]"}
                </div>
            )}

            <div>
                <Label className="font-semibold">Summary:</Label>
                <div className="break-words">
                    {summary || "[No Summary Provided]"}
                </div>
            </div>

            {image && (
                <div>
                    <Label className="font-semibold">Image:</Label>
                    <div className="mt-1">
                        <img
                            src={image}
                            className="w-full h-120 object-cover rounded-md border"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Preview;
