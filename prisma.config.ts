import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Used by the Prisma CLI (generate, db push, migrate, studio).
// DIRECT_URL skips Supabase's connection pooler, which migrations need.
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: env("DIRECT_URL"),
    },
});
