import { PrismaClient, Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createClient() {
    // The app talks to the database through the pooled URL.
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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
