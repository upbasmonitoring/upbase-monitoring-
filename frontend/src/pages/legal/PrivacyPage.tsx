import React from 'react';
import Navbar from "@/components/landing/Navbar";
import FooterSection from "@/components/landing/FooterSection";
import { motion } from "framer-motion";
import { useEffect } from "react";

const PrivacyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            <div className="space-y-4 border-b border-border pb-8">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">Privacy Policy</h1>
              <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                <span>Effective Date: March 28, 2026</span>
                <span>Last Updated: March 28, 2026</span>
              </div>
            </div>

            <section className="prose prose-slate dark:prose-invert max-w-none">
              <div className="space-y-10 text-muted-foreground/80 leading-relaxed font-medium">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">1. Introduction</h2>
                  <p>
                    Welcome to <strong className="text-foreground">Upbase Monitoring</strong> ("we", "our", or "us"). Upbase Monitoring provides the AI-powered observability platform, <strong className="text-foreground">Upbase Monitoring</strong>, which delivers real-time monitoring, diagnostics, security scanning, and blockchain-based audit verification for modern infrastructure.
                  </p>
                  <p>
                    We are committed to protecting your privacy and handling your data with transparency and care. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal data.
                  </p>
                  <p>
                    By using the Upbase Monitoring platform and its services, including <strong className="text-foreground">Upbase Monitoring</strong>, you agree to the practices described in this policy.
                  </p>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">2. Information We Collect</h2>
                  <p>We collect the following types of information when you use our platform:</p>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground/90">2.1 Account Data</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-foreground">Email address</strong> — used for account creation, login, and communication</li>
                        <li><strong className="text-foreground">Authentication credentials</strong> — passwords are hashed and never stored in plain text</li>
                        <li><strong className="text-foreground">Profile information</strong> — name or display name (if provided)</li>
                        <li><strong className="text-foreground">Google OAuth data</strong> — if you sign in via Google, we receive your public profile and email</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground/90">2.2 Monitoring & Observability Data</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-foreground">URLs and endpoints</strong> — the websites and services you add for monitoring</li>
                        <li><strong className="text-foreground">Latency metrics</strong> — p50/p95 response times collected from your monitored services</li>
                        <li><strong className="text-foreground">Uptime logs</strong> — availability records over time</li>
                        <li><strong className="text-foreground">Error logs</strong> — backend exception reports from your monitored services</li>
                        <li><strong className="text-foreground">Deployment records</strong> — change history submitted via integrations (e.g., GitHub, Render)</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground/90">2.3 Usage Analytics</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-foreground">Pages visited</strong> within the dashboard</li>
                        <li><strong className="text-foreground">Feature interactions</strong> — which tools and diagnostics you run</li>
                        <li><strong className="text-foreground">Session duration</strong> — for performance optimization purposes</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground/90">2.4 API Keys</h3>
                      <p>
                        If you generate API keys for programmatic access, we store a <strong className="text-foreground">hashed version</strong> of the key. Raw API keys are shown only once at creation and are not stored in recoverable form.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">3. How We Use Your Information</h2>
                  <ul className="list-disc pl-6 space-y-3">
                    <li><strong className="text-foreground">Delivering the monitoring service</strong> — processing your data to generate uptime, latency, and error reports</li>
                    <li><strong className="text-foreground">Powering AI diagnostics</strong> — feeding anonymized telemetry into our MCP AI Engine to generate performance insights and recommendations</li>
                    <li><strong className="text-foreground">Security scanning</strong> — analyzing HTTP headers and response metadata to detect potential vulnerabilities</li>
                    <li><strong className="text-foreground">Blockchain audit verification</strong> — generating SHA-256 hashes of critical log events for tamper-proof integrity verification</li>
                    <li><strong className="text-foreground">Improving the platform</strong> — understanding how users interact with features to improve reliability and UX</li>
                    <li><strong className="text-foreground">Sending notifications</strong> — alerts via WhatsApp or email when anomalies or incidents are detected</li>
                    <li><strong className="text-foreground">Account management</strong> — verifying identity, managing sessions, and handling billing (if applicable)</li>
                  </ul>
                  <p className="mt-4 italic text-primary/60">We do <strong>not</strong> use your data for advertising or sell it to third parties.</p>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">4. Data Storage and Security</h2>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground/90">4.1 Storage Infrastructure</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-foreground">MongoDB</strong> — primary database for storing user accounts, monitors, logs, incidents, and audit records</li>
                        <li><strong className="text-foreground">Redis</strong> — used for caching real-time latency metrics and short-lived session data</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground/90">4.2 Security Measures</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Passwords are hashed using industry-standard algorithms (bcrypt)</li>
                        <li>API keys are hashed before storage</li>
                        <li>All data in transit is encrypted via <strong className="text-foreground">HTTPS/TLS</strong></li>
                        <li>HTTP security headers are enforced on all API responses</li>
                        <li>Rate limiting is applied to all public endpoints to prevent abuse</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground/90">4.3 Blockchain Integrity Verification</h3>
                      <p>
                        For audit purposes, we generate <strong className="text-foreground">SHA-256 hashes</strong> of critical log events and store them on a blockchain verification layer. <strong className="text-foreground">Raw log data is never stored on-chain</strong> — only cryptographic fingerprints. This allows tamper-evident verification of your audit trail without exposing sensitive data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">5. Third-Party Services</h2>
                  <p>Upbase Monitoring integrates with the following third-party services to deliver its observability functionality:</p>
                  <div className="mt-4 overflow-x-auto rounded-[32px] border border-border bg-secondary/20">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[10px] text-foreground">Service</th>
                          <th className="py-4 px-6 text-left font-black uppercase tracking-widest text-[10px] text-foreground">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 font-bold italic">
                        <tr className="hover:bg-secondary/30 transition-colors">
                          <td className="py-4 px-6 text-foreground/80">Cloudflare</td>
                          <td className="py-4 px-6 text-muted-foreground/60">DNS, CDN, and edge security for frontend delivery</td>
                        </tr>
                        <tr className="hover:bg-secondary/30 transition-colors">
                          <td className="py-4 px-6 text-foreground/80">Render</td>
                          <td className="py-4 px-6 text-muted-foreground/60">Backend hosting and deployment pipeline</td>
                        </tr>
                        <tr className="hover:bg-secondary/30 transition-colors">
                          <td className="py-4 px-6 text-foreground/80">MongoDB Atlas</td>
                          <td className="py-4 px-6 text-muted-foreground/60">Cloud database hosting</td>
                        </tr>
                        <tr className="hover:bg-secondary/30 transition-colors">
                          <td className="py-4 px-6 text-foreground/80">Upstash / Redis</td>
                          <td className="py-4 px-6 text-muted-foreground/60">Real-time caching layer</td>
                        </tr>
                        <tr className="hover:bg-secondary/30 transition-colors">
                          <td className="py-4 px-6 text-foreground/80">GitHub</td>
                          <td className="py-4 px-6 text-muted-foreground/60">Deployment tracking and webhook integrations</td>
                        </tr>
                        <tr className="hover:bg-secondary/30 transition-colors">
                          <td className="py-4 px-6 text-foreground/80">Google OAuth</td>
                          <td className="py-4 px-6 text-muted-foreground/60">Authentication provider (optional sign-in method)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">6. Data Sharing</h2>
                  <ul className="list-disc pl-6 space-y-3">
                    <li>We <strong className="text-foreground">do not sell</strong> your personal data to any third party</li>
                    <li>We <strong className="text-foreground">do not share</strong> your monitoring data with advertisers or data brokers</li>
                    <li>Data may be shared with trusted infrastructure providers only to the extent necessary to operate the service</li>
                    <li>We may disclose data if <strong className="text-foreground">required by law</strong> or to protect the rights and safety of users</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">7. Your Rights</h2>
                  <p>You have the following rights regarding your personal data:</p>
                  <ul className="list-disc pl-6 space-y-3">
                    <li><strong className="text-foreground">Access</strong> — Request a copy of the data we hold about you</li>
                    <li><strong className="text-foreground">Correction</strong> — Update or correct inaccurate information in your account</li>
                    <li><strong className="text-foreground">Deletion</strong> — Request deletion of your account and associated data</li>
                    <li><strong className="text-foreground">Export</strong> — Request an export of your monitoring data in a portable format</li>
                    <li><strong className="text-foreground">Opt-out</strong> — Disable non-essential notifications and analytics</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">8. Cookies & Tracking</h2>
                  <p>Upbase Monitoring uses minimal cookies and local storage for the following purposes:</p>
                  <ul className="list-disc pl-6 space-y-3">
                    <li><strong className="text-foreground">Authentication tokens</strong> — to keep you logged in securely</li>
                    <li><strong className="text-foreground">Session preferences</strong> — such as selected project or dark/light mode</li>
                    <li><strong className="text-foreground">Performance analytics</strong> — basic anonymized usage data to improve the platform</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">9. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. When we make significant changes, we will update the "Last Updated" date and notify users via email or in-app notification where appropriate.
                  </p>
                </div>

                <div className="bg-secondary/30 border border-border rounded-[40px] p-10 mt-12">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">10. Contact Information</h2>
                  <p className="mb-6">If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:</p>
                  <div className="space-y-3 font-bold text-foreground/80">
                    <p className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest w-20">Email:</span>
                      <a href="mailto:upbasmonitoring@gmail.com" className="text-primary hover:underline">upbasmonitoring@gmail.com</a>
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest w-20">Platform:</span>
                      <span>Upbase Monitoring → Dashboard → Support</span>
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default PrivacyPage;
