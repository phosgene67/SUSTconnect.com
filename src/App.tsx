import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Main App Routes */}
            <Route path="/feed" element={<Feed />} />
            
            {/* Redirect root to feed */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            
            {/* Placeholder routes - will be implemented */}
            <Route path="/korums" element={<Feed />} />
            <Route path="/messages" element={<Feed />} />
            <Route path="/announcements" element={<Feed />} />
            <Route path="/notifications" element={<Feed />} />
            <Route path="/profile" element={<Feed />} />
            <Route path="/settings" element={<Feed />} />
            <Route path="/search" element={<Feed />} />
            <Route path="/create-post" element={<Feed />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
