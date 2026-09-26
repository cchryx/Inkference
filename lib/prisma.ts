import { PrismaClient, Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolClient } from "pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

/*
 * Inside a transaction Prisma sometimes sends a few queries at once on the
 * same connection. pg handles that, but warns ("Calling client.query() when
 * the client is already executing a query is deprecated"). This makes each
 * connection run its queries one after another, which is what pg wants.
 */
function oneQueryAtATime(client: PoolClient) {
    const original = client.query.bind(client) as (...args: unknown[]) => unknown;
    let queue: Promise<unknown> = Promise.resolve();
    (client as unknown as { query: (...args: unknown[]) => unknown }).query = (...args: unknown[]) => {
        const last = args[args.length - 1];
        const first = args[0] as { submit?: unknown } | undefined;
        // Callback style or streaming queries: leave them alone.
        if (typeof last === "function" || typeof first?.submit === "function") return original(...args);
        const run = queue.then(() => original(...args));
        queue = run.catch(() => undefined);
        return run;
    };
}

function createClient() {
    // The app talks to the database through the pooled URL.
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.on("connect", oneQueryAtATime);
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

// In development the client is kept on `global` so hot reloads don't open
// new connections. But if the schema gained a model since then (e.g. after
// `prisma generate`), that old client doesn't know about it, so make a new one.
function isUpToDate(client: PrismaClient) {
    return Object.values(Prisma.ModelName).every((model) => {
        const key = model.charAt(0).toLowerCase() + model.slice(1);
        return (client as unknown as Record<string, unknown>)[key] !== undefined;
    });
}

const cached = globalForPrisma.prisma;
export const prisma = cached && isUpToDate(cached) ? cached : createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
