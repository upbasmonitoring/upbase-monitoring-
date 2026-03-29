import React from 'react';
import Navbar from "@/components/landing/Navbar";
import FooterSection from "@/components/landing/FooterSection";
import { motion } from "framer-motion";
import { useEffect } from "react";

const TermsPage = () => {
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
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">Terms & Conditions</h1>
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
                    These Terms and Conditions ("Terms") govern your access to and use of <strong className="text-foreground">Upbase Monitoring</strong> ("the Platform"), an AI-powered observability and monitoring platform provided by <strong className="text-foreground">Upbase Monitoring</strong> ("we", "our", or "us").
                  </p>
                  <p>
                    Please read these Terms carefully before using the platform. By creating an account or using any part of the <strong className="text-foreground">Upbase Monitoring</strong> platform, you agree to be bound by these Terms.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">2. Acceptance of Terms</h2>
                  <p>By accessing or using Upbase Monitoring's services, you confirm that:</p>
                  <ul className="list-disc pl-6 space-y-3">
                    <li>You are at least <strong className="text-foreground">13 years of age</strong> (or the legal age of majority in your jurisdiction)</li>
                    <li>You have read, understood, and agreed to these Terms</li>
                    <li>If you are using the platform on behalf of an organization, you have the authority to bind that organization to these Terms</li>
                  </ul>
                  <p className="italic text-primary/60">If you do not agree to these Terms, you must discontinue use of the platform immediately.</p>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">3. Use of Service</h2>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground/90">3.1 Permitted Use</h3>
                    <p>You may use Upbase Monitoring's platform to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Monitor your own web applications, APIs, and infrastructure</li>
                      <li>Analyze performance, errors, and security of services you own or have permission to monitor</li>
                      <li>Integrate with third-party platforms for deployment and alerting workflows</li>
                    </ul>

                    <h3 className="text-lg font-bold text-foreground/90">3.2 Prohibited Use</h3>
                    <p>You agree <strong className="text-foreground">not</strong> to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Monitor services or infrastructure you do not own or have permission to monitor</li>
                      <li>Use the platform for any illegal, harmful, or malicious purpose</li>
                      <li>Attempt to reverse-engineer, scrape, or exploit the platform's AI engine or APIs</li>
                      <li>Use the platform to generate, distribute, or store harmful or illegal content</li>
                      <li>Create multiple accounts to circumvent usage limits or restrictions</li>
                      <li>Overload, DDoS, or otherwise interfere with the platform's infrastructure</li>
                    </ul>
                  </div>
                  <p>Violations of these terms may result in immediate account suspension or termination.</p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">4. Account Responsibility</h2>
                  <ul className="list-disc pl-6 space-y-3">
                    <li>Maintaining the confidentiality of your login credentials and API keys</li>
                    <li>All activity that occurs under your account</li>
                    <li>Keeping your account information accurate and up to date</li>
                    <li>Notifying us immediately if you suspect unauthorized access to your account</li>
                  </ul>
                  <p>We are not liable for any loss or damage resulting from unauthorized use of your account due to your failure to secure your credentials.</p>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">5. Service Availability</h2>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground/90">5.1 Best-Effort Availability</h3>
                    <p>Upbase Monitoring is provided on a <strong className="text-foreground">best-effort basis</strong>. We do not guarantee:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>100% uptime or uninterrupted access</li>
                      <li>Specific response times or latency targets</li>
                      <li>Continuous availability during maintenance or outages</li>
                    </ul>

                    <h3 className="text-lg font-bold text-foreground/90">5.2 Free Tier Limitations</h3>
                    <p>Free-tier users may be subject to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong className="text-foreground">Monitor limits</strong> — maximum endpoints you can track</li>
                      <li><strong className="text-foreground">Data retention limits</strong> — limited time window for log and metric storage</li>
                      <li><strong className="text-foreground">Rate limits</strong> — API and AI query limits per time period</li>
                      <li><strong className="text-foreground">Cold start delays</strong> — startup delays on free hosting tiers</li>
                    </ul>
                    <p>We reserve the right to change free-tier limits at any time with reasonable notice.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">6. Data Responsibility</h2>
                  <ul className="list-disc pl-6 space-y-3">
                    <li>You retain ownership of all data you submit to the platform</li>
                    <li>You grant us a limited, non-exclusive license to process it solely to deliver the service</li>
                    <li>You are responsible for ensuring you have the right to submit any data you provide</li>
                    <li>You must not submit confidential data (passwords, credentials) in monitoring payloads</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">7. AI Limitations and Advisory Disclaimer</h2>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-[32px] p-8 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[.3em] text-amber-500 mb-2">Important Disclaimer</p>
                    <p className="text-amber-500/80 font-bold leading-relaxed italic">
                      Upbase Monitoring uses an AI engine to generate insights and diagnostic reports. All AI outputs are advisory only and are not a substitute for professional engineering judgment. Validate recommendations with a qualified engineer before acting in production.
                    </p>
                  </div>
                  <p>We are not liable for any system failures or damages resulting from decisions made based on AI-generated recommendations.</p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">8. Security Disclaimer</h2>
                  <p>While we implement industry-standard practices, no system is perfectly secure. By using the platform:</p>
                  <ul className="list-disc pl-6 space-y-3">
                    <li>You acknowledge inherent risks of online data transmission</li>
                    <li>You understand the blockchain layer verifies integrity but doesn't prevent source actions</li>
                    <li>We are not liable for breaches outside our control</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">9. Limitation of Liability</h2>
                  <p>
                    To the fullest extent permitted by law, Upbase Monitoring and its developers are <strong className="text-foreground">not liable</strong> for any indirect, incidental, or consequential damages (including data loss, business interruption, or lost revenue). Our total liability shall not exceed the amount you paid us in the past 30 days (or $0 for free-tier users).
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">10. Termination</h2>
                  <p>
                    You may terminate your account at any time. We reserve the right to terminate your account for violations of these Terms or illegal activities.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">11. Changes to Terms</h2>
                  <p>
                    We may update these Terms. Significant changes will be notified via email or in-app. The "Last Updated" date will reflect the latest version.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">12. Governing Law</h2>
                  <p>
                    These Terms are governed by the laws of <strong className="text-foreground">India</strong>. Disputes shall be subject to the exclusive jurisdiction of the courts located in India.
                  </p>
                </div>

                <div className="bg-secondary/30 border border-border rounded-[40px] p-10 mt-12">
                  <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">13. Contact Information</h2>
                  <p className="mb-6">For any questions or legal notices related to these Terms, please contact:</p>
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

export default TermsPage;
