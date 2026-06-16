import type {
  DirectoryStats,
  NetworkMode,
  PublicProviderSingle,
  PublicProvidersPage,
  PublicResourceSingle,
  PublicResourcesPage,
} from "../types";

export const DOCS_ORIGIN = "https://docs.ipay.sh";

const FACILITATOR_ORIGINS: Record<NetworkMode, string> = {
  production: "https://ipay.sh",
  preview: "https://preview.ipay.sh",
};

export function facilitatorOrigin(network: NetworkMode): string {
  return FACILITATOR_ORIGINS[network];
}

async function apiFetch<T>(path: string, network: NetworkMode): Promise<T> {
  const res = await fetch(path, {
    headers: {
      accept: "application/json",
      "X-Registry-Network": network,
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export function fetchDirectoryStats(network: NetworkMode): Promise<DirectoryStats> {
  return apiFetch("/api/v1/facilitator/directory/stats", network);
}

export function fetchResources(
  network: NetworkMode,
  params: Record<string, string | number | undefined>,
): Promise<PublicResourcesPage> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const q = qs.toString();
  return apiFetch(`/api/v1/facilitator/resources${q ? `?${q}` : ""}`, network);
}

export function fetchResourceById(
  network: NetworkMode,
  id: number,
): Promise<PublicResourceSingle> {
  return apiFetch(`/api/v1/facilitator/resources/${id}`, network);
}

export function fetchProviders(
  network: NetworkMode,
  params: Record<string, string | number | undefined>,
): Promise<PublicProvidersPage> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const q = qs.toString();
  return apiFetch(`/api/v1/facilitator/providers${q ? `?${q}` : ""}`, network);
}

export function fetchProviderByWallet(
  network: NetworkMode,
  wallet: string,
): Promise<PublicProviderSingle> {
  return apiFetch(`/api/v1/facilitator/providers/${encodeURIComponent(wallet)}`, network);
}

export function railsUrl(network: NetworkMode, resourceUrl: string): string {
  return `${facilitatorOrigin(network)}/resources?url=${encodeURIComponent(resourceUrl)}`;
}

export function truncateWallet(wallet: string, chars = 4): string {
  if (wallet.length <= chars * 2 + 3) return wallet;
  return `${wallet.slice(0, chars)}…${wallet.slice(-chars)}`;
}

export function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
