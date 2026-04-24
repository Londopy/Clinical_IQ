import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

// Pages
import DrugSearch from "@/pages/drug-search";
import DoseCalculator from "@/pages/dose-calculator";
import DripCalculator from "@/pages/drip-calculator";
import VitalsScorer from "@/pages/vitals-scorer";
import SafetyChecker from "@/pages/safety-checker";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={DrugSearch} />
        <Route path="/dose" component={DoseCalculator} />
        <Route path="/drip" component={DripCalculator} />
        <Route path="/vitals" component={VitalsScorer} />
        <Route path="/safety" component={SafetyChecker} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
