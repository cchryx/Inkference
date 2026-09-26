"use server";

import { prisma } from "@/lib/prisma";
import { APIError } from "better-auth/api";
import { getSession } from "@/lib/session";

/*
 * Recommended accounts
 *
 * 1. Collect candidates from several signals (in parallel):
 *      - they follow you
 *      - followed by people you follow   (mutual follows)
 *      - friends with your friends       (mutual friends)
 *      - worked on the same projects
 *      - share your skills
 *      - popular / recently joined       (fallback for new users)
 * 2. Give each candidate a score. Signals add up, so someone who shares
 *    3 skills AND is followed by 2 of your follows ranks above either alone.
 * 3. Return the top results, each with the reason that counted most.
 *
 * Never shown: you, people you already follow/are friends with, blocked
 * users (either direction), pending requests, and users without a username.
 */

export type RecommendedUser = {
    id: string;
    name: string;
    username: string;
    image: string | null;
    reason: string;
};

// How much each signal is worth, and how many times it can count.
const WEIGHTS = {
    followsYou: { points: 40, max: 1 },
    mutualFollow: { points: 8, max: 10 },
    mutualFriend: { points: 10, max: 8 },
    sharedProject: { points: 20, max: 3 },
    sharedSkill: { points: 5, max: 5 },
    popular: { points: 5, max: 1 },
    newUser: { points: 4, max: 1 },
} as const;

type Signal = keyof typeof WEIGHTS;

type Candidate = {
    score: number;
    topPoints: number;
    reason: string;
};

const CANDIDATES_PER_SIGNAL = 200;

function others(name: string | null | undefined, count: number) {
    const first = name || "someone you know";
    return count > 1 ? `${first} and ${count - 1} other${count > 2 ? "s" : ""}` : first;
}

export async function recommendUsers(limit = 12) {
    try {
        const session = await getSession();
        const currentUserId = session?.user?.id;
        if (!currentUserId) return { error: "Unauthorized." };

        limit = Math.min(Math.max(1, limit), 50);

        // --- Who am I connected to? (ids only) ---
        const [me, myData] = await Promise.all([
            prisma.relationships.upsert({
                where: { userId: currentUserId },
                update: {},
                create: { userId: currentUserId },
                select: {
                    following: { select: { id: true, userId: true } },
                    followers: { select: { userId: true } },
                    friends: { select: { id: true, userId: true } },
                    blockedUsers: { select: { userId: true } },
                    blockedBy: { select: { userId: true } },
                    followRequestsSent: { select: { userId: true } },
                    friendRequestsSent: { select: { userId: true } },
                },
            }),
            prisma.userData.upsert({
                where: { userId: currentUserId },
                update: {},
                create: { userId: currentUserId },
                select: {
                    skills: { select: { id: true } },
                    projects: { select: { id: true } },
                    projectsContributedTo: { select: { id: true } },
                },
            }),
        ]);

        const excluded = new Set<string>([currentUserId]);
        for (const list of [
            me.following,
            me.friends,
            me.blockedUsers,
            me.blockedBy,
            me.followRequestsSent,
            me.friendRequestsSent,
        ]) {
            for (const r of list) excluded.add(r.userId);
        }
        const excludedIds = [...excluded];

        // Filter shared by every candidate query.
        const candidateFilter = {
            userId: { notIn: excludedIds },
            user: { username: { not: null } },
        };

        const followingRelIds = me.following.map((r) => r.id);
        const friendRelIds = me.friends.map((r) => r.id);
        const skillIds = myData.skills.map((s) => s.id);
        const projectIds = [
            ...myData.projects.map((p) => p.id),
            ...myData.projectsContributedTo.map((p) => p.id),
        ];

        const none = Promise.resolve([]);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // --- Collect candidates from each signal, in parallel ---
        const [mutualFollows, mutualFriends, collaborators, sameSkills, popular, newUsers] =
            await Promise.all([
                followingRelIds.length
                    ? prisma.relationships.findMany({
                          where: {
                              ...candidateFilter,
                              followers: { some: { id: { in: followingRelIds } } },
                          },
                          select: {
                              userId: true,
                              followers: {
                                  where: { id: { in: followingRelIds } },
                                  select: { user: { select: { name: true } } },
                                  take: 1,
                              },
                              _count: {
                                  select: {
                                      followers: {
                                          where: { id: { in: followingRelIds } },
                                      },
                                  },
                              },
                          },
                          take: CANDIDATES_PER_SIGNAL,
                      })
                    : none,

                friendRelIds.length
                    ? prisma.relationships.findMany({
                          where: {
                              ...candidateFilter,
                              friends: { some: { id: { in: friendRelIds } } },
                          },
                          select: {
                              userId: true,
                              friends: {
                                  where: { id: { in: friendRelIds } },
                                  select: { user: { select: { name: true } } },
                                  take: 1,
                              },
                              _count: {
                                  select: {
                                      friends: { where: { id: { in: friendRelIds } } },
                                  },
                              },
                          },
                          take: CANDIDATES_PER_SIGNAL,
                      })
                    : none,

                projectIds.length
                    ? prisma.userData.findMany({
                          where: {
                              ...candidateFilter,
                              OR: [
                                  { projects: { some: { id: { in: projectIds } } } },
                                  {
                                      projectsContributedTo: {
                                          some: { id: { in: projectIds } },
                                      },
                                  },
                              ],
                          },
                          select: {
                              userId: true,
                              projects: {
                                  where: { id: { in: projectIds } },
                                  select: { name: true },
                                  take: 1,
                              },
                              projectsContributedTo: {
                                  where: { id: { in: projectIds } },
                                  select: { name: true },
                                  take: 1,
                              },
                              _count: {
                                  select: {
                                      projects: { where: { id: { in: projectIds } } },
                                      projectsContributedTo: {
                                          where: { id: { in: projectIds } },
                                      },
                                  },
                              },
                          },
                          take: CANDIDATES_PER_SIGNAL,
                      })
                    : none,

                skillIds.length
                    ? prisma.userData.findMany({
                          where: {
                              ...candidateFilter,
                              skills: { some: { id: { in: skillIds } } },
                          },
                          select: {
                              userId: true,
                              skills: {
                                  where: { id: { in: skillIds } },
                                  select: { name: true },
                                  take: 2,
                              },
                              _count: {
                                  select: {
                                      skills: { where: { id: { in: skillIds } } },
                                  },
                              },
                          },
                          take: CANDIDATES_PER_SIGNAL,
                      })
                    : none,

                prisma.relationships.findMany({
                    where: { ...candidateFilter, followers: { some: {} } },
                    orderBy: { followers: { _count: "desc" } },
                    select: { userId: true },
                    take: limit * 3,
                }),

                prisma.user.findMany({
                    where: {
                        id: { notIn: excludedIds },
                        username: { not: null },
                        createdAt: { gte: monthAgo },
                    },
                    orderBy: { createdAt: "desc" },
                    select: { id: true },
                    take: limit * 2,
                }),
            ]);

        // --- Score ---
        const candidates = new Map<string, Candidate>();

        function add(userId: string, signal: Signal, times: number, reason: string) {
            const { points, max } = WEIGHTS[signal];
            const gained = points * Math.min(times, max);
            if (gained <= 0) return;

            const c = candidates.get(userId) ?? { score: 0, topPoints: 0, reason };
            c.score += gained;
            // Show the reason that contributed the most.
            if (gained > c.topPoints) {
                c.topPoints = gained;
                c.reason = reason;
            }
            candidates.set(userId, c);
        }

        const followingIds = new Set(me.following.map((r) => r.userId));
        for (const f of me.followers) {
            if (!excluded.has(f.userId) && !followingIds.has(f.userId)) {
                add(f.userId, "followsYou", 1, "Follows you");
            }
        }

        for (const r of mutualFollows) {
            const n = r._count.followers;
            add(r.userId, "mutualFollow", n, `Followed by ${others(r.followers[0]?.user.name, n)}`);
        }

        for (const r of mutualFriends) {
            const n = r._count.friends;
            add(r.userId, "mutualFriend", n, `Friends with ${others(r.friends[0]?.user.name, n)}`);
        }

        for (const u of collaborators) {
            const n = u._count.projects + u._count.projectsContributedTo;
            const project = u.projects[0]?.name ?? u.projectsContributedTo[0]?.name;
            add(
                u.userId,
                "sharedProject",
                n,
                project ? `Worked with you on ${project}` : "Worked on a project with you"
            );
        }

        for (const u of sameSkills) {
            const n = u._count.skills;
            const names = u.skills.map((s) => s.name).join(", ");
            add(u.userId, "sharedSkill", n, `Also skilled in ${names}${n > 2 ? " and more" : ""}`);
        }

        for (const r of popular) add(r.userId, "popular", 1, "Popular on Inkference");
        for (const u of newUsers) add(u.id, "newUser", 1, "New to Inkference");

        if (candidates.size === 0) return { error: null, recommendedUsers: [] };

        // --- Load details for the best candidates only ---
        const shortlist = [...candidates.entries()]
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, limit * 3)
            .map(([id]) => id);

        const users = await prisma.user.findMany({
            where: { id: { in: shortlist }, username: { not: null } },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                Relationships: {
                    select: { _count: { select: { followers: true } } },
                },
            },
        });

        const ranked = users
            .map((u) => {
                const c = candidates.get(u.id)!;
                const followers = u.Relationships?._count.followers ?? 0;
                const score =
                    c.score +
                    Math.min(3 * Math.log2(1 + followers), 15) + // popularity
                    (u.image ? 2 : 0) + // complete profiles first
                    Math.random() * 3; // small shuffle so ties rotate

                return {
                    score,
                    user: {
                        id: u.id,
                        name: u.name,
                        username: u.username!,
                        image: u.image,
                        reason: c.reason,
                    } satisfies RecommendedUser,
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((r) => r.user);

        return { error: null, recommendedUsers: ranked };
    } catch (error) {
        if (error instanceof APIError) {
            return { error: error.message?.trim() || "An unknown error occurred." };
        }
        console.error("recommendUsers failed:", error);
        return { error: "Internal server error." };
    }
}
