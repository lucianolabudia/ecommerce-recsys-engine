import { useState, useEffect, useRef } from "react";
import { Search, Star, X } from "lucide-react";
import { api } from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function UserRecommendationsPage() {
  const { t, language } = useLanguage();
  const [userId, setUserId] = useState("");
  const [topN, setTopN] = useState(5);
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced user search
  function handleUserIdChange(value) {
    setUserId(value);

    if (searchTimeout) clearTimeout(searchTimeout);

    if (value.trim().length >= 1) {
      const timeout = setTimeout(async () => {
        try {
          const results = await api.searchUsers(value.trim(), 8);
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

  function selectUser(id) {
    setUserId(String(id));
    setShowSuggestions(false);
    setSuggestions([]);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!userId.trim()) return;

    setLoading(true);
    setError("");
    setUserProfile(null);
    setRecommendations([]);
    setShowSuggestions(false);

    try {
      const [profile, recs] = await Promise.all([
        api.getUserProfile(parseInt(userId)),
        api.getUserRecommendations(parseInt(userId), topN),
      ]);
      setUserProfile(profile);
      setRecommendations(recs);
    } catch (err) {
      setError(err.message.includes("404") ? t("userNotFound") : err.message);
    } finally {
      setLoading(false);
    }
  }

  // Reload data when language changes
  useEffect(() => {
    if (userProfile && userId) {
      Promise.all([
        api.getUserProfile(parseInt(userId)),
        api.getUserRecommendations(parseInt(userId), topN),
      ]).then(([profile, recs]) => {
        setUserProfile(profile);
        setRecommendations(recs);
      }).catch(console.error);
    }
  }, [language]);

  function clearSearch() {
    setUserId("");
    setUserProfile(null);
    setRecommendations([]);
    setError("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  return (
    <div>
      <div className="page-header fade-in">
        <h2>{t("userRecsTitle")}</h2>
        <p>{t("userRecsSub")}</p>
      </div>

      <form onSubmit={handleSearch} className="search-bar fade-in fade-in-delay-1">
        <div ref={wrapperRef} style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", zIndex: 1 }} />
          <input
            className="input-field"
            style={{ paddingLeft: 42, paddingRight: userId ? 36 : 14 }}
            placeholder={t("searchUserPlaceholder")}
            value={userId}
            onChange={(e) => handleUserIdChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            type="text"
            autoComplete="off"
          />
          {userId && (
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
              {suggestions.map((s) => (
                <div
                  key={s.user_id}
                  className="autocomplete-item"
                  onClick={() => selectUser(s.user_id)}
                >
                  <div className="autocomplete-avatar">
                    {String(s.user_id).slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>User #{s.user_id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <select
          className="input-field"
          style={{ width: 140 }}
          value={topN}
          onChange={(e) => setTopN(parseInt(e.target.value))}
        >
          <option value={5}>{t("topN")} 5</option>
          <option value={10}>{t("topN")} 10</option>
          <option value={15}>{t("topN")} 15</option>
          <option value={20}>{t("topN")} 20</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={loading || !userId.trim()}>
          {loading ? t("searching") : t("getRecsBtn")}
        </button>
      </form>

      {error && (
        <div className="glass-card fade-in" style={{ borderColor: "rgba(239,71,111,0.4)", marginBottom: 20 }}>
          <p style={{ color: "var(--accent-red)" }}>{error}</p>
        </div>
      )}

      {userProfile && (
        <div className="glass-card fade-in" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem", fontWeight: 700, flexShrink: 0,
            }}>
              {String(userProfile.user_id).slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{t("userProfile")} #{userProfile.user_id}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{t("customerProfile")}</p>
            </div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[
                { label: t("totalPurchases"), value: userProfile.total_purchases?.toLocaleString() },
                { label: t("uniqueProducts"), value: userProfile.unique_products },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent-cyan)" }}>{stat.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 16, fontSize: "1.1rem", fontWeight: 600 }} className="fade-in">
            {t("recommendedProds")}
          </h3>
          <div className="rec-grid">
            {recommendations.map((rec, i) => (
              <div key={i} className={`glass-card rec-card fade-in fade-in-delay-${Math.min(i + 1, 4)}`}>
                <div className="rank-badge">#{rec.rank}</div>
                <div className="product-name">{rec.product_name}</div>
                <div className="score-label">{t("recScore")}</div>
                <div className="confidence-bar-wrapper">
                  <div className="confidence-bar">
                    <div
                      className={`confidence-bar-fill ${rec.score > 3 ? "high" : rec.score > 1 ? "medium" : "low"}`}
                      style={{ width: `${Math.min((rec.score / 5) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="confidence-value">{rec.score}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <span className="tag tag-blue">
                    <Star size={12} style={{ marginRight: 4 }} />
                    {t("similarBought")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {userProfile?.products?.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ marginBottom: 16, fontSize: "1.1rem", fontWeight: 600 }} className="fade-in">
            {t("purchaseHistory")}
          </h3>
          <div className="glass-card fade-in">
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("stockCode")}</th>
                    <th>{t("productName")}</th>
                    <th>{t("quantity")}</th>
                  </tr>
                </thead>
                <tbody>
                  {userProfile.products.map((p, i) => (
                    <tr key={i}>
                      <td><span className="tag tag-purple">{p.stock_code}</span></td>
                      <td>{p.product_name}</td>
                      <td style={{ fontWeight: 600 }}>{p.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
