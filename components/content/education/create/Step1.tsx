"use client";

import InfoTooltip from "@/components/general/InfoToolTip";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";

type Props = {
    school: string;
    setSchool: (value: string) => void;
    degree: string;
    setDegree: (value: string) => void;
    fieldOfStudy: string;
    setFieldOfStudy: (value: string) => void;
};

const Step1 = ({
    school,
    setSchool,
    degree,
    setDegree,
    fieldOfStudy,
    setFieldOfStudy,
}: Props) => {
    return (
        <>
            {/* School */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="school">School</Label>
                    <InfoTooltip text="Name of the school you recieved this education from. (max 60 chars)" />
                </div>
                <Input
                    id="school"
                    name="school"
                    value={school}
                    placeholder="Start typing school..."
                    onChange={(e) => setSchool(e.target.value.slice(0, 60))}
                />
                <span className="text-xs text-gray-500">
                    {60 - school.length} characters left
                </span>
            </div>

            {/* Degree */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="degree">Degree</Label>
                    <InfoTooltip text="What type of degree are you studying? (max 60 chars)" />
                </div>
                <Input
                    id="degree"
                    name="degree"
                    value={degree}
                    placeholder="Start typing degree..."
                    onChange={(e) => setDegree(e.target.value.slice(0, 60))}
                />
                <span className="text-xs text-gray-500">
                    {60 - degree.length} characters left
                </span>
            </div>

            {/* Field of Study */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Label htmlFor="fieldOfStudy">Field of Study</Label>
                    <InfoTooltip text="What field are you studying? (max 60 chars)" />
                </div>
                <Input
                    id="fieldOfStudy"
                    name="fieldOfStudy"
                    value={fieldOfStudy}
                    placeholder="Start typing field of study..."
                    onChange={(e) =>
                        setFieldOfStudy(e.target.value.slice(0, 60))
                    }
                />
                <span className="text-xs text-gray-500">
                    {60 - fieldOfStudy.length} characters left
                </span>
            </div>
        </>
    );
};

export default Step1;
