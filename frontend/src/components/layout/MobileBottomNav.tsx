import { NavLink } from "react-router-dom";
import { Home, Activity, Bot, Bell, Key } from "lucide-react";
import { useState, useEffect } from "react";

export default function MobileBottomNav() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const scrollContainer = document.getElementById("main-scroll-container");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;
      
      // Always show at the absolute top (handles iOS bounce gracefully)
      if (currentScrollY <= 10) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }
      
      // Increased threshold to avoid micro-triggers (thumb jiggles)
      if (Math.abs(currentScrollY - lastScrollY) < 25) return;

      if (currentScrollY > lastScrollY && currentScrollY > 70) {
        setIsVisible(false); // scroll down -> hide
      } else {
        setIsVisible(true); // scroll up -> show
      }
      setLastScrollY(currentScrollY);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/dashboard/monitors", icon: Activity, label: "Monitors" },
    { to: "/dashboard/ai", icon: Bot, label: "AI" },
    { to: "/dashboard/alerts", icon: Bell, label: "Alerts" },
    { to: "/dashboard/keys", icon: Key, label: "Access" }
  ];

  return (
    <div className={`fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur-xl border-t border-border md:hidden z-50 rounded-t-[2.5rem] shadow-2xl pb-safe-area-inset-bottom transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
      isVisible ? "translate-y-0" : "translate-y-full"
    }`}>
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 ${
                isActive ? "text-primary scale-110 font-bold" : "text-muted-foreground active:scale-95"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-primary/10" : "group-hover:bg-secondary"}`}>
                  <Icon size={20} className={isActive ? "text-primary" : "text-muted-foreground"} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
