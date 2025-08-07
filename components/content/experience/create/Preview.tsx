import { Label } from "@radix-ui/react-label";
import React from "react";

const Preview = ({
    title,
    organization,
    description,
    timeline,
    location,
    locationType,
    employmentType,
}: {
    title: string;
    organization: string;
    description: string;
    timeline: {
        status: string;
        startDate: number | null;
        endDate: number | null;
    };
    location: string;
    locationType: string;
    employmentType: string;
}) => {
    return (
        <div className="space-y-4 text-sm text-gray-800">
            <div>
                <span className="font-semibold">Title:</span> {title}
            </div>

            <div>
                <span className="font-semibold">Organization:</span>{" "}
                {organization || "[No Organization Provided]"}
            </div>

            <div>
                <Label className="font-semibold">Experience Description:</Label>
                <div className="break-words">
                    {description || "[No Description Provided]"}
                </div>
            </div>
            <div>
                <span className="font-semibold">Location:</span> {location}
            </div>

            <div>
                <span className="font-semibold">Location Type:</span>{" "}
                {locationType}
            </div>

            <div>
                <span className="font-semibold">Employment Type:</span>{" "}
                {employmentType}
            </div>

            <div>
                <span className="font-semibold">Experience Status:</span>{" "}
                {timeline.status}
            </div>

            <div>
                <span className="font-semibold">Experience Start Date:</span>{" "}
                {timeline.startDate
                    ? new Date(timeline.startDate * 1000).toLocaleDateString(
                          undefined,
                          {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                          }
                      )
                    : "N/A"}
            </div>

            {timeline.status === "Complete" && (
                <div>
                    <span className="font-semibold">Experience End Date:</span>{" "}
                    {timeline.endDate
                        ? new Date(timeline.endDate * 1000).toLocaleDateString(
                              undefined,
                              {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                              }
                          )
                        : "N/A"}
                </div>
            )}
        </div>
    );
};

export default Preview;
