import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { fetchDirectoryStats, fetchSubscriptionsTotal } from "../api/client";
import type { DirectoryStats, Locale, NetworkMode } from "../types";
import { useApp } from "../context/AppContext";

export function Header() {
  const { theme, locale, network, tab, toggleTheme, setLocale, setNetwork, setTab, t } =
    useApp();
  const [stats, setStats] = useState<DirectoryStats | null>(null);
  const [subscriptionTotal, setSubscriptionTotal] = useState<number | null>(null);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setSubscriptionTotal(null);
    setStatsError(false);
    fetchDirectoryStats(network)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStatsError(true);
      });
    fetchSubscriptionsTotal(network)
      .then((total) => {
        if (!cancelled) setSubscriptionTotal(total);
      })
      .catch(() => {
        /* optional stat — ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [network]);

  const tabs = [
    { id: "resources" as const, label: t("tabResources") },
    { id: "subscriptions" as const, label: t("tabSubscriptions") },
    { id: "providers" as const, label: t("tabProviders") },
    { id: "oracles" as const, label: t("tabOracles") },
  ];

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <div className="topbar-actions">
          <select
            className="control-select"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            aria-label={t("labelLanguage")}
          >
            <option value="en">EN — English</option>
            <option value="zh">ZH — 中文</option>
          </select>
          <select
            className="control-select control-select-env"
            value={network}
            onChange={(e) => setNetwork(e.target.value as NetworkMode)}
            aria-label={t("labelEnvironment")}
          >
            <option value="production">{t("networkProduction")}</option>
            <option value="preview">{t("networkPreview")}</option>
          </select>
          <button
            type="button"
            className="btn btn-ghost btn-sm theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t("themeSwitchToLight") : t("themeSwitchToDark")}
            title={theme === "dark" ? t("themeSwitchToLight") : t("themeSwitchToDark")}
          >
            {theme === "dark" ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </button>
        </div>
      </header>

      <div className="stats-strip">
        {!stats && !statsError && (
          <>
            <div className="stat-card stat-skeleton">
              <strong>—</strong>
              <span>{t("statSellers")}</span>
            </div>
            <div className="stat-card stat-skeleton">
              <strong>—</strong>
              <span>{t("statResources")}</span>
            </div>
          </>
        )}
        {stats && (
          <>
            <div className="stat-card">
              <strong>{stats.providers.total}</strong>
              <span>{t("statSellers")}</span>
            </div>
            <div className="stat-card">
              <strong>{stats.resources.total}</strong>
              <span>{t("statResources")}</span>
            </div>
            {(stats.resources.byScheme.exact ?? 0) > 0 && (
              <div className="stat-card">
                <strong>{stats.resources.byScheme.exact ?? 0}</strong>
                <span>{t("statExact")}</span>
              </div>
            )}
            {(stats.resources.byScheme["sla-escrow"] ?? 0) > 0 && (
              <div className="stat-card">
                <strong>{stats.resources.byScheme["sla-escrow"] ?? 0}</strong>
                <span>{t("statEscrow")}</span>
              </div>
            )}
            {subscriptionTotal != null && (
              <div className="stat-card">
                <strong>{subscriptionTotal}</strong>
                <span>{t("statSubscriptions")}</span>
              </div>
            )}
            <div className="stat-meta">
              {t("statAsOf")} {new Date(stats.asOf).toLocaleString()}
            </div>
          </>
        )}
      </div>

      <nav className="tabs" aria-label="Directory sections">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`tab-btn ${tab === id ? "is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
