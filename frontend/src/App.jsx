import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import Proveedores    from "./pages/Proveedores";
import Planificacion  from "./pages/Planificacion";
import Checklist      from "./pages/Checklist";
import "./App.css";

const NAV = [
  { to: "/proveedores",   label: "Proveedores",   icon: "🏪" },
  { to: "/planificacion", label: "Planificación",  icon: "📅" },
  { to: "/checklist",     label: "Checklist",      icon: "✅" },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🛒</span>
          <span className="brand-name">Compras</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link--active" : "")
            }>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>v1.0.0</span>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/checklist" replace />} />
          <Route path="/proveedores"   element={<Proveedores />} />
          <Route path="/planificacion" element={<Planificacion />} />
          <Route path="/checklist"     element={<Checklist />} />
        </Routes>
      </main>
    </div>
  );
}
