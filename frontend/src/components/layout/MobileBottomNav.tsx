import { NavLink } from "react-router-dom";
import { Home, Activity, Bot, Bell, Key } from "lucide-react";

export default function MobileBottomNav() {
  const navItems = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/dashboard/monitors", icon: Activity, label: "Monitors" },
    { to: "/dashboard/ai", icon: Bot, label: "AI" },
    { to: "/dashboard/alerts", icon: Bell, label: "Alerts" },
    { to: "/dashboard/keys", icon: Key, label: "Access" }
  ];


  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 md:hidden z-50 rounded-t-2xl shadow-2xl">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 ${
                isActive ? "text-indigo-400 scale-110 font-bold" : "text-slate-400 active:scale-95"
              }`
            }
          >
            <div className={`p-1 rounded-lg ${to === (window.location.pathname) ? "bg-indigo-500/10" : ""}`}>
              <Icon size={20} />
            </div>
            <span className="text-[10px] uppercase tracking-tighter">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
