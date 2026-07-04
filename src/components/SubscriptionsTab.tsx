import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  fetchSubscriptionById,
  fetchSubscriptions,
  formatDate,
  subscribeInfoUrl,
} from "../api/client";
import { useApp } from "../context/AppContext";
import { DetailDrawer } from "./DetailDrawer";
import type { SubscriptionDetail, SubscriptionListEntry, SubscriptionFilters } from "../types";

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function parseSubscriptionHash(): string | null {
  const m = window.location.hash.match(/^#subscription\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function entryTitle(entry: SubscriptionListEntry): string {
  return entry.display?.name ?? entry.service_id;
}

export function SubscriptionsTab() {
  const { network, locale, t } = useApp();
  const [filters, setFilters] = useState<SubscriptionFilters>({
    q: "",
    category: "",
    tag: "",
  });
  const debouncedQ = useDebounce(filters.q, 300);
  const [entries, setEntries] = useState<SubscriptionListEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<SubscriptionDetail | null>(null);

  const loadPage = useCallback(
    async (append: boolean, pageCursor?: string) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(false);
      try {
        const page = await fetchSubscriptions(network, {
          limit: 50,
          cursor: pageCursor,
          q: debouncedQ || undefined,
          category: filters.category || undefined,
          tags: filters.tag || undefined,
        });
        setEntries((prev) =>
          append ? [...prev, ...page.subscriptions] : page.subscriptions,
        );
        setNextCursor(page.pagination.next_cursor);
        setNotice(page.notice);
      } catch {
        setError(true);
        if (!append) setEntries([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [network, debouncedQ, filters.category, filters.tag],
  );

  useEffect(() => {
    void loadPage(false);
  }, [loadPage]);

  useEffect(() => {
    const openFromHash = async () => {
      const id = parseSubscriptionHash();
      if (!id) return;
      try {
        const res = await fetchSubscriptionById(network, id);
        setDetail(res);
      } catch {
        window.location.hash = "";
      }
    };
    void openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [network]);

  const openDetail = async (entry: SubscriptionListEntry) => {
    window.location.hash = `subscription/${encodeURIComponent(entry.service_id)}`;
    try {
      const res = await fetchSubscriptionById(network, entry.service_id);
      setDetail(res);
    } catch {
      setDetail(null);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    if (window.location.hash.startsWith("#subscription/")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    void loadPage(true, nextCursor);
  };

  return (
    <>
      <div className="filters">
        <input
          type="search"
          placeholder={t("subscriptionSearchPlaceholder")}
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <input
          type="text"
          placeholder={t("filterCategory")}
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
        />
        <input
          type="text"
          placeholder={t("filterTag")}
          value={filters.tag}
          onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
        />
      </div>

      {error && <div className="error-banner">{t("errorLoad")}</div>}
      {loading && <p className="notice">{t("loading")}</p>}
      {!loading && entries.length === 0 && !error && (
        <p className="notice">{t("noResults")}</p>
      )}

      <div className="entry-grid">
        {entries.map((entry) => (
          <button
            key={entry.service_id}
            type="button"
            className="entry-card"
            onClick={() => void openDetail(entry)}
          >
            <div>
              <span className="badge">subscription</span>
              {!entry.catalog_configured && (
                <span className="badge badge-muted">{t("subscriptionUnconfigured")}</span>
              )}
            </div>
            <h3>{entryTitle(entry)}</h3>
            {entry.display?.category && (
              <div className="entry-card-meta">{entry.display.category}</div>
            )}
            {entry.display?.tagline && (
              <div className="entry-card-meta">{entry.display.tagline}</div>
            )}
            <div className="entry-card-meta mono">{entry.service_id}</div>
            {entry.pricing_summary.configured && entry.pricing_summary.starting_at_usdc != null && (
              <div className="entry-card-meta">
                {t("subscriptionFrom")} ${entry.pricing_summary.starting_at_usdc}/mo
              </div>
            )}
            {entry.display?.tags && entry.display.tags.length > 0 && (
              <div className="tag-row">
                {entry.display.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {nextCursor && (
        <div className="load-more-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={loadingMore}
            onClick={loadMore}
          >
            {loadingMore ? t("loading") : t("loadMore")}
          </button>
        </div>
      )}

      {notice && !loading && <p className="notice">{notice}</p>}

      {detail && (
        <DetailDrawer title={detail.display?.name ?? detail.service_id} onClose={closeDetail}>
          <dl>
            <div className="sheet-row">
              <dt>{t("subscriptionServiceId")}</dt>
              <dd className="mono">{detail.service_id}</dd>
            </div>
            <div className="sheet-row">
              <dt>{t("serviceUrl")}</dt>
              <dd className="mono">{detail.service_url}</dd>
            </div>
            <div className="sheet-row">
              <dt>{t("sellerWallet")}</dt>
              <dd className="mono">{detail.merchant_wallet}</dd>
            </div>
            {detail.display?.category && (
              <div className="sheet-row">
                <dt>{t("category")}</dt>
                <dd>{detail.display.category}</dd>
              </div>
            )}
            {detail.display?.description && (
              <div className="sheet-row">
                <dt>{t("description")}</dt>
                <dd>{detail.display.description}</dd>
              </div>
            )}
            {detail.tiers && Array.isArray(detail.tiers) && detail.tiers.length > 0 && (
              <div className="sheet-row">
                <dt>{t("subscriptionTiers")}</dt>
                <dd>
                  <ul className="tier-list">
                    {(detail.tiers as Array<Record<string, unknown>>).map((tier) => (
                      <li key={String(tier.id ?? tier.name)}>
                        <strong>{String(tier.name ?? tier.id)}</strong>
                        {tier.price_usdc_per_month != null && (
                          <span> — ${String(tier.price_usdc_per_month)}/mo</span>
                        )}
                        {tier.rate_limit != null && (
                          <span className="entry-card-meta"> ({String(tier.rate_limit)})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            <div className="sheet-row">
              <dt>{t("verifiedAt")}</dt>
              <dd>{formatDate(detail.updated_at, locale)}</dd>
            </div>
          </dl>
          {detail.display?.tags && detail.display.tags.length > 0 && (
            <div className="tag-row" style={{ marginTop: "0.75rem" }}>
              {detail.display.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {detail.notice && <p className="notice">{detail.notice}</p>}
          <div className="sheet-actions">
            <a
              className="btn btn-primary"
              href={subscribeInfoUrl(detail.service_url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("subscriptionViewInfo")} <ExternalLink size={14} />
            </a>
            <a
              className="btn btn-ghost"
              href={detail.service_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("openResource")} <ExternalLink size={14} />
            </a>
            <button type="button" className="btn btn-ghost" onClick={closeDetail}>
              {t("close")}
            </button>
          </div>
        </DetailDrawer>
      )}
    </>
  );
}
