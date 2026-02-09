import { MainLayout, MobileNav } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Mail, 
  Shield, 
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleThemeChange = async (checked: boolean) => {
    const nextTheme = checked ? 'dark' : 'light';
    setTheme(nextTheme);

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ theme_preference: nextTheme })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save theme preference', variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to view settings</p>
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Settings
        </h1>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Department: {profile?.department}</p>
              <p>Batch: {profile?.batch}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Message Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified for new messages</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Comment Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified for comments on your posts</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>Control your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Email</Label>
                <p className="text-sm text-muted-foreground">Allow others to see your email</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">Make profile visible to everyone</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Online Status</Label>
                <p className="text-sm text-muted-foreground">Let others see when you're online</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={handleThemeChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <MobileNav />
    </MainLayout>
  );
}
