import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Search, ChevronLeft, ChevronRight, Package, ShoppingCart, Zap, X } from "lucide-react";
import { api } from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function ProductCatalogPage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [topProducts, setTopProducts] = useState([]);
  const [stats, setStats] = useState(null);

  // Autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const wrapperRef = useRef(null);

  const pageSize = 15;

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, activeSearch, language]);

  useEffect(() => {
    api.getTopProducts(15).then(setTopProducts).catch(console.error);
    api.getStats().then(setStats).catch(console.error);
  }, [language]);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await api.getProducts(page, pageSize, activeSearch);
      setProducts(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  // Debounced product suggestions
  function handleSearchChange(value) {
    setSearch(value);

    if (searchTimeout) clearTimeout(searchTimeout);

    if (value.trim().length >= 2) {
      const timeout = setTimeout(async () => {
        try {
          const results = await api.searchProducts(value.trim(), 6);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch {
          setSuggestions([]);
        }
      }, 300);
      setSearchTimeout(timeout);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function selectSuggestion(item) {
    setSearch(item.product_name);
    setActiveSearch(item.product_name);
    setPage(1);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  function handleSearch(e) {
    e.preventDefault();
    setActiveSearch(search);
    setPage(1);
    setShowSuggestions(false);
  }

  function clearSearch() {
    setSearch("");
    setActiveSearch("");
    setPage(1);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  const totalPages = Math.ceil(total / pageSize);
  const columns = products.length > 0 ? Object.keys(products[0]) : [];

  return (
    <div>
      <div className="page-header fade-in">
        <h2>{t("catalogTitle")}</h2>
        <p>{t("catalogSub").replace("{count}", stats?.total_products?.toLocaleString() || "—")}</p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 700 }}>
        <div className="glass-card kpi-card fade-in fade-in-delay-1">
          <div className="kpi-icon"><Package size={20} /></div>
          <div className="kpi-label">{t("totalProducts")}</div>
          <div className="kpi-value">{stats?.total_products?.toLocaleString() || "—"}</div>
        </div>
        <div className="glass-card kpi-card fade-in fade-in-delay-2">
          <div className="kpi-icon"><ShoppingCart size={20} /></div>
          <div className="kpi-label">{t("totalInteractions")}</div>
          <div className="kpi-value">{stats?.total_transactions?.toLocaleString() || "—"}</div>
        </div>
        <div className="glass-card kpi-card fade-in fade-in-delay-3">
          <div className="kpi-icon"><Zap size={20} /></div>
          <div className="kpi-label">{t("activeRules")}</div>
          <div className="kpi-value">{stats?.total_rules || "—"}</div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="search-bar fade-in" style={{ gap: 8 }}>
        <div ref={wrapperRef} style={{ position: "relative", flex: 1, maxWidth: 360, zIndex: 10 }}>
          <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", zIndex: 1 }} />
          <input
            className="input-field"
            style={{ paddingLeft: 42, paddingRight: search ? 36 : 14 }}
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)",
                padding: 4, display: "flex", zIndex: 1,
              }}
            >
              <X size={16} />
            </button>
          )}

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {suggestions.map((item, i) => (
                <div
                  key={i}
                  className="autocomplete-item"
                  onClick={() => selectSuggestion(item)}
                >
                  <Package size={16} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.product_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Code: {item.stock_code}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary">{t("searchBtn")}</button>
      </form>

      {activeSearch && (
        <div className="fade-in" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {total} {t("totalProducts").toLowerCase()} found for:
          </span>
          <span className="tag tag-blue" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            "{activeSearch}"
            <X size={12} style={{ cursor: "pointer" }} onClick={clearSearch} />
          </span>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: 24 }}>
        {initialLoading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <>
            <div className="data-table-wrapper" style={{ maxHeight: 500, overflowY: "auto", opacity: loading ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col}>
                          {product[col] !== null && product[col] !== undefined
                            ? String(product[col]).length > 40
                              ? String(product[col]).slice(0, 40) + "…"
                              : String(product[col])
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                <ChevronLeft size={16} />
              </button>
              <span className="page-info">
                {t("page")} {page} {t("of")} {totalPages} ({total} items)
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="glass-card chart-card fade-in" style={{ minHeight: 440 }}>
        <h3>{t("topByQty")}</h3>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
            <defs>
              <linearGradient id="prodBarGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7209b7" />
                <stop offset="100%" stopColor="#4cc9f0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category" dataKey="product_name" width={220}
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v.length > 30 ? v.slice(0, 30) + "…" : v}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: "rgba(15,15,35,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem" }}>
                    <p style={{ color: "#fff", fontWeight: 600 }}>{payload[0]?.payload?.product_name}</p>
                    <p style={{ color: "#4cc9f0" }}>{t("quantity")}: {payload[0]?.value?.toLocaleString()}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="total_quantity" fill="url(#prodBarGrad)" radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
