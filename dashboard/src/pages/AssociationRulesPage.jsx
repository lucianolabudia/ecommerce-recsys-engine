import { useState, useEffect, useRef } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ZAxis,
} from "recharts";
import { ShoppingCart, X, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { api } from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function AssociationRulesPage() {
  const { t, language } = useLanguage();
  const [rules, setRules] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Cart simulator
  const [cartInput, setCartInput] = useState("");
  const [cartItems, setCartItems] = useState([]); // [{stock_code, product_name}]
  const [cartResults, setCartResults] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  // Autocomplete for cart
  const [cartSuggestions, setCartSuggestions] = useState([]);
  const [showCartSuggestions, setShowCartSuggestions] = useState(false);
  const [cartSearchTimeout, setCartSearchTimeout] = useState(null);
  const cartWrapperRef = useRef(null);

  // Rules search
  const [ruleSearch, setRuleSearch] = useState("");

  // Close cart suggestions
  useEffect(() => {
    function handleClick(e) {
      if (cartWrapperRef.current && !cartWrapperRef.current.contains(e.target)) {
        setShowCartSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    loadRules();
    api.getStats().then(setStats).catch(console.error);
  }, [page, language]);

  async function loadRules() {
    setLoading(true);
    try {
      const data = await api.getRules(page, 10);
      setRules(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  // Debounced product search for cart
  function handleCartInputChange(value) {
    setCartInput(value);

    if (cartSearchTimeout) clearTimeout(cartSearchTimeout);

    if (value.trim().length >= 2) {
      const timeout = setTimeout(async () => {
        try {
          const results = await api.searchProducts(value.trim(), 8);
          // Filter out already-in-cart items
          const filtered = results.filter(
            (r) => !cartItems.some((c) => c.stock_code === r.stock_code)
          );
          setCartSuggestions(filtered);
          setShowCartSuggestions(filtered.length > 0);
        } catch {
          setCartSuggestions([]);
        }
      }, 300);
      setCartSearchTimeout(timeout);
    } else {
      setCartSuggestions([]);
      setShowCartSuggestions(false);
    }
  }

  function addToCartFromSuggestion(item) {
    if (!cartItems.some((c) => c.stock_code === item.stock_code)) {
      setCartItems([...cartItems, item]);
    }
    setCartInput("");
    setCartSuggestions([]);
    setShowCartSuggestions(false);
    setCartResults([]);
  }

  function addToCartManual(e) {
    e.preventDefault();
    const name = cartInput.trim();
    if (name && !cartItems.some((c) => c.product_name.toLowerCase() === name.toLowerCase())) {
      setCartItems([...cartItems, { stock_code: name, product_name: name }]);
    }
    setCartInput("");
    setShowCartSuggestions(false);
    setCartResults([]);
  }

  function removeFromCart(stockCode) {
    setCartItems(cartItems.filter((i) => i.stock_code !== stockCode));
    setCartResults([]);
  }

  async function getCartSuggestions() {
    if (cartItems.length === 0) return;
    setCartLoading(true);
    try {
      // Send stock_codes to the API
      const codes = cartItems.map((c) => c.stock_code);
      const recs = await api.getAssociationRecommendations(codes, 5);
      setCartResults(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setCartLoading(false);
    }
  }

  const totalPages = Math.ceil(total / 10);
  const scatterData = rules.map((r) => ({
    confidence: r.confidence,
    lift: r.lift,
    support: r.support * 1000,
  }));

  // Filter rules by search
  const filteredRules = ruleSearch
    ? rules.filter((r) => {
        const q = ruleSearch.toLowerCase();
        return (
          r.antecedents.some((a) => a.toLowerCase().includes(q)) ||
          r.consequents.some((c) => c.toLowerCase().includes(q))
        );
      })
    : rules;

  return (
    <div>
      <div className="page-header fade-in">
        <h2>{t("assocTitle")}</h2>
        <p>{t("assocSub")}</p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: 500 }}>
        <div className="glass-card kpi-card fade-in fade-in-delay-1">
          <div className="kpi-label">{t("activeRules")}</div>
          <div className="kpi-value">{stats?.total_rules?.toLocaleString() || "—"}</div>
        </div>
        <div className="glass-card kpi-card fade-in fade-in-delay-2">
          <div className="kpi-label">{t("avgConf")}</div>
          <div className="kpi-value">{stats?.avg_confidence || "—"}</div>
        </div>
      </div>

      {/* Cart Simulator */}
      <div className="glass-card cart-simulator fade-in fade-in-delay-3" style={{ position: "relative", zIndex: 10 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <ShoppingCart size={20} />
          {t("cartTitle")}
        </h3>

        <form onSubmit={addToCartManual} style={{ display: "flex", gap: 10 }}>
          <div ref={cartWrapperRef} style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", zIndex: 1 }} />
            <input
              className="input-field"
              style={{ paddingLeft: 38 }}
              placeholder={t("cartPlaceholder")}
              value={cartInput}
              onChange={(e) => handleCartInputChange(e.target.value)}
              onFocus={() => cartSuggestions.length > 0 && setShowCartSuggestions(true)}
              autoComplete="off"
            />

            {/* Autocomplete dropdown */}
            {showCartSuggestions && cartSuggestions.length > 0 && (
              <div className="autocomplete-dropdown">
                {cartSuggestions.map((item, i) => (
                  <div
                    key={i}
                    className="autocomplete-item"
                    onClick={() => addToCartFromSuggestion(item)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.product_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Code: {item.stock_code}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-secondary">{t("addBtn")}</button>
        </form>

        {cartItems.length > 0 && (
          <div className="cart-tags">
            {cartItems.map((item, i) => (
              <div className="cart-tag" key={i}>
                <span title={`Code: ${item.stock_code}`}>{item.product_name}</span>
                <button onClick={() => removeFromCart(item.stock_code)} title="Remove"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {cartItems.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={getCartSuggestions}
            disabled={cartLoading}
            style={{ marginTop: 10 }}
          >
            {cartLoading ? t("searching") : t("getSuggestions")}
          </button>
        )}

        {cartResults.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 12, color: "var(--accent-cyan)" }}>
              {t("suggestedProds")}
            </h4>
            {cartResults.map((rec, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--gradient-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                }}>
                  {rec.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{rec.product_name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="confidence-bar-wrapper" style={{ width: 160 }}>
                    <div className="confidence-bar">
                      <div
                        className={`confidence-bar-fill ${rec.score > 0.7 ? "high" : rec.score > 0.4 ? "medium" : "low"}`}
                        style={{ width: `${rec.score * 100}%` }}
                      />
                    </div>
                    <span className="confidence-value">{(rec.score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rules table */}
      <div className="charts-grid" style={{ gridTemplateColumns: "2fr 1fr", marginTop: 20 }}>
        <div className="glass-card fade-in">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0 }}>{t("rulesTableTitle")}</h3>
            <div style={{ position: "relative", width: 220 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                className="input-field"
                style={{ paddingLeft: 32, padding: "6px 8px 6px 32px", fontSize: "0.8rem" }}
                placeholder={t("searchPlaceholder")}
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
              />
            </div>
          </div>
          {initialLoading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : (
            <>
              <div className="data-table-wrapper" style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{t("antecedent")}</th>
                      <th>{t("consequent")}</th>
                      <th>{t("support")}</th>
                      <th>{t("confidence")}</th>
                      <th>{t("lift")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule) => (
                      <tr key={rule.id}>
                        <td style={{ color: "var(--text-muted)" }}>#{rule.id}</td>
                        <td>
                          {rule.antecedents.map((a, i) => (
                            <span key={i} className="tag tag-blue">{a.length > 30 ? a.slice(0, 30) + "…" : a}</span>
                          ))}
                        </td>
                        <td>
                          {rule.consequents.map((c, i) => (
                            <span key={i} className="tag tag-purple">{c.length > 30 ? c.slice(0, 30) + "…" : c}</span>
                          ))}
                        </td>
                        <td>{rule.support}</td>
                        <td>
                          <div className="confidence-bar-wrapper">
                            <div className="confidence-bar" style={{ width: 60 }}>
                              <div
                                className={`confidence-bar-fill ${rule.confidence > 0.7 ? "high" : rule.confidence > 0.4 ? "medium" : "low"}`}
                                style={{ width: `${rule.confidence * 100}%` }}
                              />
                            </div>
                            <span className="confidence-value">{(rule.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: rule.lift > 3 ? "var(--accent-green)" : "var(--text-secondary)" }}>
                          {rule.lift}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                  <ChevronLeft size={16} />
                </button>
                <span className="page-info">{t("page")} {page} {t("of")} {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="glass-card chart-card fade-in">
          <h3>{t("confVsLift")}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="confidence" name={t("confidence")} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} />
              <YAxis dataKey="lift" name={t("lift")} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} />
              <ZAxis dataKey="support" range={[40, 200]} name={t("support")} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: "rgba(15,15,35,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem" }}>
                      <p style={{ color: "#fff" }}>{t("confidence")}: {payload[0]?.value}</p>
                      <p style={{ color: "#4cc9f0" }}>{t("lift")}: {payload[1]?.value}</p>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill="#4361ee" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
