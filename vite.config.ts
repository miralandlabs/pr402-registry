import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const FACILITATOR_BASES = {
  production: "https://ipay.sh",
  preview: "https://preview.ipay.sh",
} as const;

const AUTH_BASES = {
  production: "https://auth.ipay.sh",
  preview: "https://preview.auth.ipay.sh",
} as const;

function registryProxy(): Plugin {
  return {
    name: "registry-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        const isFacilitator = url.startsWith("/api/v1/facilitator");
        const isMarketplace = url.startsWith("/api/v1/marketplace");
        if (!isFacilitator && !isMarketplace) {
          next();
          return;
        }
        const network =
          req.headers["x-registry-network"] === "preview" ? "preview" : "production";
        const base = isMarketplace ? AUTH_BASES[network] : FACILITATOR_BASES[network];
        const upstreamPath = isMarketplace
          ? url.replace(/^\/api(?=\/v1\/)/, "")
          : url;
        const target = `${base}${upstreamPath}`;
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
          res.end(JSON.stringify({ error: "Upstream proxy failed" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), registryProxy()],
  server: {
    port: 5174,
  },
});
