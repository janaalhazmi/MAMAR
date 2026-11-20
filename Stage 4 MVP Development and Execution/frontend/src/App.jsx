import ProviderFieldTeam from "./pages/Providers/ProviderFieldTeam";
import ProviderDeviceVerification from "./pages/Providers/ProviderDeviceVerification";
import { useEffect as useExecutionEffect, useRef as useExecutionRef } from "react";
import { useNavigate as useExecutionNavigate } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/Admin/AdminPage";

import LandingPage from "./pages/Weblogin/LandingPage";
import LoginPage from "./pages/Weblogin/LoginPage";
import RegisterPage from "./pages/Weblogin/RegisterPage";
import RegisterVerificationPage from "./pages/Weblogin/RegisterVerificationPage";
import WorkerVerificationPage from "./pages/Weblogin/WorkerVerificationPage";

import ContractorDashboard from "./pages/Contractor/ContractorDashboard";
import ContractorGuide from "./pages/Weblogin/ContractorGuide";
import ProviderDashboard from "./pages/Providers/ProviderDashboard";
import PrepareQuotation from "./pages/Providers/PrepareQuotation";
import ProjectLocationPage from "./pages/Contractor/ProjectLocationPage";
import CreateProjectPage from "./pages/Contractor/CreateProjectPage";
import ServicesPage from "./pages/Contractor/ServicesPage";
import ReviewPage from "./pages/Contractor/ReviewPage";
import HelpSupportPage from "./pages/Weblogin/HelpSupportPage";
import ProviderProjects from "./pages/Providers/ProviderProjects";
import ProviderExecutionDetails from "./pages/Providers/ProviderExecutionDetails";
import ProviderPage from "./pages/Contractor/ProviderPage";
import QuotationsPage from "./pages/Contractor/QuotationsPage";
import SelectProviderPage from "./pages/Contractor/SelectProviderPage";
import ProjectMonitoringPage from "./pages/Contractor/ProjectMonitoringPage";
import ReviewCompletionPage from "./pages/Contractor/ReviewCompletionPage";
import FieldWorkerDashboard from "./pages/FieldWorker/FieldWorkerDashboard";
import FieldExecution from "./pages/FieldWorker/FieldExecution";
import DeviceVerification from "./pages/FieldWorker/DeviceVerification";
import AttendancePage from "./pages/FieldWorker/AttendancePage";
import MyProjectsPage from "./pages/Contractor/MyProjectsPage";
import NotificationsPage from "./pages/Contractor/NotificationsPage";
import PaymentPage from "./pages/Contractor/PaymentPage";
import DataDisclaimerPage from "./pages/Weblogin/DataDisclaimerPage";
import ProfilePage from "./pages/Contractor/ProfilePage";
import ProviderProfilePage from "./pages/Providers/ProviderProfilePage";
import FieldWorkerProfile from "./pages/FieldWorker/FieldWorkerProfile";


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
      <Route path="/attendance" element={<ProtectedRoute roles={["worker"]}><AttendancePage /></ProtectedRoute>} />
      <Route path="/my-projects" element={<ProtectedRoute roles={["contractor"]}><MyProjectsPage /></ProtectedRoute>} />
      <Route
      path="/field-worker/profile"
      element={
        <ProtectedRoute roles={["worker"]}>
        <FieldWorkerProfile />
        </ProtectedRoute>
      }
      />

      <Route path="/profile" element={<ProfilePage />} />
      <Route
        path="/provider/profile"
        element={
          <ProtectedRoute roles={["provider"]}>
            <ProviderProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/data-disclaimer" element={<DataDisclaimerPage />} />
      <Route
         path="/notifications"
         element={<ProtectedRoute roles={["contractor", "provider", "worker"]}><NotificationsPage /></ProtectedRoute>}
       />

      <Route path="/payment" element={<ProtectedRoute roles={["contractor"]}><PaymentPage /></ProtectedRoute>} />
      {/* PayPal sends the contractor back here with ?token=<order id>. */}
      <Route path="/payment/return" element={<ProtectedRoute roles={["contractor"]}><PaymentPage /></ProtectedRoute>} />
      <Route path="/payment/cancel" element={<ProtectedRoute roles={["contractor"]}><PaymentPage /></ProtectedRoute>} />

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
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminPage />
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
            <ExecutionProjectNotice />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/device-verification"
        element={<ProtectedRoute roles={["provider"]}><ProviderDeviceVerification /></ProtectedRoute>}
      />
      <Route
        path="/provider/device-verification/:projectId"
        element={<ProtectedRoute roles={["provider"]}><ProviderDeviceVerification /></ProtectedRoute>}
      />
      <Route
        path="/provider/field-team"
        element={<ProtectedRoute roles={["provider"]}><ProviderFieldTeam /></ProtectedRoute>}
      />
      <Route
        path="/provider/execution/:projectId"
        element={
          <ProtectedRoute roles={["provider"]}>
            <ProviderExecutionDetails />
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

function ExecutionProjectNotice() {
  const navigate = useExecutionNavigate();
  const shown = useExecutionRef(false);

  useExecutionEffect(() => {
    if (shown.current) return;
    shown.current = true;
    window.alert("Choose a project below and click View Details to open Execution.");
    navigate("/provider/projects", { replace: true });
  }, [navigate]);

  return null;
}
