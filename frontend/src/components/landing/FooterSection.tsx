import { Link } from "react-router-dom";
import Logo from "@/components/common/Logo";
import { Github, Linkedin, ExternalLink, Instagram, MessageCircle } from "lucide-react";

/**
 * FooterSection: A high-fidelity, professional footer for Sentinel IQ.
 */
const FooterSection = () => {
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: "Product",
            links: [
                { name: "Incident Correlation", href: "/features/incident-correlation", desc: "Connect logs, metrics, and events to identify root causes." },
                { name: "Fleet Monitoring", href: "/features/fleet-monitoring", desc: "Monitor multiple services and endpoints from a single dashboard." },
                { name: "Automated Healing", href: "/features/automated-healing", desc: "Trigger recovery actions to minimize system downtime." },
                { name: "Status Dashboard", href: "/features/status-dashboard", desc: "Real-time health overview including uptime and latency." },
            ]
        },
        {
            title: "Resources",
            links: [
                { name: "API Documentation", href: "/features/api-documentation", desc: "Developer guides to integrate monitoring and AI diagnostics." },
                { name: "Uptime Clusters", href: "/features/uptime-clusters", desc: "Distributed nodes for reliable global uptime tracking." },
                { name: "Network Status", href: "/features/network-status", desc: "Live status page showing current system availability." },
                { name: "Security Protocols", href: "/features/security-protocols", desc: "Overview of encryption, authentication, and data protection." },
            ]
        },
        {
            title: "Company",
            links: [
                { name: "About Sentinel IQ", href: "/features/about-sentinel-iq", desc: "AI-powered platform combining monitoring and blockchain integrity." },
                { name: "Enterprise SLA", href: "/features/enterprise-sla", desc: "Guarantees covering uptime, performance, and support." },
                { name: "Contact Operations", href: "/features/contact-operations", desc: "Support for technical issues and enterprise queries." },
                { name: "Privacy Policy", href: "/privacy", desc: "How user data is collected, used, and protected." },
            ]
        }
    ];

    return (
        <footer className="bg-slate-950 pt-24 pb-12 text-white font-sans border-t border-slate-900 relative z-50 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container px-6 mx-auto relative z-10">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Top Section: Branding & Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20 items-start">
                        
                        {/* Branding Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <Link to="/" className="inline-block transition-all hover:opacity-90 hover:scale-[1.02]">
                                <Logo variant="light" size="md" />
                            </Link>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
                                The next generation of observability. Sentinel IQ connects your entire stack with AI-driven intelligence and blockchain-verified integrity.
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                                <SocialIcon href="https://wa.me/919359570497" icon={<MessageCircle className="h-4 w-4" />} />
                                <SocialIcon href="https://www.instagram.com/mr_shivkhude_08/?__pwa=1" icon={<Instagram className="h-4 w-4" />} />
                                <SocialIcon href="https://www.linkedin.com/in/shivam-khude-913509286/" icon={<Linkedin className="h-4 w-4" />} />
                                <div className="h-px w-8 bg-slate-800/50 mx-2" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 italic">v2.4.0 Build 2026</span>
                            </div>
                        </div>

                        {/* Link Columns */}
                        {footerSections.map((section, idx) => (
                            <div key={idx} className="space-y-8">
                                <h4 className="text-[10px] font-bold uppercase tracking-[.4em] text-primary/80">
                                    {section.title}
                                </h4>
                                <ul className="space-y-6">
                                    {section.links.map((link, lIdx) => (
                                        <li key={lIdx} className="group cursor-pointer">
                                            {link.href.startsWith('/') ? (
                                                <Link to={link.href} className="block space-y-1">
                                                    <span className="text-[13px] font-bold text-slate-200 group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                        {link.name}
                                                    </span>
                                                    <p className="text-[11px] leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors">
                                                        {link.desc}
                                                    </p>
                                                </Link>
                                            ) : (
                                                <a href={link.href} className="block space-y-1">
                                                    <span className="text-[13px] font-bold text-slate-200 group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                        {link.name}
                                                        <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-all -translate-y-0.5" />
                                                    </span>
                                                    <p className="text-[11px] leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors">
                                                        {link.desc}
                                                    </p>
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Section: Legal & Status Bar */}
                    <div className="pt-10 border-t border-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 text-center md:text-left">
                            <div className="space-y-1">
                                <p>© {currentYear} Upbase Monitoring</p>
                                <p className="text-[9px] text-slate-600 tracking-[.4em]">AI Observability • Secure • Verified</p>
                            </div>
                            <div className="flex gap-8 border-l border-slate-900 md:pl-12">
                                <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                                <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                            </div>
                        </div>

                        {/* Compact Status Indicator */}
                        <div className="flex items-center gap-4 px-5 py-2.5 rounded-full bg-slate-900/30 border border-slate-800/50 backdrop-blur-sm group hover:border-primary/20 transition-all">
                             <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)] animate-pulse" />
                             <span className="text-[9px] tracking-[.3em] font-black group-hover:text-slate-300 transition-colors text-slate-400">Network: Operational</span>
                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
};

const SocialIcon = ({ icon, href }: { icon: any, href: string }) => (
    <a 
        href={href} 
        target="_blank"
        rel="noopener noreferrer"
        className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-primary hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
    >
        {icon}
    </a>
);

export default FooterSection;

