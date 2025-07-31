import { Label } from "@radix-ui/react-label";
import React from "react";
import { Link2 } from "lucide-react";

const Preview = ({
    name,
    summary,
    description,
    projectLinks,
    iconImageUrl,
    bannerImageUrl,
    timeline,
    projectResources,
}: {
    name: string;
    summary: string;
    description: string;
    projectLinks: string[];
    iconImageUrl: string;
    bannerImageUrl: string;
    timeline: {
        status: string;
        startDate: number | null;
        endDate: number | null;
    };
    projectResources: string[];
}) => {
    return (
        <div className="space-y-4 text-sm text-gray-800">
            <div>
                <div>
                    <span className="font-semibold">Project Name:</span> {name}
                </div>
            </div>

            <div>
                <Label className="font-semibold">Project Summary</Label>
                <div className="break-words">
                    {summary || "[No Summary Provided]"}
                </div>
            </div>

            <div>
                <Label className="font-semibold">Project Description</Label>
                <div className="max-h-32 overflow-y-auto break-words whitespace-pre-wrap border p-2 rounded bg-gray-50">
                    {description || "[No Description Provided]"}
                </div>
            </div>

            <div>
                <Label className="font-semibold">Project Links</Label>
                <div>
                    {projectLinks.length > 0 ? (
                        <ul className="list-none flex flex-col space-y-2">
                            {projectLinks.map((link, i) => (
                                <li
                                    key={i}
                                    className="inline-flex items-center gap-2 bg-gray-200 rounded px-2 py-1 break-words max-w-full"
                                >
                                    <Link2 className="w-4 h-4 text-gray-600" />
                                    <span className="truncate max-w-xs">
                                        {link}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        "No links added."
                    )}
                </div>
            </div>

            <div>
                <span className="font-semibold">Project Icon:</span>{" "}
                {iconImageUrl ? (
                    <img
                        src={iconImageUrl}
                        alt="Icon"
                        className="inline-block size-10 rounded ml-1 align-middle"
                    />
                ) : (
                    "[No Icon Image]"
                )}
            </div>

            <div>
                <span className="font-semibold">Project Banner:</span>{" "}
                {bannerImageUrl ? (
                    <img
                        src={bannerImageUrl}
                        alt="Banner"
                        className="w-full h-24 rounded object-cover mt-2"
                    />
                ) : (
                    "[No Banner Image]"
                )}
            </div>

            <div>
                <span className="font-semibold">Project Status:</span>{" "}
                {timeline.status}
            </div>

            <div>
                <span className="font-semibold">Project Start Date :</span>{" "}
                {timeline.startDate
                    ? new Date(timeline.startDate).toLocaleDateString(
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
                    <span className="font-semibold">Project End Date :</span>{" "}
                    {timeline.endDate
                        ? new Date(timeline.endDate).toLocaleDateString(
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

            <div>
                <Label className="font-semibold">Project Resources</Label>
                <div
                    className={`overflow-y-auto ${
                        projectResources.length > 3 ? "max-h-30" : ""
                    }`}
                >
                    {projectResources.length > 0 ? (
                        <ul className="list-none flex flex-col space-y-2">
                            {projectResources.map((res, i) => (
                                <li
                                    key={i}
                                    className="inline-flex items-center gap-2 bg-gray-200 rounded px-2 py-1 break-words max-w-full"
                                >
                                    <Link2 className="w-4 h-4 text-gray-600" />
                                    <span className="truncate max-w-xs">
                                        {res}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        "[No Resources Listed]"
                    )}
                </div>
            </div>
        </div>
    );
};

export default Preview;
