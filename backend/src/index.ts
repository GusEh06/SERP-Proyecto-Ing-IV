import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config";
import { authRoute } from "./routes/auth.route";
import { formRoute } from "./routes/form.route";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/auth", authRoute);
app.route("/api", formRoute);

serve(
  {
    fetch: app.fetch,
    port: config.port
  },
  (info) => {
    console.log(`SERP backend running on port ${info.port}`);
  }
);
