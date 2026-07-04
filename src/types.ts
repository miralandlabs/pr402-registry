export type NetworkMode = "production" | "preview";
export type ThemeMode = "dark" | "light";
export type Locale = "en" | "zh";
export type TabId = "resources" | "subscriptions" | "providers" | "oracles";

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

export interface SubscriptionDisplay {
  name?: string;
  tagline?: string;
  description?: string;
  icon_url?: string;
  category?: string;
  tags?: string[];
}

export interface SubscriptionPricingSummary {
  configured: boolean;
  starting_at_usdc?: number | null;
  has_free_tier: boolean;
  billing_models: string[];
}

export interface SubscriptionListEntry {
  service_id: string;
  display?: SubscriptionDisplay | null;
  pricing_summary: SubscriptionPricingSummary;
  catalog_configured: boolean;
}

export interface SubscriptionsPage {
  subscriptions: SubscriptionListEntry[];
  pagination: {
    next_cursor?: string;
    has_more: boolean;
    total: number;
  };
  notice: string;
}

export interface SubscriptionDetail {
  service_id: string;
  merchant_wallet: string;
  service_url: string;
  status: string;
  display?: SubscriptionDisplay | null;
  tiers?: unknown[];
  compliance?: unknown;
  sla?: unknown;
  pricing_summary: SubscriptionPricingSummary;
  resources_allowlist: string[];
  catalog_configured: boolean;
  created_at: string;
  updated_at: string;
  notice: string;
}

export interface SubscriptionFilters {
  q: string;
  category: string;
  tag: string;
}
