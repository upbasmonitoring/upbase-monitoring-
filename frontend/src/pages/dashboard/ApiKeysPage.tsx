import React, { useEffect, useState } from 'react';
import { useProject } from "@/context/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Plus, Copy, Check, Trash2, Shield, Eye, EyeOff, Activity } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

const ApiKeysPage = () => {
  const { selectedProject, loading: contextLoading } = useProject();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      if (!selectedProject?._id) return;
      setLoading(true);
      try {
        const data = await apiFetch(`/keys/project/${selectedProject._id}`);
        setKeys(data);
      } catch (error) {
        toast.error("Handshake failed: Protected Vault Error");
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, [selectedProject]);

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast.success("Secret Token copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [generating, setGenerating] = useState(false);

  const generateKey = async () => {
    if (!selectedProject?._id) {
        toast.error("Handshake Aborted: No Project Selected. Please select a project from the switcher.");
        return;
    }
    
    setGenerating(true);
    try {
        const data = await apiFetch(`/keys`, {
            method: 'POST',
            body: JSON.stringify({
                projectId: selectedProject._id,
                name: `Production Node - ${new Date().toLocaleDateString()}`
            })
        });
        
        // Show raw key once
        const rawKey = data.key;
        setKeys([data, ...keys]);
        
        // Modal logic would be better but toast + clipboard for now
        navigator.clipboard.writeText(rawKey);
        toast.success(`NEW TOKEN: ${rawKey}`, {
            duration: 15000,
            description: "COPIED TO CLIPBOARD. THIS IS THE ONLY TIME YOU WILL SEE THIS TOKEN."
        });
    } catch (err) {
        toast.error("Failed to generate secure node handshake");
    } finally {
        setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
        await apiFetch(`/keys/${id}`, { method: 'DELETE' });
        setKeys(keys.filter(k => k._id !== id));
        toast.success("Security Node Decommissioned");
    } catch (err) {
        toast.error("Failed to revoke key");
    }
  };

  return (
      <div className="space-y-8 max-w-5xl pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Access <span className="text-primary">Tokens</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[.4em]">Infrastructure Credentials for {selectedProject?.name}</p>
          </div>
          <Button 
            onClick={generateKey} 
            disabled={generating}
            className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[.25em] text-[11px] h-12 px-8 rounded-2xl shadow-[0_20px_40px_rgba(0,163,255,0.15)] flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {generating ? (
                <>Authenticating...</>
            ) : (
                <><Plus className="h-4 w-4" /> Create Key</>
            )}
          </Button>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.04)] space-y-8 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-40" />

           <div className="flex items-start gap-5 p-6 bg-slate-50 border border-slate-100 rounded-3xl group/alert hover:bg-white hover:border-primary/20 transition-all duration-300">
              <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm group-hover/alert:border-primary/40 group-hover/alert:shadow-primary/5 transition-all">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                 <h4 className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400 mb-1 group-hover/alert:text-primary transition-colors">Security Protocol 119</h4>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                    All API keys are SHA-256 hashed. We never store raw keys in our database. 
                    Lost keys cannot be recovered—they must be rotated if compromised.
                 </p>
              </div>
           </div>

           <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[.3em] text-slate-400 ml-1">Active Credentials</p>
              {loading ? (
                <div className="space-y-4 pt-4">
                   {[1, 2].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />)}
                </div>
              ) : keys.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-200 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200/60 mt-4">
                   <Key className="h-12 w-12 mb-4 opacity-50" />
                   <span className="text-[10px] font-black uppercase tracking-[.5em] opacity-40">No active keys found</span>
                </div>
              ) : (
                <div className="split-grid space-y-3 pt-4">
                   {keys.map((key) => (
                     <div key={key._id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl group hover:border-primary/30 hover:shadow-[0_15px_30px_-15px_rgba(0,0,0,0.05)] transition-all duration-300">
                       <div className="flex items-center gap-5">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                             <Key className="h-4 w-4" />
                          </div>
                          <div>
                             <div className="text-xs font-black uppercase tracking-widest text-slate-900 italic">{key.name || 'System Access Node'}</div>
                             <div className="text-[9px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-widest">{key.keyPrefix}••••••••••••••••</div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-4">
                           <div className="px-3 py-1 bg-green-500/5 border border-green-500/10 rounded-full hidden sm:block">
                              <span className="text-[8px] font-black uppercase text-green-500 flex items-center gap-1.5">
                                 <Activity className="h-2.5 w-2.5" />
                                 Live Relay
                                 </span>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => handleRevoke(key._id)} className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all">
                               <Trash2 className="h-4 w-4" />
                           </Button>
                       </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>
  );
};

export default ApiKeysPage;
