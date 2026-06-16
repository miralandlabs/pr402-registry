import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const FACILITATOR_BASES = {
  production: "https://ipay.sh",
  preview: "https://preview.ipay.sh",
} as const;

function facilitatorProxy(): Plugin {
  return {
    name: "facilitator-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/v1/facilitator")) {
          next();
          return;
        }
        const network =
          req.headers["x-registry-network"] === "preview" ? "preview" : "production";
        const base = FACILITATOR_BASES[network];
        const target = `${base}${req.url}`;
        try {
          const upstream = await fetch(target, {
            headers: { accept: "application/json" },
          });
          res.statusCode = upstream.status;
          res.setHeader("content-type", upstream.headers.get("content-type") ?? "application/json");
          res.setHeader("cache-control", "public, max-age=30");
          const body = await upstream.text();
          res.end(body);
        } catch {
          res.statusCode = 502;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "Facilitator proxy failed" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), facilitatorProxy()],
  server: {
    port: 5174,
  },
});
