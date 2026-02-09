import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Feed from "./pages/Feed";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Announcements from "./pages/Announcements";
import Korums from "./pages/Korums";
import KorumDetail from "./pages/KorumDetail";
import Messages from "./pages/Messages";
import CreatePost from "./pages/CreatePost";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ThemeSync = () => {
  const { profile } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!profile?.theme_preference) return;
    setTheme(profile.theme_preference);
  }, [profile?.theme_preference, setTheme]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ThemeSync />
            <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Main App Routes */}
            <Route path="/feed" element={<Feed />} />
            <Route path="/post/:postId" element={<PostDetail />} />
            <Route path="/korums" element={<Korums />} />
            <Route path="/korums/:korumId" element={<KorumDetail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/search" element={<Feed />} />
            <Route path="/create-post" element={<CreatePost />} />
            
            {/* Redirect root to feed */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
