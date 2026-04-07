import { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, useLocation, useOutlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";

// Components
import { PremiumLoader, DashboardSkeleton } from "@/components/loading/TransitionComponents";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Lazy Pages
// dashboard/
const DashboardPage        = lazy(() => import("./pages/dashboard/DashboardPage"));
const MonitorsPage         = lazy(() => import("./pages/dashboard/MonitorsPage"));
const MonitorDetailsPage   = lazy(() => import("./pages/dashboard/MonitorDetailsPage"));
const ApiKeysPage          = lazy(() => import("./pages/dashboard/ApiKeysPage"));
const IntegrationsPage     = lazy(() => import("./pages/dashboard/IntegrationsPage"));

// ai/
const AIPage               = lazy(() => import("./pages/ai/AIPage"));
const UpbaseDiagnosticsPage = lazy(() => import("./pages/ai/RalphDiagnosticsPage"));
const UpbaseIntelligencePage= lazy(() => import("./pages/ai/RalphIntelligencePage"));

// system/
const AlertsPage           = lazy(() => import("./pages/system/AlertsPage"));
const ErrorsPage           = lazy(() => import("./pages/system/ErrorsPage"));
const AuditLogsPage        = lazy(() => import("./pages/system/AuditLogsPage"));

// ops/
const DeploymentsPage      = lazy(() => import("./pages/ops/DeploymentsPage"));
const SelfHealingPage      = lazy(() => import("./pages/ops/SelfHealingPage"));

// observability/
const ObservabilityPage    = lazy(() => import("./pages/dashboard/ObservabilityPage"));

// auth/
const LoginPage            = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage            = lazy(() => import("./pages/auth/SignupPage"));

// root-level
const LandingPage          = lazy(() => import("./pages/LandingPage"));
const NotFound             = lazy(() => import("./pages/NotFound"));
const ErrorPage            = lazy(() => import("./pages/ErrorPage"));

// legal
const PrivacyPage          = lazy(() => import("./pages/legal/PrivacyPage"));
const TermsPage            = lazy(() => import("./pages/legal/TermsPage"));

// features
const FeatureDetailPage    = lazy(() => import("./pages/features/FeatureDetailPage"));

// settings
const SettingsPage         = lazy(() => import("./pages/dashboard/SettingsPage"));

const queryClient = new QueryClient();

/**
 * Root Animated Transition Wrapper
 * Handles top-level page entries (Landing, Login, Dashboard entry)
 */
const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    );
};

// 🏛️ Dashboard Hierarchy Configuration
const router = createBrowserRouter([
  { 
    path: "/", 
    element: (
        <Suspense fallback={<PremiumLoader />}>
            <AnimatedPage><LandingPage /></AnimatedPage>
        </Suspense>
    ),
    errorElement: <ErrorPage />
  },
  { 
    path: "/login", 
    element: (
        <Suspense fallback={<PremiumLoader />}>
            <AnimatedPage><LoginPage /></AnimatedPage>
        </Suspense>
    )
  },
  { 
    path: "/signup", 
    element: (
        <Suspense fallback={<PremiumLoader />}>
            <AnimatedPage><SignupPage /></AnimatedPage>
        </Suspense>
    )
  },
  { 
    path: "/privacy", 
    element: (
        <Suspense fallback={<PremiumLoader />}>
            <AnimatedPage><PrivacyPage /></AnimatedPage>
        </Suspense>
    )
  },
  { 
    path: "/terms", 
    element: (
        <Suspense fallback={<PremiumLoader />}>
            <AnimatedPage><TermsPage /></AnimatedPage>
        </Suspense>
    )
  },
  { 
    path: "/features/:id", 
    element: (
        <Suspense fallback={<PremiumLoader />}>
            <AnimatedPage><FeatureDetailPage /></AnimatedPage>
        </Suspense>
    )
  },
  { 
    path: "/dashboard", 
    element: (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardLayout />
        </Suspense>
    ),
    children: [
        { index: true, element: <DashboardPage /> },
        { path: "monitors", element: <MonitorsPage /> },
        { path: "monitors/:id", element: <MonitorDetailsPage /> },
        { path: "integrations", element: <IntegrationsPage /> },
        { path: "deployments", element: <DeploymentsPage /> },
        { path: "alerts", element: <AlertsPage /> },
        { path: "healing", element: <SelfHealingPage /> },
        { path: "intelligence", element: <UpbaseIntelligencePage /> },
        { path: "ai", element: <AIPage /> },
        { path: "ralph", element: <UpbaseDiagnosticsPage /> },
        { path: "keys", element: <ApiKeysPage /> },
        { path: "errors", element: <ErrorsPage /> },
        { path: "audit", element: <AuditLogsPage /> },
        { path: "settings", element: <SettingsPage /> },
        { path: "observability", element: <ObservabilityPage /> },
    ]
  },
  { path: "*", element: <Suspense fallback={<PremiumLoader />}><NotFound /></Suspense> },
],
 {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  } as any,
});


const App = () => {
    // 🧠 SRE PRELOADING + PERSISTENCE STRATEGY
    useEffect(() => {
        // 🔒 PWA-Only Persist: If running as an INSTALLED APP, jump to dashboard automatically
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        const user = localStorage.getItem('user');
        
        if (isStandalone && user && window.location.pathname === '/') {
            window.location.href = '/dashboard';
        }

        const preload = () => {
            // Priority 1: Main Dashboard + AI Engine
            import("./pages/dashboard/DashboardPage");
            import("./pages/ai/AIPage");
            
            // Priority 2: Ops Pages
            setTimeout(() => {
                import("./pages/dashboard/MonitorsPage");
                import("./pages/ops/DeploymentsPage");
            }, 500);
        };

        const timer = setTimeout(preload, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "1234567890-mockclientid.apps.googleusercontent.com"}>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Toaster />
                    <Suspense fallback={<PremiumLoader />}>
                        <RouterProvider 
                            router={router} 
                            future={{
                                v7_startTransition: true,
                            }}
                        />
                    </Suspense>
                </TooltipProvider>
            </QueryClientProvider>
        </GoogleOAuthProvider>
    );
};

export default App;
