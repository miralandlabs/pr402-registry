import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  fetchProviderByWallet,
  fetchProviders,
  formatDate,
  truncateWallet,
} from "../api/client";
import { useApp } from "../context/AppContext";
import { DetailDrawer } from "./DetailDrawer";
import type { PublicProviderEntry } from "../types";

function parseProviderHash(): string | null {
  const m = window.location.hash.match(/^#provider\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function ProviderTab() {
  const { network, locale, t } = useApp();
  const [entries, setEntries] = useState<PublicProviderEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState<PublicProviderEntry | null>(null);
  const [detailNotice, setDetailNotice] = useState("");

  const loadPage = useCallback(
    async (append: boolean, pageCursor?: string) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(false);
      try {
        const page = await fetchProviders(network, { limit: 50, cursor: pageCursor });
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
    [network],
  );

  useEffect(() => {
    void loadPage(false);
  }, [loadPage]);

  useEffect(() => {
    const openFromHash = async () => {
      const wallet = parseProviderHash();
      if (!wallet) return;
      try {
        const res = await fetchProviderByWallet(network, wallet);
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

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const name = (e.displayName ?? "").toLowerCase();
      const tags = e.tags.join(" ").toLowerCase();
      const wallet = e.walletPubkey.toLowerCase();
      return name.includes(q) || tags.includes(q) || wallet.includes(q);
    });
  }, [entries, filter]);

  const openDetail = async (entry: PublicProviderEntry) => {
    window.location.hash = `provider/${encodeURIComponent(entry.walletPubkey)}`;
    try {
      const res = await fetchProviderByWallet(network, entry.walletPubkey);
      setDetail(res.entry);
      setDetailNotice(res.notice);
    } catch {
      setDetail(entry);
      setDetailNotice("");
    }
  };

  const closeDetail = () => {
    setDetail(null);
    if (window.location.hash.startsWith("#provider/")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  return (
    <>
      <div className="filters">
        <input
          type="search"
          placeholder={t("providerSearch")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {error && <div className="error-banner">{t("errorLoad")}</div>}
      {loading && <p className="notice">{t("loading")}</p>}
      {!loading && filtered.length === 0 && !error && <p className="notice">{t("noResults")}</p>}

      <div className="entry-grid">
        {filtered.map((entry) => (
          <button
            key={entry.walletPubkey}
            type="button"
            className="entry-card"
            onClick={() => void openDetail(entry)}
          >
            <h3>{entry.displayName ?? truncateWallet(entry.walletPubkey, 6)}</h3>
            <div className="entry-card-meta mono">{entry.walletPubkey}</div>
            <div className="entry-card-meta">{entry.serviceUrl}</div>
            <div className="entry-card-meta">
              {t("settlement")}: {entry.settlementMode}
            </div>
            {entry.tags.length > 0 && (
              <div className="tag-row">
                {entry.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {nextCursor && !filter && (
        <div className="load-more-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={loadingMore}
            onClick={() => void loadPage(true, nextCursor)}
          >
            {loadingMore ? t("loading") : t("loadMore")}
          </button>
        </div>
      )}

      {notice && !loading && <p className="notice">{notice}</p>}

      {detail && (
        <DetailDrawer
          title={detail.displayName ?? truncateWallet(detail.walletPubkey, 6)}
          onClose={closeDetail}
        >
          <dl>
            <div className="sheet-row">
              <dt>{t("sellerWallet")}</dt>
              <dd className="mono">{detail.walletPubkey}</dd>
            </div>
            <div className="sheet-row">
              <dt>{t("serviceUrl")}</dt>
              <dd className="mono">{detail.serviceUrl}</dd>
            </div>
            <div className="sheet-row">
              <dt>{t("settlement")}</dt>
              <dd>{detail.settlementMode}</dd>
            </div>
            {detail.description && (
              <div className="sheet-row">
                <dt>{t("description")}</dt>
                <dd>{detail.description}</dd>
              </div>
            )}
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
              href={detail.serviceUrl}
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
