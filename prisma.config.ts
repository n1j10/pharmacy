import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // For migrations, we use the direct (non-pooled) connection URL
    url: env("DIRECT_URL"),
  },
});
