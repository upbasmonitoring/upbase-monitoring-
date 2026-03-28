import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { 
    Github, 
    Slack, 
    MessageSquare, 
    Bell, 
    Puzzle, 
    CheckCircle2, 
    Link2, 
    Settings2,
    Mail,
    Phone,
    MessageCircle,
    Activity,
    ShieldCheck,
    ChevronRight,
    Search,
    ExternalLink
} from "lucide-react";
import axios from 'axios';
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

import { apiFetch } from "@/lib/api";

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [githubUser, setGithubUser] = useState("");
  const [isDiscordOpen, setIsDiscordOpen] = useState(false);
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({ isConnected: false, qrCode: null });

  const syncUserState = (user: any) => {
    if (!user) return;
    
    // Merge with existing state to preserve the authentication token
    const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
    const mergedUser = { ...existingUser, ...user };
    
    localStorage.setItem("user", JSON.stringify(mergedUser));
    setIntegrations(mergedUser.integrations || {});
    setDiscordWebhook(mergedUser.integrations?.discordWebhook || "");
    setGithubUser(mergedUser.github?.username || "");
  };

  useEffect(() => {
    const fetchStatus = async () => {
        try {
            const data = await apiFetch('/auth/whatsapp/status');
            if (data) setWhatsappStatus(data);
        } catch (err) {
            console.error(err);
        }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchIntegrations = async () => {
    try {
        setLoading(true);
        // --- 🔎 LIVE SYNC: Pull latest settings from Cloud ---
        const user = await apiFetch('/auth/profile');
        if (user) {
            syncUserState(user);
        }
    } catch (err) {
        console.error("[SYNC-ERR] Failed to pull live profile:", err);
        // Fallback to local
        const local = JSON.parse(localStorage.getItem("user") || "{}");
        syncUserState(local);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleUpdateIntegrations = async (payload: any) => {
    try {
      const data = await apiFetch(`/auth/integrations`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      syncUserState(data);
      toast.success("Integrations updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update integrations");
    }
  };

  const handleWhatsappLogout = async () => {
    try {
        await apiFetch('/auth/whatsapp/logout', { method: 'POST' });
        setWhatsappStatus({ isConnected: false, qrCode: null });
        toast.success("WhatsApp Hub Disconnected Successfully");
    } catch (err: any) {
        toast.error("Failed to disconnect WhatsApp Hub");
    }
  };

  const handleSaveDiscord = async () => {
      await handleUpdateIntegrations({ discordWebhook });
      setIsDiscordOpen(false);
  };

  const handleUpdateGithub = async () => {
    try {
        if (!githubToken) {
            toast.error("VCS Token required for verification");
            return;
        }

        // --- 🔎 LIVE VERIFICATION: Test token against GitHub ---
        try {
            await axios.get('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${githubToken}` }
            });
        } catch (err: any) {
             const errorMsg = err.response?.status === 401 ? "Unauthorized: Your GitHub Token is invalid." : "GitHub API Handshake Failed.";
             toast.error(errorMsg);
             return;
        }

        const data = await apiFetch(`/auth/github`, {
            method: 'PUT',
            body: JSON.stringify({
                accessToken: githubToken,
                username: githubUser
            })
        });
        
        syncUserState(data);
        toast.success("VCS Handshake Verified & Saved");
        setIsGithubOpen(false);
        setGithubToken("");
      } catch (err: any) {
        toast.error(err.message || "Failed to link GitHub Node");
      }
  };

  const toggleEmail = () => {
      handleUpdateIntegrations({ emailAlerts: !integrations.emailAlerts });
  };

  return (
      <div className="space-y-12 max-w-6xl mx-auto pb-20 font-sans">
        
        {/* --- 🚀 1. INTEGRATIONS HEADER --- */}
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,163,255,0.4)]" />
                <h2 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400">Connected Services</h2>
            </div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter text-slate-900 leading-none">
                Alert <span className="text-primary">Channels</span>
            </h1>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xl">
                Configure multi-channel incident routing. Propagate stability alerts 
                across your team's existing communication stacks.
            </p>
        </div>

        {/* --- 📟 2. INTEGRATION CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Discord Integration */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] hover:border-indigo-500/20 transition-all group flex flex-col justify-between min-h-[320px]">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-14 w-14 flex items-center justify-center bg-indigo-50 border border-indigo-100 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <MessageSquare className="h-6 w-6 text-indigo-500 group-hover:text-white transition-all" />
                    </div>
                    {integrations.discordWebhook ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-green-50 text-green-600 border border-green-100 text-[9px] font-bold uppercase tracking-widest">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Connected
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 text-slate-300 border border-slate-100 text-[9px] font-bold uppercase tracking-widest">
                            Inactive
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <h3 className="text-lg font-bold uppercase tracking-tighter text-slate-900">Discord Hub</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">High-priority instant notifications for edge incidents.</p>
                </div>
            </div>
            
            <Dialog open={isDiscordOpen} onOpenChange={setIsDiscordOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] border-slate-100 hover:bg-slate-50 transition-all text-slate-500">
                        {integrations.discordWebhook ? 'Modify Endpoint' : 'Configure Channel'}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] bg-white rounded-[40px] border-none shadow-2xl p-10 outline-none">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-bold uppercase tracking-tighter text-slate-900 outline-none">Discord <span className="text-indigo-500">Relay</span></DialogTitle>
                        <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-relaxed">Paste your Discord Webhook URL below to receive instant 🚨 alerts.</DialogDescription>
                    </DialogHeader>
                    <div className="py-8">
                        <InputField
                            id="discord-webhook"
                            label="Webhook Address"
                            labelClassName="sr-only"
                            name="discordWebhook"
                            placeholder="https://discord.com/api/webhooks/..." 
                            value={discordWebhook}
                            onChange={(e) => setDiscordWebhook(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveDiscord()}
                            className="bg-white border-slate-200 h-14 text-xs font-bold rounded-2xl text-slate-900 border-2 focus-visible:ring-4 focus-visible:ring-indigo-500/5 focus-visible:border-indigo-500/40 transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveDiscord} className="w-full h-16 bg-indigo-500 hover:bg-indigo-600 text-white font-bold uppercase tracking-widest text-[11px] rounded-2xl shadow-xl transition-all">Enable Integration</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>

          {/* Email Integration */}
          <div className={`bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] hover:border-primary/20 transition-all group flex flex-col justify-between min-h-[320px] ${integrations.emailAlerts ? 'ring-1 ring-primary/20' : ''}`}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className={`h-14 w-14 flex items-center justify-center rounded-2xl border transition-all ${integrations.emailAlerts ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                        <Mail className="h-6 w-6" />
                    </div>
                    {integrations.emailAlerts ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-green-50 text-green-600 border border-green-100 text-[9px] font-bold uppercase tracking-widest">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {integrations.alertEmail ? 'Custom Destination' : 'Active'}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 text-slate-300 border border-slate-100 text-[9px] font-bold uppercase tracking-widest">
                            Disabled
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <h3 className="text-lg font-bold uppercase tracking-tighter text-slate-900">Email Escalation</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Secondary alerting channel for sustained infrastructure downtime.</p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <Button onClick={toggleEmail} variant="outline" className={`w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all ${integrations.emailAlerts ? 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                    {integrations.emailAlerts ? 'Deactivate Alerts' : 'Enable Email Alerts'}
                </Button>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="w-full text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">
                            {integrations.alertEmail || "Configure Custom Email"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px] bg-white rounded-[40px] border-none shadow-2xl p-10 outline-none">
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-2xl font-bold uppercase tracking-tighter text-slate-900 outline-none">Custom <span className="text-primary">Destination</span></DialogTitle>
                            <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-relaxed">Enter a custom email to receive alerts (leave empty to use your default email).</DialogDescription>
                        </DialogHeader>
                        <div className="py-8">
                            <InputField 
                                id="alert-email"
                                name="alertEmail"
                                autoComplete="email"
                                placeholder="alerts@yourteam.com" 
                                defaultValue={integrations.alertEmail}
                                onBlur={(e) => {
                                    handleUpdateIntegrations({ alertEmail: e.target.value });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleUpdateIntegrations({ alertEmail: (e.target as HTMLInputElement).value });
                                    }
                                }}
                                className="bg-white border-slate-200 h-14 text-xs font-bold rounded-2xl text-slate-900 border-2 focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:border-primary/40 transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <DialogFooter>
                            <p className="text-[9px] text-slate-400 uppercase font-bold text-center w-full">Alerts will be routed to this specific inbox.</p>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
          </div>

          {/* GitHub Integration */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] hover:border-slate-900/20 transition-all group flex flex-col justify-between min-h-[320px]">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-14 w-14 flex items-center justify-center bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/10">
                        <Github className="h-6 w-6" />
                    </div>
                    {githubUser ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-green-50 text-green-600 border border-green-100 text-[9px] font-bold uppercase tracking-widest">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Linked: @{githubUser}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 text-slate-300 border border-slate-100 text-[9px] font-bold uppercase tracking-widest">
                            Missing Token
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <h3 className="text-lg font-bold uppercase tracking-tighter text-slate-900">GitHub Node</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Required for autonomous VCS rollbacks and AI code patching.</p>
                </div>
            </div>
            
            <Dialog open={isGithubOpen} onOpenChange={setIsGithubOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] border-slate-100 hover:bg-slate-50 transition-all text-slate-500">
                        {githubUser ? 'Swap Credentials' : 'Connect Repository'}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] bg-white rounded-[40px] border-none shadow-2xl p-10 outline-none">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-bold uppercase tracking-tighter text-slate-900 outline-none">Connect <span className="text-slate-400">GitHub</span></DialogTitle>
                        <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-relaxed text-slate-400">Enter a Personal Access Token (PAT) with <code className="text-slate-900 bg-slate-100 px-1 rounded">repo</code> scope.</DialogDescription>
                    </DialogHeader>
                    <div className="py-8 space-y-5">
                        <div className="space-y-2">
                            <InputField
                                        id="githubUser"
                                        label="GitHub Username" 
                                id="githubUser"
                                name="githubUser"
                                placeholder="octocat" 
                                value={githubUser}
                                onChange={(e) => setGithubUser(e.target.value)}
                                className="bg-white border-slate-200 h-14 text-xs font-bold rounded-2xl text-slate-900 border-2 focus-visible:ring-4 focus-visible:ring-slate-900/5 focus-visible:border-slate-900/40 transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <InputField
                                        id="githubToken"
                                        label="Personal Access Token" 
                                id="githubToken"
                                name="githubToken"
                                type="password"
                                placeholder="ghp_xxxxxxxxxxxx" 
                                value={githubToken}
                                onChange={(e) => setGithubToken(e.target.value)}
                                className="bg-white border-slate-200 h-14 text-xs font-bold rounded-2xl text-slate-900 border-2 focus-visible:ring-4 focus-visible:ring-slate-900/5 focus-visible:border-slate-900/40 transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateGithub} className="w-full h-16 bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] rounded-2xl shadow-xl transition-all">Securely Link Node</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>

          {/* WhatsApp Hub */}
          <div className={`bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] hover:border-emerald-500/20 transition-all group flex flex-col justify-between min-h-[320px] ${whatsappStatus.isConnected ? 'ring-1 ring-emerald-100' : ''}`}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className={`h-14 w-14 flex items-center justify-center rounded-2xl border transition-all ${whatsappStatus.isConnected ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    {whatsappStatus.isConnected ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold uppercase tracking-widest">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected ✅
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-bold uppercase tracking-widest animate-pulse">
                            Establishing Link...
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <h3 className="text-lg font-bold uppercase tracking-tighter text-slate-900">WhatsApp Hub</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Secure live uplink for critical (1-2m) and escalated (15m) incident signals.</p>
                </div>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className={`w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all ${whatsappStatus.isConnected ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                        {whatsappStatus.isConnected ? 'Active Status' : 'Scan QR Uplink'}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] bg-white rounded-[40px] border-none shadow-2xl p-10 outline-none">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-bold uppercase tracking-tighter text-slate-900 outline-none">WhatsApp <span className="text-emerald-500">Uplink</span></DialogTitle>
                        <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-relaxed text-slate-400">
                            {whatsappStatus.isConnected ? "You are connected! You can now receive alerts and reply with 'STATUS' or 'ROLLBACK'." : "Scan the QR code below with your phone's WhatsApp camera."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8 flex flex-col items-center justify-center space-y-6">
                        {whatsappStatus.isConnected ? (
                            <div className="w-full h-48 bg-emerald-50 rounded-3xl border-2 border-emerald-100 border-dashed flex flex-col items-center justify-center space-y-3">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Secure Handshake Active</p>
                            </div>
                        ) : (
                            whatsappStatus.qrCode ? (
                                <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-inner">
                                    <img src={whatsappStatus.qrCode} alt="WhatsApp QR" className="w-48 h-48 rounded-2xl" />
                                </div>
                            ) : (
                                <div className="w-48 h-48 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center animate-pulse">
                                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Generating QR...</p>
                                </div>
                            )
                        )}
                        
                        <div className="w-full space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                <p className="text-[9px] font-bold text-slate-900 underline uppercase tracking-tighter">Available Commands:</p>
                                <p className="text-[10px] text-slate-500 font-semibold">• *STATUS*: Current fleet health</p>
                                <p className="text-[10px] text-slate-500 font-semibold">• *ROLLBACK*: Trigger recovery loop</p>
                            </div>

                            <InputField 
                                id="phone-number"
                                name="phone"
                                autoComplete="tel"
                                placeholder="Your Phone Number (e.g. +91 999..)" 
                                defaultValue={integrations.phone}
                                onBlur={(e) => {
                                    if (e.target.value) handleUpdateIntegrations({ phone: e.target.value });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleUpdateIntegrations({ phone: (e.target as HTMLInputElement).value });
                                    }
                                }}
                                className="bg-white border-slate-200 h-14 text-xs font-bold rounded-2xl text-slate-900 border-2 focus-visible:ring-4 focus-visible:ring-emerald-500/5 focus-visible:border-emerald-500/40 transition-all placeholder:text-slate-300"
                            />
                        </div>

                        {whatsappStatus.isConnected && (
                            <Button 
                                onClick={handleWhatsappLogout} 
                                variant="ghost" 
                                className="w-full text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-500 hover:bg-red-50"
                            >
                                Disconnect Hub & Reset QR
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* --- 📟 3. ALERT LOGIC OVERVIEW --- */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.04)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            <div className="flex items-start gap-8">
                <div className="h-14 w-14 rounded-2xl bg-green-50 border border-green-100 text-green-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-7 w-7" />
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-bold uppercase tracking-tighter text-slate-900">Escalation Logic</h3>
                    <p className="text-sm font-semibold text-slate-500 leading-relaxed uppercase tracking-widest">
                        Incidents are currently gated by <span className="text-primary font-bold underline decoration-primary/30 decoration-2">Consecutive Health Checks (2 Failures)</span> to eliminate false positives from network jitter. 
                        Once verified, WhatsApp alerts are dispatched immediately. Discord follows at 30 seconds, and email escalation at 5 minutes still down. For sustained outages (15m), an urgent WhatsApp escalation is triggered.
                    </p>
                </div>
            </div>
        </div>

      </div>
  );
};

export default IntegrationsPage;
