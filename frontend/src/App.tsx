import { Navigate, Route, Routes } from "react-router-dom";
import AccountPage from "./pages/AccountPage";
import DownloadPage from "./pages/DownloadPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/download/:token" element={<DownloadPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
