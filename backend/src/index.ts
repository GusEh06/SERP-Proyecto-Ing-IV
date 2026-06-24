import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config";
import { runMigrations } from "./db/migrate";
import { authRoute } from "./routes/auth.route";
import { formRoute } from "./routes/form.route";
import { dashboardRoute } from "./routes/dashboard.route";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: config.corsOrigin,
    credentials: true
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/auth", authRoute);
app.route("/api", formRoute);
app.route("/api", dashboardRoute);

async function bootstrap() {
  await runMigrations();

  serve(
    {
      fetch: app.fetch,
      port: config.port
    },
    (info) => {
      console.log(`SERP backend running on port ${info.port}`);
    }
  );
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap backend", error);
  process.exit(1);
});
