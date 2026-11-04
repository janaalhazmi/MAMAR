import { Navigate as ExecutionRedirect } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterVerificationPage from "./pages/RegisterVerificationPage";
import WorkerVerificationPage from "./pages/WorkerVerificationPage";

import ContractorDashboard from "./pages/ContractorDashboard";
import ContractorGuide from "./pages/ContractorGuide";
import ProviderDashboard from "./pages/ProviderDashboard";
import PrepareQuotation from "./pages/PrepareQuotation";
import ProjectLocationPage from "./pages/ProjectLocationPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import ServicesPage from "./pages/ServicesPage";
import ReviewPage from "./pages/ReviewPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import ProviderProjects from "./pages/ProviderProjects";
import ProviderExecutionDetails from "./pages/ProviderExecutionDetails";
import ProviderPage from "./pages/ProviderPage";
import QuotationsPage from "./pages/QuotationsPage";
import SelectProviderPage from "./pages/SelectProviderPage";
import ProjectMonitoringPage from "./pages/ProjectMonitoringPage";
import ReviewCompletionPage from "./pages/ReviewCompletionPage";
import FieldWorkerDashboard from "./pages/FieldWorkerDashboard";
import FieldExecution from "./pages/FieldExecution";
import DeviceVerification from "./pages/DeviceVerification";
import MyProjectsPage from "./pages/MyProjectsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/help" element={<HelpSupportPage />} />
      <Route path="/contractor-guide" element={<ContractorGuide />} />
      <Route path="/providers"
             element={
               <ProtectedRoute roles={["contractor"]}>
                 <ProviderPage />
               </ProtectedRoute>}/>
      <Route path="/quotations" element={<ProtectedRoute roles={["contractor"]}><QuotationsPage /></ProtectedRoute>} />
      <Route path="/quotations/select" element={<ProtectedRoute roles={["contractor"]}><SelectProviderPage /></ProtectedRoute>} />
      <Route path="/project-monitoring" element={<ProtectedRoute roles={["contractor"]}><ProjectMonitoringPage /></ProtectedRoute>} />
      <Route path="/review-completion" element={<ProtectedRoute roles={["contractor"]}><ReviewCompletionPage /></ProtectedRoute>} />
      <Route path="*" element={<div>Page not found</div>} />  
      <Route path="/field-worker-dashboard" element={<ProtectedRoute roles={["worker"]}><FieldWorkerDashboard /></ProtectedRoute>} />
      <Route path="/field-execution" element={<ProtectedRoute roles={["worker"]}><FieldExecution /></ProtectedRoute>} />
      <Route path="/device-verification" element={<ProtectedRoute roles={["worker"]}><DeviceVerification /></ProtectedRoute>} />
      <Route path="/my-projects" element={<ProtectedRoute roles={["contractor"]}><MyProjectsPage /></ProtectedRoute>} />

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

      <Route
        path="/provider/projects"
        element={
          <ProtectedRoute roles={["provider"]}>
            <ProviderProjects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/execution"
        element={
          <ProtectedRoute roles={["provider"]}>
            <ExecutionRedirect to="/provider/projects" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/projects/:projectId"
        element={
          <ProtectedRoute roles={["provider"]}>
            <ProviderExecutionDetails />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
