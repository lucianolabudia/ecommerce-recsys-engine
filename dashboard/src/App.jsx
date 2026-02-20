import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import Sidebar from "./components/Sidebar";
import OverviewPage from "./pages/OverviewPage";
import UserRecommendationsPage from "./pages/UserRecommendationsPage";
import AssociationRulesPage from "./pages/AssociationRulesPage";
import ProductCatalogPage from "./pages/ProductCatalogPage";
import ModelPerformancePage from "./pages/ModelPerformancePage";

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/user-recommendations" element={<UserRecommendationsPage />} />
              <Route path="/association-rules" element={<AssociationRulesPage />} />
              <Route path="/products" element={<ProductCatalogPage />} />
              <Route path="/model-performance" element={<ModelPerformancePage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </LanguageProvider>
  );
}
