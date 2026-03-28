import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/common/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Satellite, Shield, Globe } from "lucide-react";

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Solutions", href: "/#features", icon: <Globe className="h-3 w-3" /> },
        { name: "Capabilities", href: "/#capabilities", icon: <Shield className="h-3 w-3" /> },
        { name: "Global Network", href: "/#integrations", icon: <Satellite className="h-3 w-3" /> },
    ];

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] px-6 pt-6 flex justify-center pointer-events-none">
            <nav className={`
                w-full max-w-7xl h-16 md:h-20 flex items-center justify-between px-8 rounded-[24px] pointer-events-auto transition-all duration-700 font-sans
                ${scrolled 
                    ? "bg-white/90 backdrop-blur-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] scale-[0.98]" 
                    : "bg-transparent border border-transparent"}
            `}>
                <div className="flex items-center gap-12">
                    <Link to="/" className="flex items-center gap-3 group">
                        <Logo variant="dark" />
                    </Link>

                    {/* Desktop Command center Nav */}
                    <div className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500 hover:text-primary transition-all group"
                            >
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">{link.icon}</span>
                                {link.name}
                            </a>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-6 pr-6 border-r border-slate-100">
                        <Link to="/login">
                            <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-[.25em] text-slate-400 hover:text-slate-900 transition-all bg-transparent hover:bg-slate-50 h-10 px-6 rounded-xl">
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
                        className="lg:hidden text-slate-400 hover:text-slate-900"
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
                            className="absolute top-[calc(100%+12px)] left-0 right-0 lg:hidden bg-white/95 backdrop-blur-3xl border border-slate-100 rounded-[32px] overflow-hidden p-8 shadow-[0_40px_100px_rgba(0,0,0,0.1)]"
                        >
                            <div className="flex flex-col gap-6">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        className="text-[12px] font-black uppercase tracking-[.3em] text-slate-500 hover:text-primary transition-all py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.name}
                                    </a>
                                ))}
                                <hr className="border-slate-100 my-2" />
                                <div className="grid grid-cols-2 gap-4">
                                     <Link to="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="outline" className="w-full text-[10px] font-black uppercase italic border-slate-200 h-12 rounded-2xl">Login</Button>
                                    </Link>
                                    <Link to="/signup" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                                        <Button className="w-full text-[10px] font-black uppercase italic bg-primary h-12 rounded-2xl">Sign Up</Button>
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
