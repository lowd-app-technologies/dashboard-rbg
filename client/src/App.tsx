import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

// Protected Route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? <Component {...rest} /> : null;
}

// Auth Route component for redirecting authenticated users
function AuthRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return !user ? <Component {...rest} /> : null;
}

// Import additional pages
import CompanyProfile from "@/pages/company-profile";
import Services from "@/pages/services";
import ServicePage from "@/pages/service";
import JobOffers from "@/pages/job-offers";
import JobOfferPage from "@/pages/job-offer";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/login" component={() => <AuthRoute component={Login} />} />
      <Route path="/register" component={() => <AuthRoute component={Register} />} />
      <Route path="/forgot-password" component={() => <AuthRoute component={ForgotPassword} />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      
      {/* Company management */}
      <Route path="/company-profile" component={() => <ProtectedRoute component={CompanyProfile} />} />
      
      {/* Services management */}
      <Route path="/services" component={() => <ProtectedRoute component={Services} />} />
      <Route path="/service/:id" component={() => <ProtectedRoute component={ServicePage} />} />
      
      {/* Job offers management */}
      <Route path="/job-offers" component={() => <ProtectedRoute component={JobOffers} />} />
      <Route path="/job-offer/:id" component={() => <ProtectedRoute component={JobOfferPage} />} />
      
      {/* Default route */}
      <Route path="/" component={() => <AuthRoute component={Login} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
