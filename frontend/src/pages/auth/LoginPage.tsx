import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import { 
    Shield, 
    ArrowRight, 
    Github, 
    Check, 
    Fingerprint, 
    Lock, 
    Satellite,
    Cpu,
    Zap,
    Globe,
    ChevronRight,
    Activity
} from "lucide-react";
import Logo from "@/components/common/Logo";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useGoogleLogin } from "@react-oauth/google";

/**
 * LoginPage: Professional Enterprise Access
 * Matching the upBASE Clean & Clear aesthetic.
 */
const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            toast.info("Authenticating via Google...", { duration: 1500 });
            try {
                const data = await apiFetch('/auth/google', {
                    method: 'POST',
                    body: JSON.stringify({ accessToken: tokenResponse.access_token }),
                });
                
                localStorage.setItem("user", JSON.stringify(data));
                toast.success("Welcome back to upBASE");
                navigate("/dashboard");
            } catch (error: any) {
                toast.error(`Authentication failed: ${error.message}`);
            } finally {
                setLoading(false);
            }
        },
        onError: () => toast.error("Google login failed"),
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            
            if (data) {
                localStorage.setItem("user", JSON.stringify(data));
                toast.success("Login successful");
                navigate("/dashboard");
            }
        } catch (error: any) {
            toast.error(error.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-background text-foreground relative overflow-hidden transition-colors duration-500">
            {/* Soft Background Accents */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
                
                <div className="mb-12 flex flex-col items-center gap-4 transition-all duration-700 hover:scale-105 group/logo relative">
                    <Logo size="lg" variant="vibrant" to="/" />
                    <Link to="/" className="absolute -top-10 opacity-0 group-hover/logo:opacity-100 transition-opacity text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <ChevronRight className="h-3 w-3 rotate-180" />
                        Back to Landing
                    </Link>
                </div>

                <div className="bg-card w-full p-10 rounded-[40px] border border-border shadow-[0_30px_70px_-20px_rgba(0,0,0,0.06)] relative overflow-hidden group transition-all">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-40 dark:opacity-20" />
                    
                    <div className="text-center mb-10 space-y-2">
                        <h2 className="text-2xl font-bold uppercase tracking-tighter text-foreground">Welcome <span className="text-primary">Back</span></h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[.4em]">Secure Workspace Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-6">
                            <InputField 
                                id="email"
                                name="email"
                                type="email" 
                                label="Email Address"
                                placeholder="name@company.com" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={<Globe className="h-4 w-4" />}
                                className="font-sans"
                            />

                            <div className="relative">
                                {/* Extra link above label */}
                                <div className="absolute right-0 top-0 z-10 translate-y-[-2px]">
                                     <span className="text-[9px] font-bold text-primary hover:text-primary/70 uppercase tracking-widest cursor-pointer transition-colors">Recover?</span>
                                </div>
                                <InputField 
                                    id="password"
                                    name="password"
                                    type="password" 
                                    label="Security Key"
                                    placeholder="••••••••"
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    icon={<Lock className="h-4 w-4" />}
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-[.25em] text-[11px] rounded-2xl shadow-[0_20px_40px_rgba(0,163,255,0.15)] group relative overflow-hidden transition-all active:scale-95"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? "Authenticating..." : "Enter Workspace"}
                                {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </span>
                        </Button>
                    </form>

                    <div className="relative my-10 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                             <div className="w-full h-px bg-border opacity-50" />
                        </div>
                        <span className="relative z-10 px-5 bg-card text-[9px] font-bold uppercase tracking-[.5em] text-muted-foreground">Fast Access</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Button 
                            variant="outline" 
                            className="h-14 bg-card border-border rounded-2xl flex items-center gap-4 hover:bg-secondary hover:border-primary/40 transition-all font-bold uppercase tracking-widest text-[9px] group text-muted-foreground"
                            onClick={() => googleLogin()}
                            disabled={loading}
                        >
                            <svg className="h-4 w-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.2a6.3 6.3 0 010-4.64z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Handshake via Google
                        </Button>
                    </div>

                    <div className="mt-10 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                            New to infrastructure?{" "}
                            <Link to="/signup" className="text-primary font-bold hover:underline transition-all">Create Account</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4 opacity-40">
                    <div className="flex items-center gap-4">
                        <div className="h-px w-8 bg-slate-200" />
                        <Shield className="h-4 w-4 text-slate-400" />
                        <div className="h-px w-8 bg-slate-200" />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[.6em] text-slate-300">Secure Uptime Relay v2.4.0</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
