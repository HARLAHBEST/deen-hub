import { Navigate, Route, Routes } from "react-router-dom";
import Storefront from "./components/Storefront";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Storefront />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
