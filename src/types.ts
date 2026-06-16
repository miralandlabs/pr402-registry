export type NetworkMode = "production" | "preview";
export type ThemeMode = "dark" | "light";
export type Locale = "en" | "zh";
export type TabId = "resources" | "providers" | "oracles";

export interface DirectoryStats {
  network: string;
  providers: { total: number };
  resources: { total: number; byScheme: Record<string, number> };
  asOf: string;
}

export interface PublicResourceEntry {
  id: number;
  walletPubkey: string;
  resourceUrl: string;
  httpMethod: string;
  title: string;
  description?: string;
  useCase?: string;
  category?: string;
  tags: string[];
  scheme: "exact" | "sla-escrow";
  network?: string;
  intentContractUrl?: string;
  merchantOrigin?: string;
  sellerResourceId?: string;
  lastProbeAt?: string;
  registrationVerifiedAt: string;
  updatedAt: string;
}

export interface PublicResourcesPage {
  entries: PublicResourceEntry[];
  nextCursor?: string;
  notice: string;
}

export interface PublicResourceSingle {
  entry: PublicResourceEntry;
  notice: string;
}

export interface PublicProviderEntry {
  walletPubkey: string;
  settlementMode: "native_sol" | "spl";
  splMint?: string;
  splitVaultPda?: string;
  serviceUrl: string;
  displayName?: string;
  description?: string;
  tags: string[];
  serviceMetadata?: Record<string, unknown>;
  registrationVerifiedAt: string;
  updatedAt: string;
}

export interface PublicProvidersPage {
  entries: PublicProviderEntry[];
  nextCursor?: string;
  notice: string;
}

export interface PublicProviderSingle {
  entry: PublicProviderEntry;
  notice: string;
}

export interface ResourceFilters {
  q: string;
  category: string;
  scheme: string;
  tag: string;
}
