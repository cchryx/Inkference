import { Label } from "@radix-ui/react-label";
import React from "react";

const Preview = ({
    school,
    degree,
    fieldOfStudy,
    timeline,
    activitiesAndSocieties,
}: {
    school: string;
    degree: string;
    fieldOfStudy: string;
    timeline: {
        startDate: number | null;
        endDate: number | null;
    };
    activitiesAndSocieties: string;
}) => {
    return (
        <div className="space-y-4 text-sm text-gray-800">
            <div>
                <span className="font-semibold">School:</span>{" "}
                {school || "[No School Provided]"}
            </div>

            <div>
                <span className="font-semibold">Degree:</span>{" "}
                {degree || "[No Degree Provided]"}
            </div>

            <div>
                <span className="font-semibold">Field of Study:</span>{" "}
                {fieldOfStudy || "[No Field Provided]"}
            </div>

            <div>
                <span className="font-semibold">Education Start Date:</span>{" "}
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

            <div>
                <span className="font-semibold">Education End Date:</span>{" "}
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

            <div>
                <Label className="font-semibold">Activities & Societies:</Label>
                <div className="break-words">
                    {activitiesAndSocieties || "[No Activities Provided]"}
                </div>
            </div>
        </div>
    );
};

export default Preview;
