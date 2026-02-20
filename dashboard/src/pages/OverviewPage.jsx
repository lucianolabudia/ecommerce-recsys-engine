import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Users, Package, ShoppingCart, Zap } from "lucide-react";
import { api } from "../api";
import { useLanguage } from "../context/LanguageContext";

const PIE_COLORS = ["#4361ee", "#7209b7"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,15,35,0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem",
    }}>
      <p style={{ color: "#fff", fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function OverviewPage() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, tp, d] = await Promise.all([
          api.getStats(),
          api.getTopProducts(10),
          api.getRecommendationDistribution(),
        ]);
        setStats(s);
        setTopProducts(tp);
        setDistribution(d);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [language]);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  const pieData = distribution
    ? [
        { name: t("collabFilt"), value: distribution.collaborative_filtering },
        { name: t("assocRulesType"), value: distribution.association_rules },
      ]
    : [];

  const timeData = Array.from({ length: 30 }, (_, i) => ({
    day: `${t("day")} ${i + 1}`,
    recommendations: Math.floor(180 + Math.random() * 120 + Math.sin(i * 0.5) * 50),
  }));

  return (
    <div>
      <div className="page-header fade-in">
        <h2>{t("overviewTitle")}</h2>
        <p>{t("overviewSub")}</p>
      </div>

      <div className="kpi-grid">
        {[
          { icon: Users, label: t("totalUsers"), value: stats?.total_users?.toLocaleString() || "—" },
          { icon: Package, label: t("totalProducts"), value: stats?.total_products?.toLocaleString() || "—" },
          { icon: ShoppingCart, label: t("totalInteractions"), value: stats?.total_transactions?.toLocaleString() || "—" },
          { icon: Zap, label: t("activeRules"), value: stats?.total_rules?.toLocaleString() || "—" },
        ].map((kpi, i) => (
          <div key={i} className={`glass-card kpi-card fade-in fade-in-delay-${i + 1}`}>
            <div className="kpi-icon"><kpi.icon size={22} /></div>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="glass-card chart-card fade-in fade-in-delay-2">
          <h3>{t("servedTitle")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timeData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4361ee" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#7209b7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="recommendations" stroke="#4361ee" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card chart-card fade-in fade-in-delay-3">
          <h3>{t("distTitle")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100}
                paddingAngle={4} dataKey="value" stroke="none"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: -8 }}>
            {pieData.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[i] }} />
                <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card chart-card fade-in fade-in-delay-4" style={{ minHeight: 420 }}>
        <h3>{t("topRecsTitle")}</h3>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4361ee" />
                <stop offset="100%" stopColor="#4cc9f0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category" dataKey="product_name" width={200}
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(val) => val.length > 28 ? val.substring(0, 28) + "…" : val}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total_quantity" fill="url(#barGrad)" radius={[0, 4, 4, 0]} barSize={18} name={t("quantity")} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
