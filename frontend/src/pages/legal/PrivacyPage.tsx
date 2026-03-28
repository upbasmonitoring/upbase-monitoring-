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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            <div className="space-y-4 border-b border-slate-100 pb-8">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
              <div className="flex gap-6 text-sm text-slate-500 font-medium">
                <span>Effective Date: March 28, 2026</span>
                <span>Last Updated: March 28, 2026</span>
              </div>
            </div>

            <section className="prose prose-slate max-w-none">
              <div className="space-y-8 text-slate-600 leading-relaxed">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
                  <p>
                    Welcome to <strong>Upbase Monitoring</strong> ("we", "our", or "us"). Upbase Monitoring provides the AI-powered observability platform, <strong>Upbase Monitoring</strong>, which delivers real-time monitoring, diagnostics, security scanning, and blockchain-based audit verification for modern infrastructure.
                  </p>
                  <p className="mt-4">
                    We are committed to protecting your privacy and handling your data with transparency and care. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal data.
                  </p>
                  <p>
                    By using the Upbase Monitoring platform and its services, including <strong>Upbase Monitoring</strong>, you agree to the practices described in this policy.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
                  <p>We collect the following types of information when you use our platform:</p>
                  
                  <div className="mt-4 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">2.1 Account Data</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Email address</strong> — used for account creation, login, and communication</li>
                      <li><strong>Authentication credentials</strong> — passwords are hashed and never stored in plain text</li>
                      <li><strong>Profile information</strong> — name or display name (if provided)</li>
                      <li><strong>Google OAuth data</strong> — if you sign in via Google, we receive your public profile and email</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-slate-800">2.2 Monitoring & Observability Data</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>URLs and endpoints</strong> — the websites and services you add for monitoring</li>
                      <li><strong>Latency metrics</strong> — p50/p95 response times collected from your monitored services</li>
                      <li><strong>Uptime logs</strong> — availability records over time</li>
                      <li><strong>Error logs</strong> — backend exception reports from your monitored services</li>
                      <li><strong>Deployment records</strong> — change history submitted via integrations (e.g., GitHub, Render)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-slate-800">2.3 Usage Analytics</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Pages visited</strong> within the dashboard</li>
                      <li><strong>Feature interactions</strong> — which tools and diagnostics you run</li>
                      <li><strong>Session duration</strong> — for performance optimization purposes</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-slate-800">2.4 API Keys</h3>
                    <p>
                      If you generate API keys for programmatic access, we store a <strong>hashed version</strong> of the key. Raw API keys are shown only once at creation and are not stored in recoverable form.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Delivering the monitoring service</strong> — processing your data to generate uptime, latency, and error reports</li>
                    <li><strong>Powering AI diagnostics</strong> — feeding anonymized telemetry into our MCP AI Engine to generate performance insights and recommendations</li>
                    <li><strong>Security scanning</strong> — analyzing HTTP headers and response metadata to detect potential vulnerabilities</li>
                    <li><strong>Blockchain audit verification</strong> — generating SHA-256 hashes of critical log events for tamper-proof integrity verification</li>
                    <li><strong>Improving the platform</strong> — understanding how users interact with features to improve reliability and UX</li>
                    <li><strong>Sending notifications</strong> — alerts via WhatsApp or email when anomalies or incidents are detected</li>
                    <li><strong>Account management</strong> — verifying identity, managing sessions, and handling billing (if applicable)</li>
                  </ul>
                  <p className="mt-4">We do <strong>not</strong> use your data for advertising or sell it to third parties.</p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Storage and Security</h2>
                  <div className="mt-4 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">4.1 Storage Infrastructure</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>MongoDB</strong> — primary database for storing user accounts, monitors, logs, incidents, and audit records</li>
                      <li><strong>Redis</strong> — used for caching real-time latency metrics and short-lived session data</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-slate-800">4.2 Security Measures</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Passwords are hashed using industry-standard algorithms (bcrypt)</li>
                      <li>API keys are hashed before storage</li>
                      <li>All data in transit is encrypted via <strong>HTTPS/TLS</strong></li>
                      <li>HTTP security headers are enforced on all API responses</li>
                      <li>Rate limiting is applied to all public endpoints to prevent abuse</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-slate-800">4.3 Blockchain Integrity Verification</h3>
                    <p>
                      For audit purposes, we generate <strong>SHA-256 hashes</strong> of critical log events and store them on a blockchain verification layer. <strong>Raw log data is never stored on-chain</strong> — only cryptographic fingerprints. This allows tamper-evident verification of your audit trail without exposing sensitive data.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Third-Party Services</h2>
                  <p>Upbase Monitoring integrates with the following third-party services to deliver its observability functionality:</p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-3 px-4 text-left font-bold text-slate-900">Service</th>
                          <th className="py-3 px-4 text-left font-bold text-slate-900">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 italic">
                        <tr>
                          <td className="py-3 px-4">Cloudflare</td>
                          <td className="py-3 px-4">DNS, CDN, and edge security for frontend delivery</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Render</td>
                          <td className="py-3 px-4">Backend hosting and deployment pipeline</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">MongoDB Atlas</td>
                          <td className="py-3 px-4">Cloud database hosting</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Upstash / Redis</td>
                          <td className="py-3 px-4">Real-time caching layer</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">GitHub</td>
                          <td className="py-3 px-4">Deployment tracking and webhook integrations</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Google OAuth</td>
                          <td className="py-3 px-4">Authentication provider (optional sign-in method)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Data Sharing</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We <strong>do not sell</strong> your personal data to any third party</li>
                    <li>We <strong>do not share</strong> your monitoring data with advertisers or data brokers</li>
                    <li>Data may be shared with trusted infrastructure providers only to the extent necessary to operate the service</li>
                    <li>We may disclose data if <strong>required by law</strong> or to protect the rights and safety of users</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Your Rights</h2>
                  <p>You have the following rights regarding your personal data:</p>
                  <ul className="list-disc pl-6 mt-4 space-y-2">
                    <li><strong>Access</strong> — Request a copy of the data we hold about you</li>
                    <li><strong>Correction</strong> — Update or correct inaccurate information in your account</li>
                    <li><strong>Deletion</strong> — Request deletion of your account and associated data</li>
                    <li><strong>Export</strong> — Request an export of your monitoring data in a portable format</li>
                    <li><strong>Opt-out</strong> — Disable non-essential notifications and analytics</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Cookies & Tracking</h2>
                  <p>Upbase Monitoring uses minimal cookies and local storage for the following purposes:</p>
                  <ul className="list-disc pl-6 mt-4 space-y-2">
                    <li><strong>Authentication tokens</strong> — to keep you logged in securely</li>
                    <li><strong>Session preferences</strong> — such as selected project or dark/light mode</li>
                    <li><strong>Performance analytics</strong> — basic anonymized usage data to improve the platform</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. When we make significant changes, we will update the "Last Updated" date and notify users via email or in-app notification where appropriate.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contact Information</h2>
                  <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:</p>
                  <div className="mt-4 space-y-1 font-medium text-slate-900">
                    <p>Email: <a href="mailto:upbasmonitoring@gmail.com" className="text-primary hover:underline">upbasmonitoring@gmail.com</a></p>
                    <p>Platform: Upbase Monitoring → Dashboard → Settings → Support</p>
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
