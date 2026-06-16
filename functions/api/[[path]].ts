const FACILITATOR_BASES = {
  production: "https://ipay.sh",
  preview: "https://preview.ipay.sh",
} as const;

export async function onRequest(context: {
  request: Request;
}): Promise<Response> {
  const url = new URL(context.request.url);
  const network = context.request.headers.get("X-Registry-Network");
  const base =
    network === "preview" ? FACILITATOR_BASES.preview : FACILITATOR_BASES.production;
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
