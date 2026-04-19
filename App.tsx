import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NewReport from "./pages/NewReport";
import MyReports from "./pages/MyReports";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMap from "./pages/admin/MapView";
import AdminOccurrences from "./pages/admin/Occurrences";
import AdminExport from "./pages/admin/Export";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/report" component={NewReport} />
      <Route path="/my-reports" component={MyReports} />

      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/map" component={AdminMap} />
      <Route path="/admin/occurrences" component={AdminOccurrences} />
      <Route path="/admin/export" component={AdminExport} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
