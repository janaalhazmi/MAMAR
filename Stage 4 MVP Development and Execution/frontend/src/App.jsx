import { Routes, Route } from "react-router-dom";

import ProjectLocationPage from "./pages/ProjectLocationPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/project/location"
        element={<ProjectLocationPage />}
      />
    </Routes>
  );
}

export default App;
