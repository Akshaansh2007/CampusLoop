
import { Navigate, Route, Routes } from "react-router-dom";
import Marketplace from "./pages/Marketplace.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ContactSettings from "./pages/ContactSettings.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Marketplace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/settings/contact"
        element={<ContactSettings />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
