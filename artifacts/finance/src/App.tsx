import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth, ClerkLoaded, ClerkLoading } from "@clerk/react";
import { useEffect, useMemo } from "react";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import SignInPage from "@/pages/SignInPage";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Budgets from "@/pages/Budgets";
import Goals from "@/pages/Goals";
import Insights from "@/pages/Insights";
import Reports from "@/pages/Reports";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

setBaseUrl("/api");

function ApiAuthBridge() {
  const { getToken, isSignedIn } = useAuth();
  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
    return () => setAuthTokenGetter(null);
  }, [isSignedIn, getToken]);
  return null;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/budgets" component={Budgets} />
      <Route path="/goals" component={Goals} />
      <Route path="/insights" component={Insights} />
      <Route path="/reports" component={Reports} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const base = useMemo(() => import.meta.env.BASE_URL.replace(/\/$/, ""), []);
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!isSignedIn) {
    return <SignInPage />;
  }
  return (
    <>
      <ApiAuthBridge />
      <WouterRouter base={base}>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </WouterRouter>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ClerkLoading>
          <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <AuthGate />
        </ClerkLoaded>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
