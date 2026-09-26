"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import {
    getViewerContext,
    visibleGalleries,
    visiblePosts,
    visibleProjects,
    type ViewerContext,
} from "@/lib/visibility";
import { getSession } from "@/lib/session";

/*
 * Loads everything shown on a profile/portfolio.
 *
 * Kept fast by:
 *  - counting likes/saves/views (_count) instead of loading every user
 *    who liked something
 *  - loading post details in one query per type (no query per post)
 *  - running independent queries at the same time
 *  - only loading "saved / liked / viewed" lists for your own portfolio
 */

const counts = { select: { likes: true, saves: true, views: true } } as const;

const projectSelect = {
    id: true,
    name: true,
    summary: true,
    status: true,
    startDate: true,
    endDate: true,
    createdAt: true,
    iconImage: true,
    bannerImage: true,
    skills: { select: { id: true, name: true, iconImage: true } },
    _count: counts,
} satisfies Prisma.ProjectSelect;

const experienceSelect = {
    id: true,
    title: true,
    organization: true,
    description: true,
    startDate: true,
    endDate: true,
    status: true,
    location: true,
    locationType: true,
    employmentType: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ExperienceSelect;

const educationSelect = {
    id: true,
    degree: true,
    fieldOfStudy: true,
    school: true,
    activitiesAndSocieties: true,
    startDate: true,
    endDate: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.EducationSelect;

const meritSelect = {
    id: true,
    title: true,
    issuer: true,
    meritType: true,
    summary: true,
    issueDate: true,
    expiryDate: true,
    image: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.MeritSelect;

const gallerySelect = {
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
    photos: {
        where: { hiddenAt: null },
        select: { id: true, image: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
    },
} satisfies Prisma.GallerySelect;

const postSelect = {
    id: true,
    type: true,
    dataId: true,
    createdAt: true,
    updatedAt: true,
    description: true,
    content: true,
    location: true,
    tags: true,
    mentions: true,
    _count: counts,
} satisfies Prisma.PostSelect;

const byStatusAndDate: Prisma.ProjectOrderByWithRelationInput[] = [
    { status: "asc" },
    { endDate: { sort: "desc", nulls: "last" } },
    { startDate: "desc" },
];

// Saved/liked/viewed lists can grow forever; show the most recent ones.
const ACTIVITY_LIMIT = 60;

type PostRow = Prisma.PostGetPayload<{ select: typeof postSelect }>;

// Loads the linked project/experience/etc. for every post: one query per
// type instead of one per post.
async function attachPostDetails(posts: PostRow[], projectsWhere: Prisma.ProjectWhereInput) {
    const idsOf = (type: string) =>
        posts.filter((p) => p.type === type).map((p) => p.dataId);

    const [projects, experiences, educations, merits] = await Promise.all([
        idsOf("project").length
            ? prisma.project.findMany({
                  where: { AND: [{ id: { in: idsOf("project") } }, projectsWhere] },
                  select: projectSelect,
              })
            : [],
        idsOf("experience").length
            ? prisma.experience.findMany({ where: { id: { in: idsOf("experience") } }, select: experienceSelect })
            : [],
        idsOf("education").length
            ? prisma.education.findMany({ where: { id: { in: idsOf("education") } }, select: educationSelect })
            : [],
        idsOf("merit").length
            ? prisma.merit.findMany({ where: { id: { in: idsOf("merit") } }, select: meritSelect })
            : [],
    ]);

    const lookup: Record<string, Map<string, unknown>> = {
        project: new Map(projects.map((x) => [x.id, x])),
        experience: new Map(experiences.map((x) => [x.id, x])),
        education: new Map(educations.map((x) => [x.id, x])),
        merit: new Map(merits.map((x) => [x.id, x])),
    };

    const withDetails = posts.map((post) => ({
        ...post,
        data:
            lookup[post.type]?.get(post.dataId) ??
            (lookup[post.type]
                ? null
                : {
                      id: post.id,
                      content: post.content ?? [],
                      description: post.description,
                      location: post.location,
                      tags: post.tags ?? [],
                      mentions: post.mentions ?? [],
                      createdAt: post.createdAt,
                      updatedAt: post.updatedAt,
                      _count: post._count,
                  }),
    }));

    // Drop posts whose project was deleted or is hidden from this viewer.
    return withDetails.filter((p) => p.data !== null);
}

export async function getUserData(
    userId?: string,
    options: { includeActivity?: boolean; viewer?: ViewerContext } = {}
) {
    const session = await getSession();
    const targetUserId = userId ?? session?.user?.id;
    if (!targetUserId) return { error: "Unauthorized." };

    // Only show what the person looking is allowed to see.
    const viewer = options.viewer ?? (await getViewerContext(session?.user?.id));
    const projectsWhere = visibleProjects(viewer);

    const activity = options.includeActivity
        ? {
              projectsLiked: { where: projectsWhere, select: projectSelect, orderBy: { updatedAt: "desc" as const }, take: ACTIVITY_LIMIT },
              projectsViewed: { where: projectsWhere, select: projectSelect, orderBy: { updatedAt: "desc" as const }, take: ACTIVITY_LIMIT },
              projectsSaved: { where: projectsWhere, select: projectSelect, orderBy: { updatedAt: "desc" as const }, take: ACTIVITY_LIMIT },
          }
        : {};

    const [found, skills] = await Promise.all([
        prisma.userData.findUnique({
            where: { userId: targetUserId },
            select: {
                id: true,
                userId: true,
                projects: { where: projectsWhere, select: projectSelect, orderBy: byStatusAndDate },
                projectsContributedTo: { where: projectsWhere, select: projectSelect, orderBy: byStatusAndDate },
                experiences: {
                    select: experienceSelect,
                    orderBy: [
                        { status: "asc" },
                        { endDate: { sort: "desc", nulls: "last" } },
                        { startDate: "desc" },
                    ],
                },
                educations: {
                    select: educationSelect,
                    orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
                },
                merits: {
                    select: meritSelect,
                    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
                },
                posts: { where: visiblePosts(viewer), select: postSelect, orderBy: { updatedAt: "desc" } },
                galleries: { where: visibleGalleries(viewer), select: gallerySelect, orderBy: { createdAt: "desc" } },
                ...activity,
            },
        }),
        prisma.skill.findMany({
            where: { users: { some: { userId: targetUserId } } },
            select: {
                id: true,
                name: true,
                iconImage: true,
                createdAt: true,
                updatedAt: true,
                projects: {
                    where: { userData: { userId: targetUserId } },
                    select: { id: true, name: true },
                },
                experiences: {
                    where: { userData: { userId: targetUserId } },
                    select: { id: true, title: true },
                },
            },
        }),
    ]);

    if (!found) {
        // First visit: create the row and return an empty profile.
        const created = await prisma.userData.upsert({
            where: { userId: targetUserId },
            update: {},
            create: { userId: targetUserId },
            select: { id: true, userId: true },
        });
        return {
            ...created,
            projects: [],
            projectsContributedTo: [],
            projectsLiked: [],
            projectsViewed: [],
            projectsSaved: [],
            experiences: [],
            educations: [],
            merits: [],
            posts: [],
            galleries: [],
            skills,
        };
    }

    // Only filled for your own portfolio (includeActivity).
    const withActivity = found as typeof found & {
        projectsLiked?: unknown[];
        projectsViewed?: unknown[];
        projectsSaved?: unknown[];
    };

    return {
        ...found,
        projectsLiked: withActivity.projectsLiked ?? [],
        projectsViewed: withActivity.projectsViewed ?? [],
        projectsSaved: withActivity.projectsSaved ?? [],
        posts: found.posts.length ? await attachPostDetails(found.posts, projectsWhere) : [],
        skills,
    };
}
