import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()]
  server: {
    allowedHosts: ["modest-cooperation-production-f10f.up.railway.app"]
  }
});
