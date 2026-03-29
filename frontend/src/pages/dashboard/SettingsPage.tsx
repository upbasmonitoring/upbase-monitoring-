import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { 
    User, 
    Lock, 
    ShieldCheck, 
    Save
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const SettingsPage = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoadingProfile(true);
      try {
          const data = await apiFetch(`/auth/profile`, {
              method: 'PUT',
              body: JSON.stringify({ name, email })
          });
          
          // Merge with existing user data to save token properly (similar to Integrations sync)
          const mergedUser = { ...user, ...data };
          localStorage.setItem('user', JSON.stringify(mergedUser));
          setUser(mergedUser);
          
          toast.success("Profile updated successfully");
      } catch (err: any) {
          toast.error(err.message || "Failed to update profile");
      } finally {
          setLoadingProfile(false);
      }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match");
          return;
      }
      
      if (newPassword.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
      }

      setLoadingPassword(true);
      try {
          await apiFetch(`/auth/password`, {
              method: 'PUT',
              body: JSON.stringify({ currentPassword, newPassword })
          });
          
          toast.success("Password updated successfully");
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
      } catch (err: any) {
          toast.error(err.message || "Failed to update password");
      } finally {
          setLoadingPassword(false);
      }
  };

  return (
      <div className="space-y-12 max-w-4xl mx-auto pb-20 font-sans">
        
        {/* --- 🚀 HEADER --- */}
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,163,255,0.4)]" />
                <h2 className="text-[10px] font-bold uppercase tracking-[.4em] text-muted-foreground/60">Account Management</h2>
            </div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter text-foreground leading-none">
                User <span className="text-primary">Details</span>
            </h1>
            <p className="text-sm font-semibold text-muted-foreground/60 uppercase tracking-widest leading-relaxed max-w-xl">
                Manage your personal identity, email preferences, and secure credentials for access.
            </p>
        </div>

        {/* --- 🧑‍💻 PROFILE SETTINGS --- */}
        <div className="bg-card p-8 md:p-10 rounded-[40px] border border-border shadow-sm hover:border-primary/20 transition-all group">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <User className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold uppercase tracking-tighter text-foreground">Personal Information</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Update your display name and email address</p>
                </div>
            </div>

            <form id="profile-form" name="profile-form" autoComplete="on" onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        id="name"
                        name="name"
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe" 
                        required
                    />
                    <InputField 
                        id="email"
                        name="email"
                        type="email"
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com" 
                        required
                    />
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                    <Button 
                        id="submit-profile-form"
                        name="submit-profile-form"
                        type="submit" 
                        disabled={loadingProfile}
                        className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-lg transition-all"
                    >
                        {loadingProfile ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
                    </Button>
                </div>
            </form>
        </div>

        {/* --- 🔐 PASSWORD SETTINGS --- */}
        <div className="bg-card p-8 md:p-10 rounded-[40px] border border-border shadow-sm hover:border-primary/20 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full opacity-60 bg-primary/40" />
            
            <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-secondary/50 border border-border text-muted-foreground flex items-center justify-center shrink-0">
                    <Lock className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold uppercase tracking-tighter text-foreground">Security Credentials</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Update your master security key</p>
                </div>
            </div>

            <form id="password-form" name="password-form" autoComplete="on" onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                {/* 🛡️ Accessibility: Hidden username field for password managers */}
                <input type="text" name="username" value={email} readOnly className="hidden" autoComplete="username" />
                
                <div className="space-y-4">
                    <InputField 
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••" 
                        required
                    />
                    
                    <InputField 
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••" 
                        required
                    />

                    <InputField 
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••" 
                        required
                    />
                </div>

                <div className="pt-4 border-t border-border flex justify-start">
                    <Button 
                        id="submit-password-form"
                        name="submit-password-form"
                        type="submit" 
                        disabled={loadingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-[0_20px_40px_rgba(0,163,255,0.15)] transition-all"
                    >
                        {loadingPassword ? "Verifying..." : <><ShieldCheck className="mr-2 h-4 w-4" /> Enforce Integrity</>}
                    </Button>
                </div>
            </form>
        </div>

      </div>
  );
};

export default SettingsPage;
