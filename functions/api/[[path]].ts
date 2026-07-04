const FACILITATOR_BASES = {
  production: "https://ipay.sh",
  preview: "https://preview.ipay.sh",
} as const;

const AUTH_BASES = {
  production: "https://auth.ipay.sh",
  preview: "https://preview.auth.ipay.sh",
} as const;

export async function onRequest(context: {
  request: Request;
}): Promise<Response> {
  const url = new URL(context.request.url);
  const network = context.request.headers.get("X-Registry-Network");
  const isPreview = network === "preview";

  const base = url.pathname.startsWith("/api/v1/marketplace")
    ? isPreview
      ? AUTH_BASES.preview
      : AUTH_BASES.production
    : isPreview
      ? FACILITATOR_BASES.preview
      : FACILITATOR_BASES.production;

  const target = `${base}${url.pathname}${url.search}`;

  const upstream = await fetch(target, {
    headers: { accept: "application/json" },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "public, max-age=30",
    },
  });
}
