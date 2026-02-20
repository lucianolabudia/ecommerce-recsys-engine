import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Link2,
  Package,
  Activity,
  Zap,
  Globe,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Sidebar() {
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/user-recommendations", icon: Users, label: t("userRecs") },
    { to: "/association-rules", icon: Link2, label: t("assocRules") },
    { to: "/products", icon: Package, label: t("catalog") },
    { to: "/model-performance", icon: Activity, label: t("performance") },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={20} color="#fff" />
        </div>
        <h1>RecSys Engine</h1>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `nav-item${isActive ? " active" : ""}`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Language Switcher */}
      <div style={{ padding: "16px", borderTop: "1px solid var(--border-color)", marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, color: "var(--text-muted)" }}>
          <Globe size={16} />
          <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Language / Idioma</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setLanguage("en")}
            className={`btn ${language === "en" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, padding: "6px", fontSize: "0.75rem" }}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("es")}
            className={`btn ${language === "es" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, padding: "6px", fontSize: "0.75rem" }}
          >
            ES
          </button>
        </div>
      </div>
    </aside>
  );
}
