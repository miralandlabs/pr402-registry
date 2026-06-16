import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { ResourceTab } from "./components/ResourceTab";
import { ProviderTab } from "./components/ProviderTab";
import { OraclesTab } from "./components/OraclesTab";
import { Footer } from "./components/Footer";

function RegistryShell() {
  const { tab, t } = useApp();

  return (
    <div className="shell">
      <Header />
      {tab === "resources" && <ResourceTab />}
      {tab === "providers" && <ProviderTab />}
      {tab === "oracles" && <OraclesTab />}
      <p className="agent-note">{t("agentNote")}</p>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <RegistryShell />
    </AppProvider>
  );
}
