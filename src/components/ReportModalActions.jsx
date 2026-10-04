import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, CalendarRange, X } from "lucide-react";
import ZoneRelatorio from "../pages/relatorios/ZoneRelatorio";
import SemanalRelatorio from "../pages/relatorios/SemanalRelatorio";

const REPORTS = {
  zone: { title: "Relatório Zone", component: ZoneRelatorio },
  semanal: { title: "Escala Semanal", component: SemanalRelatorio },
};

export default function ReportModalActions() {
  const [reportOpen, setReportOpen] = useState(null);
  const ReportComponent = reportOpen ? REPORTS[reportOpen].component : null;

  useEffect(() => {
    document.body.classList.toggle("report-print-mode", Boolean(reportOpen));
    return () => document.body.classList.remove("report-print-mode");
  }, [reportOpen]);

  return (
    <>
      <div className="report-header-actions">
        <button
          type="button"
          className="report-header-button"
          onClick={() => setReportOpen("zone")}
        >
          <CalendarDays size={17} aria-hidden="true" />
          Zone
        </button>
        <button
          type="button"
          className="report-header-button"
          onClick={() => setReportOpen("semanal")}
        >
          <CalendarRange size={17} aria-hidden="true" />
          Escala Semanal
        </button>
      </div>

      {reportOpen &&
        createPortal(
          <div
            className="report-modal-overlay"
            role="presentation"
            onClick={() => setReportOpen(null)}
          >
            <section
              className="report-modal-shell"
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="report-modal-header no-print">
                <h2 id="report-modal-title">{REPORTS[reportOpen].title}</h2>
                <button
                  type="button"
                  className="close-button"
                  onClick={() => setReportOpen(null)}
                  aria-label="Fechar relatório"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </header>
              <ReportComponent />
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
