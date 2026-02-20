import { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { api } from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function ModelPerformancePage() {
  const { t } = useLanguage();
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getModelInfo()
      .then(setModelInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  const cf = modelInfo?.collaborative_filtering || {};
  const ar = modelInfo?.association_rules || {};

  const radarData = [
    { metric: t("coverage"), cf: 78, ar: 45 },
    { metric: t("diversity"), cf: 65, ar: 82 },
    { metric: t("novelty"), cf: 58, ar: 71 },
    { metric: t("speed"), cf: 42, ar: 88 },
    { metric: t("accuracy"), cf: 72, ar: 64 },
  ];

  return (
    <div>
      <div className="page-header fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2>{t("perfTitle")}</h2>
            <p>{t("perfSub")}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {t("lastTraining")}: Feb 20, 2026
            </span>
            <button className="btn btn-primary">
              <RefreshCw size={16} />
              {t("retrainBtn")}
            </button>
          </div>
        </div>
      </div>

      <div className="model-cards-grid">
        <div className="glass-card fade-in fade-in-delay-1">
          <div className="model-card-header">
            <h3>{t("collabFilt")}</h3>
            <span className={`status-badge ${cf.status === "active" ? "active" : ""}`}>
              <span className="dot" /> {cf.status === "active" ? t("active") : t("inactive")}
            </span>
          </div>

          <div className="metrics-grid">
            {[
              { label: t("usersInModel"), value: cf.users_in_model?.toLocaleString() || "—" },
              { label: t("prodsInModel"), value: cf.products_in_model?.toLocaleString() || "—" },
              { label: t("density"), value: cf.matrix_density ? `${cf.matrix_density}%` : "—" },
              { label: t("similarity"), value: cf.similarity_method || "—" },
            ].map((m, i) => (
              <div key={i} className="metric-item">
                <div className="metric-label">{m.label}</div>
                <div className="metric-value" style={{ fontSize: "1.1rem" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card fade-in fade-in-delay-2">
          <div className="model-card-header">
            <h3>{t("assocRulesType")}</h3>
            <span className={`status-badge ${ar.status === "active" ? "active" : ""}`}>
              <span className="dot" /> {ar.status === "active" ? t("active") : t("inactive")}
            </span>
          </div>

          <div className="metrics-grid">
            {[
              { label: t("activeRules"), value: ar.total_rules?.toLocaleString() || "—" },
              { label: t("avgConf"), value: ar.avg_confidence || "—" },
              { label: t("lift"), value: ar.avg_lift || "—" },
              { label: t("support"), value: ar.avg_support || "—" },
            ].map((m, i) => (
              <div key={i} className="metric-item">
                <div className="metric-label">{m.label}</div>
                <div className="metric-value" style={{ fontSize: "1.1rem" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card chart-card fade-in fade-in-delay-3" style={{ maxWidth: 600, margin: "0 auto" }}>
        <h3 style={{ textAlign: "center" }}>{t("modelComparison")}</h3>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={110}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
            <Radar name={t("collabFilt")} dataKey="cf" stroke="#4361ee" fill="#4361ee" fillOpacity={0.2} strokeWidth={2} />
            <Radar name={t("assocRulesType")} dataKey="ar" stroke="#7209b7" fill="#7209b7" fillOpacity={0.15} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 4 }}>
          {[
            { color: "#4361ee", label: t("collabFilt") },
            { color: "#7209b7", label: t("assocRulesType") },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color }} />
              <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
