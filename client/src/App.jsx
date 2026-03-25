import { Navigate, Route, Routes } from "react-router-dom";
import StorefrontPage from "./components/StorefrontPage";
import AdminPage from "./components/AdminPage";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StorefrontPage />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/admin-legacy" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

