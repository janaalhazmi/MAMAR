import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterVerificationPage from "./pages/RegisterVerificationPage";
import WorkerVerificationPage from "./pages/WorkerVerificationPage";

import ContractorDashboard from "./pages/ContractorDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import PrepareQuotation from "./pages/PrepareQuotation";
import ProjectLocationPage from "./pages/ProjectLocationPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import ServicesPage from "./pages/ServicesPage";
import ReviewPage from "./pages/ReviewPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/register/verify"
        element={<RegisterVerificationPage />}
      />

      <Route
        path="/register/worker-verification"
        element={<WorkerVerificationPage />}
      />

      <Route
        path="/contractor-dashboard"
        element={
          <ProtectedRoute roles={["contractor"]}>
            <ContractorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider-dashboard"
        element={
          <ProtectedRoute roles={["provider"]}>
            <ProviderDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/quotation"
        element={
          <ProtectedRoute roles={["provider"]}>
            <PrepareQuotation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/project/location"
        element={
          <ProtectedRoute roles={["contractor"]}>
            <ProjectLocationPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-project"
        element={
          <ProtectedRoute roles={["contractor"]}>
            <CreateProjectPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/project-location"
        element={
          <ProtectedRoute roles={["contractor"]}>
            <ProjectLocationPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/services"
        element={
          <ProtectedRoute roles={["contractor"]}>
            <ServicesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/select-service"
        element={
          <ProtectedRoute roles={["contractor"]}>
            <ServicesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/review"
        element={
          <ProtectedRoute roles={["contractor"]}>
            <ReviewPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;