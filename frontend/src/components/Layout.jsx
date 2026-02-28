import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", icon: "▦",  label: "Dashboard"         },
  { to: "/scan",      icon: "⬡",  label: "Website Scanner"   },
  { to: "/phishing",  icon: "⚑",  label: "Phishing Analyzer" },
  { to: "/history",   icon: "☰",  label: "Scan History"      },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-cs-bg text-cs-text flex">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-60 bg-cs-surface border-r border-cs-border flex flex-col fixed h-full z-10">

        {/* Brand */}
        <div className="px-6 py-6 border-b border-cs-border">
          <p className="text-xl font-semibold tracking-tight text-cs-text">
            CyberShield
          </p>
          <p className="text-xs text-cs-subtle mt-0.5">
            Security Audit Platform
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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

        {/* User */}
        <div className="px-4 py-4 border-t border-cs-border">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-cs-primary/20 border border-cs-primary/30 flex items-center justify-center text-cs-primary text-xs font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cs-text text-sm font-medium truncate">{user?.name}</p>
              <p className="text-cs-subtle text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-cs-subtle hover:text-cs-danger text-sm rounded-lg hover:bg-cs-danger/10 transition-all duration-200"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────── */}
      <main className="flex-1 ml-60 px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
