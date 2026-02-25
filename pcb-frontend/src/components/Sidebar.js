import React from "react";
import { NavLink } from "react-router-dom";

const allMenuItems = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard", adminOnly: false },
  { to: "/inventory", icon: "📦", label: "Inventory Mgmt", adminOnly: true },
  { to: "/pcb-mapping", icon: "🧩", label: "PCB Mapping", adminOnly: true },
  { to: "/production", icon: "🏭", label: "Production Entry", adminOnly: false },
  { to: "/low-stock", icon: "⚠️", label: "Low Stock Alerts", adminOnly: false },
  { to: "/reports", icon: "📈", label: "Reports", adminOnly: true },
  { to: "/export", icon: "⬇️", label: "Export", adminOnly: true },
  { to: "/import", icon: "📥", label: "Import", adminOnly: true },
];

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  const isAdmin = user?.role === "admin";

  const visibleItems = allMenuItems.filter(item => isAdmin || !item.adminOnly);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo">Electrolyte Solutions</div>
        {isAdmin && <div className="role-badge admin-badge">ADMIN</div>}
        {!isAdmin && user && <div className="role-badge operator-badge">OPERATOR</div>}
      </div>
      <nav className="menu">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}
          >
            <span className="icon">{item.icon}</span> {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
