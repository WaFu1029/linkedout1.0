import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Wall from "./pages/Wall";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { useEffect, useRef } from "react";

const queryClient = new QueryClient();

// Component to track navigation for Index page animation
const NavigationTracker = () => {
  const location = useLocation();
  const prevPathnameRef = useRef<string | null>(null);
  
  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathnameRef.current;
    
    // If we navigated FROM another page TO index, keep previousPath so Index can detect navigation
    if (prevPath && prevPath !== '/' && currentPath === '/') {
      // Keep previousPath - Index will check and clear it
      prevPathnameRef.current = currentPath;
      return;
    }
    
    // If we're on a non-index page, store it as previousPath
    if (currentPath !== '/') {
      sessionStorage.setItem('previousPath', currentPath);
    }
    
    prevPathnameRef.current = currentPath;
  }, [location.pathname]);
  
  return null;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NavigationTracker />
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/wall" element={<Wall />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
