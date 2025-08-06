import ExperienceCard from "../cards/ExperienceCard";

type Props = {
    // experiences: any[];
    rootUser?: boolean;
};

type Experience = {
    title: string;
    description?: string | null;
    organization: {
        name: string;
        image?: string | null;
    } | null;
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    locationType?: string | null;
    employmentType?: string | null;
    status: "IN_PROGRESS" | "COMPLETE";
};

const Experiences = ({ rootUser = false }: Props) => {
    const experiences: Experience[] = [
        {
            title: "Product Designer",
            description:
                "Led a team to redesign the onboarding flow and improve user retention.",
            organization: {
                name: "Figma",
                image: "https://cdn.sanity.io/images/599r6htc/regionalized/5094051dac77593d0f0978bdcbabaf79e5bb855c-1080x1080.png?w=540&h=540&q=75&fit=max&auto=format",
            },
            startDate: "2021-04-01",
            endDate: "Present",
            location: "San Francisco, CA",
            locationType: "Remote",
            employmentType: "Full-time",
            status: "IN_PROGRESS", // OK, literal
        },
        {
            title: "UX Research Intern",
            description: null,
            organization: {
                name: "Google",
                image: "https://yt3.googleusercontent.com/2eI1TjX447QZFDe6R32K0V2mjbVMKT5mIfQR-wK5bAsxttS_7qzUDS1ojoSKeSP0NuWd6sl7qQ=s900-c-k-c0x00ffffff-no-rj",
            },
            startDate: "2020-05-15",
            endDate: "2020-08-20",
            location: "Mountain View, CA",
            locationType: null,
            employmentType: "Internship",
            status: "COMPLETE",
        },
        {
            title: "Freelance Web Developer",
            description:
                "Built responsive websites and custom CMS solutions for small businesses.",
            organization: null,
            startDate: "2019-01-01",
            endDate: "2020-12-31",
            location: null,
            locationType: "Hybrid",
            employmentType: null,
            status: "COMPLETE",
        },
        {
            title: "Front-End Developer",
            description: null,
            organization: {
                name: "Shopify",
                image: "https://www.realisable.co.uk/wp-content/themes/realisable/images/logos/shopify.svg",
            },
            startDate: "2018-03-01",
            endDate: "2019-11-01",
            location: "Toronto, ON",
            locationType: null,
            employmentType: "Contract",
            status: "COMPLETE",
        },
        {
            title: "UI Designer",
            description:
                "Collaborated with developers to create a design system using Figma and Storybook.",
            organization: {
                name: "Startup XYZ",
                image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/.xyz_logo.svg/1200px-.xyz_logo.svg.png",
            },
            startDate: "2022-01-10",
            endDate: null,
            location: null,
            locationType: null,
            employmentType: null,
            status: "IN_PROGRESS",
        },
    ];

    return (
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 cursor-pointer">
            {experiences.map((exp, i) => (
                <ExperienceCard key={i} experience={exp} />
            ))}
        </div>
    );
};

export default Experiences;
