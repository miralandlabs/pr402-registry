import { DOCS_ORIGIN, facilitatorOrigin } from "../api/client";
import { useApp } from "../context/AppContext";

export function Footer() {
  const { network, t } = useApp();
  const base = facilitatorOrigin(network);

  return (
    <footer className="footer">
      <p>{t("footerNotice")}</p>
      <div className="footer-links">
        <a href={`${DOCS_ORIGIN}/discovery.html`} target="_blank" rel="noopener noreferrer">
          {t("footerDocs")}
        </a>
        <a href={`${base}/openapi.json`} target="_blank" rel="noopener noreferrer">
          {t("footerOpenapi")}
        </a>
        <a href={base} target="_blank" rel="noopener noreferrer">
          {t("footerFacilitator")}
        </a>
      </div>
    </footer>
  );
}
