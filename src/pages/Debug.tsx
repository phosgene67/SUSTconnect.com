import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const { user, profile, refreshProfile } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">Debug Info</h1>

        <Card>
          <CardHeader>
            <CardTitle>User Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">Email:</p>
              <p className="text-gray-600">{user?.email || 'Not logged in'}</p>
            </div>
            <div>
              <p className="font-semibold">User ID:</p>
              <p className="text-gray-600 font-mono text-sm">{user?.id || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">Full Name:</p>
              <p className="text-gray-600">{profile?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">User Type:</p>
              <p className="text-gray-600 font-mono">{profile?.user_type || 'NOT SET'}</p>
            </div>
            <div>
              <p className="font-semibold">Status:</p>
              <p className="text-gray-600">{profile?.status || 'active'}</p>
            </div>
            <div>
              <p className="font-semibold">Department:</p>
              <p className="text-gray-600">{profile?.department || 'N/A'}</p>
            </div>

            <Button onClick={() => refreshProfile()}>
              Refresh Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Full Profile Data (JSON)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
