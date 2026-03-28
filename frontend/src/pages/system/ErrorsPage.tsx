import React, { useEffect, useState } from 'react';
import { useProject } from "@/context/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Fingerprint, ChevronRight, Activity, Zap, History } from "lucide-react";
import axios from 'axios';
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';

const ErrorsPage = () => {
  const { selectedProject } = useProject();
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchErrors = async () => {
      if (!selectedProject) return;
      setLoading(true);
      try {
        const response = await axios.get(`/api/production/errors?projectId=${selectedProject._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setErrors(response.data);
      } catch (error) {
        toast.error("Failed to load error feed");
      } finally {
        setLoading(false);
      }
    };

    fetchErrors();
  }, [selectedProject]);

  return (
      <div className="space-y-12 pb-20 font-sans">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-3 lg:max-w-md">
            <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
                <h2 className="text-[10px] font-bold uppercase tracking-[.4em] text-slate-400">Production Reliability</h2>
            </div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter text-slate-900 leading-none">
                Error <span className="text-red-500">Feed</span>
            </h1>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest leading-relaxed">
                Real-time incident feed for {selectedProject?.name}. Comprehensive visibility into production exceptions and system faults.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Button variant="outline" className="h-14 rounded-2xl px-10 text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-slate-50 text-slate-500 transition-all">
              <History className="mr-3 h-4 w-4 opacity-40" /> Archive All
            </Button>
            <Button className="h-14 rounded-2xl px-10 text-[10px] font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white shadow-[0_15px_30px_rgba(220,38,38,0.2)] transition-all">
              <ShieldAlert className="mr-3 h-4 w-4" /> Clear Console
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-[32px] bg-slate-50 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : errors.length === 0 ? (
          <div className="bg-white rounded-[50px] p-24 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center gap-10">
            <div className="h-20 w-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                <ShieldAlert className="h-10 w-10 opacity-30" />
            </div>
            <div className="space-y-3">
                <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-900">Workspace Nominal</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed max-w-sm">
                    No critical production exceptions detected. Your infrastructure baseline verified stable.
                </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {errors.map((error) => (
              <div
                key={error._id}
                className="group flex flex-col sm:flex-row items-center justify-between p-8 bg-white border border-slate-100 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] hover:border-red-500/20 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full opacity-60 bg-red-500`} />
                
                <div className="flex items-center gap-8 flex-1 min-w-0 w-full sm:w-auto mb-6 sm:mb-0">
                  <div className="h-14 w-14 hide-on-mobile shrink-0 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl border border-red-100 group-hover:scale-105 transition-transform shadow-sm">
                    <Fingerprint className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold uppercase tracking-tighter text-slate-900 truncate group-hover:text-red-600 transition-colors">{error.message}</h3>
                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-2.5">
                            <Zap className="h-4 w-4 text-slate-200" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{error.environment || 'Production'}</span>
                        </div>
                        <div className="h-1 w-1 rounded-full bg-slate-100" />
                        <div className="flex items-center gap-2.5">
                            <Activity className="h-4 w-4 text-slate-200" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Release v{error.release || '1.0.0'}</span>
                        </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-12 shrink-0 w-full sm:w-auto justify-end">
                    <div className="flex flex-col items-end">
                      <div className="text-3xl font-bold tracking-tighter text-slate-900 leading-none">{error.occurrenceCount || 1}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mt-2">Telemetry Count</div>
                    </div>
                    
                    <div className="h-12 w-px bg-slate-100" />
                    
                    <div className="flex flex-col items-end text-right min-w-[120px]">
                      <div className="text-xs font-bold text-slate-900 tracking-tight leading-none">
                        {formatDistanceToNow(new Date(error.lastSeen), { addSuffix: true })}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-red-500 mt-2">{error.severity || 'Critical Failure'}</div>
                    </div>
                    
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all text-slate-300">
                        <ChevronRight className="h-5 w-5" />
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

  );
};

export default ErrorsPage;
