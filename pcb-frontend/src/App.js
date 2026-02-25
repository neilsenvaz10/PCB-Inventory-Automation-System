import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ProductionEntry from "./pages/ProductionEntry";
import Reports from "./pages/Reports";
import PCBMapping from "./pages/PCBMapping";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Also from "./pages/Also";
import LowStock from "./pages/LowStock";
import ExportPage from "./pages/Export";
import ImportPage from "./pages/Import";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import "./index.css";

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Navbar />
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/also" element={<Also />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Landing />} />

        {/* ── Everyone (admin + operator) ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>
        } />
        <Route path="/production" element={
          <ProtectedRoute><AppShell><ProductionEntry /></AppShell></ProtectedRoute>
        } />
        <Route path="/low-stock" element={
          <ProtectedRoute><AppShell><LowStock /></AppShell></ProtectedRoute>
        } />

        {/* ── Admin only ── */}
        <Route path="/inventory" element={
          <ProtectedRoute adminOnly><AppShell><Inventory /></AppShell></ProtectedRoute>
        } />
        <Route path="/pcb-mapping" element={
          <ProtectedRoute adminOnly><AppShell><PCBMapping /></AppShell></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute adminOnly><AppShell><Reports /></AppShell></ProtectedRoute>
        } />
        <Route path="/export" element={
          <ProtectedRoute adminOnly><AppShell><ExportPage /></AppShell></ProtectedRoute>
        } />
        <Route path="/import" element={
          <ProtectedRoute adminOnly><AppShell><ImportPage /></AppShell></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
