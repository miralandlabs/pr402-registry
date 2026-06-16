import { useApp } from "../context/AppContext";

export function OraclesTab() {
  const { t } = useApp();

  return (
    <div className="oracles-panel">
      <h2>{t("oraclesTitle")}</h2>
      <p>{t("oraclesBody")}</p>
      <a
        className="btn btn-primary"
        href="https://github.com/coinbase/x402"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("oraclesDocs")}
      </a>
    </div>
  );
}
