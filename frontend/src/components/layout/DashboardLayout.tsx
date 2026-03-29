import { ReactNode, useEffect, useState, Suspense } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Globe,
  Bell,
  Zap,
  LogOut,
  Search,
  Menu,
  History as HistoryIcon,
  Key,
  ShieldCheck,
  Activity,
  Maximize2,
  ChevronRight,
  User,
  Settings,
  ExternalLink,
  Moon,
  Sun,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/common/Logo";
import MobileBottomNav from "./MobileBottomNav";

/**
 * DashboardLayout (Enterprise Edition)
 * A clean, light-themed workspace matching the upBASE landing page.
 */
const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard", desc: "System Status" },
  { icon: Globe, label: "Monitors", path: "/dashboard/monitors", desc: "Manage Endpoints" },
  { icon: Brain, label: "AI Assistant", path: "/dashboard/ai", desc: "MCP Observability" },
  { icon: Brain, label: "Ralph Intelligence", path: "/dashboard/intelligence", desc: "RCA Analytics" },
  { icon: Zap, label: "Self-Healing", path: "/dashboard/healing", desc: "Automated Recovery" },
  { icon: HistoryIcon, label: "Deployments", path: "/dashboard/deployments", desc: "Change Ledger" },
  { icon: ShieldCheck, label: "Ralph Diagnostics", path: "/dashboard/ralph", desc: "Verified Fixes" },

  { icon: Bell, label: "Security Alerts", path: "/dashboard/alerts", desc: "Incident Control" },
  { icon: Key, label: "API Keys", path: "/dashboard/keys", desc: "Access Vault" },
  { icon: ExternalLink, label: "Integrations", path: "/dashboard/integrations", desc: "Alert Handlers" },
];

const SidebarContent = ({ onNavItemClick }: { onNavItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border relative">
        <div className="absolute inset-0 bg-background opacity-[0.2] pointer-events-none" />
        
        <div className="h-20 flex items-center px-8 shrink-0 relative border-b border-border">
            <Link to="/" className="flex items-center gap-3 group">
                <Logo variant="vibrant" size="sm" />
            </Link>
        </div>

        <div className="px-5 py-8 space-y-1.5 flex-1 overflow-y-auto relative">
        <div className="px-5 mb-8">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 shadow-sm relative overflow-hidden group/control">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover/control:opacity-100 transition-opacity" />
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-600/80 dark:text-indigo-400 leading-none relative">Workspace Control</span>
            </div>
        </div>
            {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onNavItemClick}
                        className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all group relative border ${
                            active 
                            ? "bg-secondary text-primary border-border shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary border-transparent"
                        }`}
                    >
                        {active && <div className="absolute left-0 w-1 h-5 bg-primary rounded-full shadow-[0_0_10px_rgba(0,163,255,0.3)]" />}
                        <item.icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-105 ${active ? 'text-primary' : ''}`} />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold tracking-tight">{item.label}</span>
                            <span className="text-[9px] font-medium opacity-60 group-hover:opacity-100 transition-opacity hidden lg:block uppercase tracking-widest">{item.desc}</span>
                        </div>
                        {active && <ChevronRight className="ml-auto h-3 w-3 opacity-30" />}
                    </Link>
                );
            })}
        </div>

        <div className="p-5 relative border-t border-border">
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-card border border-border text-primary shadow-sm flex items-center justify-center text-xs font-bold italic">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-foreground">{user?.name}</p>
                        <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest truncate">{user?.role || 'Administrator'}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10" onClick={handleLogout}>
                        <LogOut className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
};

import { ProjectSwitcher } from "./ProjectSwitcher";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background text-foreground selection:bg-primary/10 font-sans overflow-hidden transition-colors duration-300">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-[280px] flex-col shrink-0 z-50 border-r border-border bg-card">
            <SidebarContent />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
            
            {/* Top Navigation */}
            <header className={`h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-40 relative transition-all duration-300 ${
                scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm" : "bg-transparent"
            }`}>
                <div className="flex items-center gap-6 flex-1">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 border border-border rounded-xl bg-card">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r border-border w-72 bg-card">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navigation Menu</SheetTitle>
                            </SheetHeader>
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>

                    <div className="flex items-center gap-4">
                        <ProjectSwitcher />
                        
                        <div className="hidden md:flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-2.5 w-full max-w-sm focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all group">
                            <Search className="h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-all" />
                            <label htmlFor="global-search" className="sr-only">Search Workspace</label>
                            <Input
                                id="global-search"
                                name="search"
                                placeholder="Search Workspace..."
                                className="bg-transparent border-0 h-6 text-xs font-semibold placeholder:text-muted-foreground/30 focus-visible:ring-0 p-0 text-foreground"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-2xl text-[10px] font-bold text-muted-foreground uppercase tracking-widest shadow-sm">
                        <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                        System Protected
                    </div>

                    <div className="h-4 w-px bg-slate-200 mx-2 hidden lg:block" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl bg-card border border-border hover:bg-secondary transition-all group shadow-sm">
                                <Bell className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-red-500 border-2 border-card" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[380px] bg-card border-border p-3 shadow-2xl rounded-3xl mt-2 animate-in slide-in-from-top-2 text-foreground">
                             <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Operational Alerts</DropdownMenuLabel>
                             <DropdownMenuSeparator className="bg-border" />
                             <div className="py-2 space-y-1">
                                <div className="p-4 hover:bg-secondary rounded-2xl transition-colors cursor-pointer group border border-transparent hover:border-border/50">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                            <Activity className="h-5 w-5 text-red-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-foreground">Critical: Endpoint Timeout</p>
                                            <p className="text-[10px] font-medium text-muted-foreground mt-1">Monitor US-East-1 has exceeded 5s response time.</p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-11 w-11 rounded-2xl bg-card border border-border shadow-sm text-muted-foreground hover:text-primary transition-all group" 
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === "dark" ? (
                            <Sun className="h-4.5 w-4.5 text-yellow-500 group-hover:scale-110 transition-transform" />
                        ) : (
                            <Moon className="h-4.5 w-4.5 text-slate-400 group-hover:text-primary group-hover:scale-110 transition-transform" />
                        )}
                    </Button>

                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-card border border-border shadow-sm text-muted-foreground hover:text-primary transition-colors" onClick={() => navigate('/dashboard/settings')}>
                        <User className="h-4.5 w-4.5" />
                    </Button>
                </div>
            </header>

            {/* Scrollable Viewport */}
            <main className="flex-1 overflow-y-auto relative scroll-smooth px-4 sm:px-6 lg:px-12 py-4 sm:py-8 custom-scrollbar pb-24 lg:pb-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="max-w-[1400px] mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile Navigation */}
            <MobileBottomNav />
        </div>
    </div>
  );
};

export default DashboardLayout;
