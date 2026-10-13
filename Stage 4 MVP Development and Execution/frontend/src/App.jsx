import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ContractorDashboard from "./pages/ContractorDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProjectLocationPage from "./pages/ProjectLocationPage";
import CreateProjectPage from "./pages/CreateProjectPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/contractor-dashboard"
        element={<ContractorDashboard />}
      />

      <Route
        path="/provider-dashboard"
        element={<ProviderDashboard />}
      />

      <Route
        path="/project/location"
        element={<ProjectLocationPage />}
      />
      <Route
       path="/create-project"
       element={<CreateProjectPage />}
      />
    <Route
       path="/project-location"
       element={<ProjectLocationPage />}
    />
  </Routes>
  );
}

export default App;
