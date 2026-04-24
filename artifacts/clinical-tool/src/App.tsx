import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import DrugSearch from "@/pages/drug-search";
import DoseCalculator from "@/pages/dose-calculator";
import DripCalculator from "@/pages/drip-calculator";
import VitalsScorer from "@/pages/vitals-scorer";
import SafetyChecker from "@/pages/safety-checker";
import InteractionsChecker from "@/pages/interactions-checker";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/drugs" component={DrugSearch} />
        <Route path="/dose" component={DoseCalculator} />
        <Route path="/drip" component={DripCalculator} />
        <Route path="/vitals" component={VitalsScorer} />
        <Route path="/safety" component={SafetyChecker} />
        <Route path="/interactions" component={InteractionsChecker} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
