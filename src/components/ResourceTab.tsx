import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  fetchResourceById,
  fetchResources,
  formatDate,
  railsUrl,
  truncateWallet,
} from "../api/client";
import { useApp } from "../context/AppContext";
import { DetailDrawer } from "./DetailDrawer";
import type { PublicResourceEntry, ResourceFilters } from "../types";

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function parseResourceHash(): number | null {
  const m = window.location.hash.match(/^#resource\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

export function ResourceTab() {
  const { network, locale, t } = useApp();
  const [filters, setFilters] = useState<ResourceFilters>({
    q: "",
    category: "",
    scheme: "",
    tag: "",
  });
  const debouncedQ = useDebounce(filters.q, 300);
  const [entries, setEntries] = useState<PublicResourceEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<PublicResourceEntry | null>(null);
  const [detailNotice, setDetailNotice] = useState("");

  const loadPage = useCallback(
    async (append: boolean, pageCursor?: string) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(false);
      try {
        const page = await fetchResources(network, {
          limit: 50,
          cursor: pageCursor,
          q: debouncedQ || undefined,
          category: filters.category || undefined,
          scheme: filters.scheme || undefined,
          tag: filters.tag || undefined,
        });
        setEntries((prev) => (append ? [...prev, ...page.entries] : page.entries));
        setNextCursor(page.nextCursor);
        setNotice(page.notice);
      } catch {
        setError(true);
        if (!append) setEntries([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [network, debouncedQ, filters.category, filters.scheme, filters.tag],
  );

  useEffect(() => {
    void loadPage(false);
  }, [loadPage]);

  useEffect(() => {
    const openFromHash = async () => {
      const id = parseResourceHash();
      if (!id) return;
      try {
        const res = await fetchResourceById(network, id);
        setDetail(res.entry);
        setDetailNotice(res.notice);
      } catch {
        window.location.hash = "";
      }
    };
    void openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [network]);

  const openDetail = async (entry: PublicResourceEntry) => {
    window.location.hash = `resource/${entry.id}`;
    try {
      const res = await fetchResourceById(network, entry.id);
      setDetail(res.entry);
      setDetailNotice(res.notice);
    } catch {
      setDetail(entry);
      setDetailNotice("");
    }
  };

  const closeDetail = () => {
    setDetail(null);
    if (window.location.hash.startsWith("#resource/")) {
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
          placeholder={t("searchPlaceholder")}
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <input
          type="text"
          placeholder={t("filterCategory")}
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
        />
        <select
          value={filters.scheme}
          onChange={(e) => setFilters((f) => ({ ...f, scheme: e.target.value }))}
        >
          <option value="">{t("filterAll")}</option>
          <option value="exact">{t("schemeExact")}</option>
          <option value="sla-escrow">{t("schemeEscrow")}</option>
        </select>
        <input
          type="text"
          placeholder={t("filterTag")}
          value={filters.tag}
          onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
        />
      </div>

      {error && <div className="error-banner">{t("errorLoad")}</div>}
      {loading && <p className="notice">{t("loading")}</p>}
      {!loading && entries.length === 0 && !error && <p className="notice">{t("noResults")}</p>}

      <div className="entry-grid">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="entry-card"
            onClick={() => void openDetail(entry)}
          >
            <div>
              <span className="badge">{entry.scheme}</span>
            </div>
            <h3>{entry.title}</h3>
            {entry.category && (
              <div className="entry-card-meta">{entry.category}</div>
            )}
            <div className="entry-card-meta mono">{entry.resourceUrl}</div>
            <div className="entry-card-meta">
              {t("sellerWallet")}: {truncateWallet(entry.walletPubkey)}
            </div>
            {entry.tags.length > 0 && (
              <div className="tag-row">
                {entry.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="card-actions">
              <a
                className="btn btn-ghost btn-sm"
                href={railsUrl(network, entry.resourceUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {t("viewRails")}
              </a>
            </div>
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
        <DetailDrawer title={detail.title} onClose={closeDetail}>
          <dl>
            <div className="sheet-row">
              <dt>{t("scheme")}</dt>
              <dd>
                <span className="badge">{detail.scheme}</span>
              </dd>
            </div>
            <div className="sheet-row">
              <dt>{t("resourceUrl")}</dt>
              <dd className="mono">{detail.resourceUrl}</dd>
            </div>
            <div className="sheet-row">
              <dt>{t("method")}</dt>
              <dd>{detail.httpMethod}</dd>
            </div>
            <div className="sheet-row">
              <dt>{t("sellerWallet")}</dt>
              <dd className="mono">{detail.walletPubkey}</dd>
            </div>
            {detail.category && (
              <div className="sheet-row">
                <dt>{t("category")}</dt>
                <dd>{detail.category}</dd>
              </div>
            )}
            {detail.description && (
              <div className="sheet-row">
                <dt>{t("description")}</dt>
                <dd>{detail.description}</dd>
              </div>
            )}
            {detail.useCase && (
              <div className="sheet-row">
                <dt>{t("useCase")}</dt>
                <dd>{detail.useCase}</dd>
              </div>
            )}
            <div className="sheet-row">
              <dt>{t("probedAt")}</dt>
              <dd>{formatDate(detail.lastProbeAt, locale)}</dd>
            </div>
            <div className="sheet-row">
              <dt>{t("verifiedAt")}</dt>
              <dd>{formatDate(detail.registrationVerifiedAt, locale)}</dd>
            </div>
          </dl>
          {detail.tags.length > 0 && (
            <div className="tag-row" style={{ marginTop: "0.75rem" }}>
              {detail.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {detailNotice && <p className="notice">{detailNotice}</p>}
          <div className="sheet-actions">
            <a
              className="btn btn-primary"
              href={railsUrl(network, detail.resourceUrl)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("viewRails")} <ExternalLink size={14} />
            </a>
            <a
              className="btn btn-ghost"
              href={detail.resourceUrl}
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
