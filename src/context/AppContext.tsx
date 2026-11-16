import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale, NetworkMode, TabId, ThemeMode } from "../types";
import { t as translate, type MessageKey } from "../i18n";

const THEME_KEY = "pr402-registry-theme";
const LOCALE_KEY = "pr402-registry-locale";
const NETWORK_KEY = "pr402-registry-network";
const TAB_KEY = "pr402-registry-tab";

interface AppContextValue {
  theme: ThemeMode;
  locale: Locale;
  network: NetworkMode;
  tab: TabId;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setLocale: (locale: Locale) => void;
  setNetwork: (network: NetworkMode) => void;
  setTab: (tab: TabId) => void;
  t: (key: MessageKey) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

function readStorage<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v && (allowed as readonly string[]).includes(v)) return v as T;
  } catch {
    /* blocked storage */
  }
  return fallback;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    readStorage(THEME_KEY, ["dark", "light"] as const, "dark"),
  );
  const [locale, setLocaleState] = useState<Locale>(() =>
    readStorage(LOCALE_KEY, ["en", "zh"] as const, "en"),
  );
  const [network, setNetworkState] = useState<NetworkMode>(() =>
    readStorage(NETWORK_KEY, ["production", "preview"] as const, "production"),
  );
  const [tab, setTabState] = useState<TabId>(() =>
    readStorage(TAB_KEY, ["resources", "providers", "oracles"] as const, "resources"),
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => setThemeState(mode);
  const toggleTheme = () => setThemeState((m) => (m === "dark" ? "light" : "dark"));

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const setNetwork = (n: NetworkMode) => {
    setNetworkState(n);
    try {
      localStorage.setItem(NETWORK_KEY, n);
    } catch {
      /* ignore */
    }
  };

  const setTab = (t: TabId) => {
    setTabState(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* ignore */
    }
  };

  const t = useMemo(() => (key: MessageKey) => translate(locale, key), [locale]);

  const value: AppContextValue = {
    theme,
    locale,
    network,
    tab,
    setTheme,
    toggleTheme,
    setLocale,
    setNetwork,
    setTab,
    t,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
