import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", icon: "▦", label: "Dashboard" },
  { to: "/scan", icon: "⬡", label: "Website Scanner" },
  { to: "/phishing", icon: "⚑", label: "Phishing Analyzer" },
  { to: "/history", icon: "☰", label: "Scan History" },
];

export default function Layout() {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-cs-bg text-cs-text flex">

      {/* OVERLAY (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar fixed lg:static z-30 w-60 h-full bg-cs-surface border-r border-cs-border flex flex-col transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      >

        {/* BRAND */}
        <div className="px-6 py-6 border-b border-cs-border">
          <p className="text-xl font-semibold tracking-tight">
            CyberShield
          </p>
          <p className="text-xs text-cs-subtle mt-0.5">
            Security Audit Platform
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-cs-primary/10 text-cs-primary font-medium"
                    : "text-cs-muted hover:text-cs-text hover:bg-cs-elevated"
                }`
              }
            >
              <span className="text-base w-4 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

        </nav>

        {/* USER */}
        <div className="px-4 py-4 border-t border-cs-border">

          <div className="flex items-center gap-3 px-2 mb-2">

            <div className="w-7 h-7 rounded-full bg-cs-primary/20 border border-cs-primary/30 flex items-center justify-center text-xs font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-cs-subtle truncate">{user?.email}</p>
            </div>

          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-cs-subtle hover:text-cs-danger rounded-lg hover:bg-cs-danger/10 transition"
          >
            Sign out
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="flex-1 lg:ml-60 px-6 py-6">

        {/* MOBILE TOP BAR */}
        <div className="lg:hidden flex items-center gap-3 mb-6">

          <button
            onClick={() => setSidebarOpen(true)}
            className="text-xl"
          >
            ☰
          </button>

          <p className="font-semibold">
            CyberShield
          </p>

        </div>

        <Outlet />

      </main>

    </div>
  );
}