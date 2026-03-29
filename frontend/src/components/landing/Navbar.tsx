import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/common/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Satellite, Shield, Globe, Moon, Sun, MessageCircle } from "lucide-react";
import { useTheme } from "next-themes";

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Solutions", href: "/#features", icon: <Globe className="h-3 w-3" /> },
        { name: "Capabilities", href: "/#capabilities", icon: <Shield className="h-3 w-3" /> },
        { name: "Global Network", href: "/#integrations", icon: <Satellite className="h-3 w-3" /> },
        { name: "Contact", href: "/#footer", icon: <MessageCircle className="h-3 w-3 text-cyan-500" /> },
    ];

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] px-6 pt-6 flex justify-center pointer-events-none">
            <nav className={`
                w-full max-w-7xl h-16 md:h-20 flex items-center justify-between px-8 rounded-[24px] pointer-events-auto transition-all duration-700 font-sans
                ${scrolled 
                    ? "bg-card/90 backdrop-blur-3xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.05)] scale-[0.98]" 
                    : "bg-transparent border border-transparent"}
            `}>
                <div className="flex items-center gap-12">
                    <a href="/#hero" className="flex items-center gap-3 group">
                        <Logo variant="vibrant" />
                    </a>

                    {/* Desktop Command center Nav */}
                    <div className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground hover:text-primary transition-all group"
                            >
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">{link.icon}</span>
                                {link.name}
                            </a>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary transition-all"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                    </Button>

                    <div className="hidden sm:flex items-center gap-6 pr-6 border-r border-border">
                        <Link to="/login">
                            <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-[.25em] text-muted-foreground hover:text-foreground transition-all bg-transparent hover:bg-secondary h-10 px-6 rounded-xl">
                                Login
                            </Button>
                        </Link>
                    </div>

                    <Link to="/signup">
                        <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-white text-[10px] font-bold uppercase tracking-[.2em] rounded-xl h-10 px-8 shadow-[0_10px_20px_rgba(0,163,255,0.15)] active:scale-95 transition-all">
                            Sign Up
                        </Button>
                    </Link>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-muted-foreground hover:text-foreground"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </Button>
                </div>

                {/* Mobile Command center Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="absolute top-[calc(100%+12px)] left-0 right-0 lg:hidden bg-card/95 backdrop-blur-3xl border border-border rounded-[32px] overflow-hidden p-8 shadow-[0_40px_100px_rgba(0,0,0,0.3)]"
                        >
                            <div className="flex flex-col gap-6">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        className="text-[12px] font-black uppercase tracking-[.3em] text-muted-foreground/60 hover:text-primary transition-all py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.name}
                                    </a>
                                ))}
                                <hr className="border-border my-2" />
                                <div className="grid grid-cols-2 gap-4">
                                     <Link to="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full text-[10px] font-black uppercase italic border-border bg-secondary/50 h-12 rounded-2xl">Login</Button>
                                    </Link>
                                    <Link to="/signup" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                                        <Button className="w-full text-[10px] font-black uppercase italic bg-primary h-12 rounded-2xl shadow-lg shadow-primary/20">Sign Up</Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </div>
    );
};

export default Navbar;
