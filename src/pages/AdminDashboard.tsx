import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { MainLayout } from '@/components/layout';
import { RoleBadge } from '@/components/RoleBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Shield, Ban, CheckCircle, Edit2, Eye } from 'lucide-react';

interface User {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  department: string;
  batch: string;
  user_type: 'student' | 'teacher' | 'alumni' | 'developer';
  status: 'active' | 'banned' | 'restricted';
  banned_at: string | null;
  ban_reason: string | null;
  restrictions: string | number | boolean | null | Record<string, string | number | boolean | null>;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned' | 'restricted'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'change-type'>('ban');
  const [banReason, setBanReason] = useState('');
  const [newUserType, setNewUserType] = useState<'student' | 'teacher' | 'alumni' | 'developer'>('student');

  // Check if user is developer
  useEffect(() => {
    console.log('AdminDashboard - User:', user?.email);
    console.log('AdminDashboard - Profile:', profile);
    console.log('AdminDashboard - User Type:', profile?.user_type);
    
    // Wait for profile to load before checking
    if (!user || profile === undefined) return;
    
    // If profile is null after loading, user not found
    if (profile === null) {
      toast({
        title: 'Error',
        description: 'Profile not found',
        variant: 'destructive',
      });
      window.location.href = '/';
      return;
    }

    // Check if user is developer
    if (profile.user_type !== 'developer') {
      console.warn('Access denied - not a developer. User type:', profile.user_type);
      toast({
        title: 'Access Denied',
        description: 'Only developers can access this page',
        variant: 'destructive',
      });
      window.location.href = '/';
    }
  }, [user, profile]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_all_users', {
          p_user_id: user.id,
        });

        if (error) throw error;

        setUsers((data as User[]) || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const handleBanUser = async () => {
    if (!user || !selectedUser) return;

    try {
      const { error } = await supabase.rpc('ban_user', {
        p_admin_id: user.id,
        p_target_user_id: selectedUser.user_id,
        p_reason: banReason,
      });

      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.user_id === selectedUser.user_id
            ? {
                ...u,
                status: 'banned',
                banned_at: new Date().toISOString(),
                ban_reason: banReason,
              }
            : u
        )
      );

      toast({
        title: 'Success',
        description: `${selectedUser.full_name} has been banned`,
      });

      setIsActionDialogOpen(false);
      setBanReason('');
    } catch (err) {
      console.error('Error banning user:', err);
      toast({
        title: 'Error',
        description: 'Failed to ban user',
        variant: 'destructive',
      });
    }
  };

  const handleUnbanUser = async () => {
    if (!user || !selectedUser) return;

    try {
      const { error } = await supabase.rpc('unban_user', {
        p_admin_id: user.id,
        p_target_user_id: selectedUser.user_id,
      });

      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.user_id === selectedUser.user_id
            ? {
                ...u,
                status: 'active',
                banned_at: null,
                ban_reason: null,
              }
            : u
        )
      );

      toast({
        title: 'Success',
        description: `${selectedUser.full_name} has been unbanned`,
      });

      setIsActionDialogOpen(false);
    } catch (err) {
      console.error('Error unbanning user:', err);
      toast({
        title: 'Error',
        description: 'Failed to unban user',
        variant: 'destructive',
      });
    }
  };

  const handleChangeUserType = async () => {
    if (!user || !selectedUser) return;

    try {
      const { error } = await supabase.rpc('update_user_type', {
        p_admin_id: user.id,
        p_target_user_id: selectedUser.user_id,
        p_user_type: newUserType,
      });

      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.user_id === selectedUser.user_id
            ? { ...u, user_type: newUserType }
            : u
        )
      );

      toast({
        title: 'Success',
        description: `${selectedUser.full_name}'s role updated to ${newUserType}`,
      });

      setIsActionDialogOpen(false);
    } catch (err) {
      console.error('Error updating user type:', err);
      toast({
        title: 'Error',
        description: 'Failed to update user type',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || u.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: 'active' | 'banned' | 'restricted') => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      banned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      restricted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };

    return (
      <Badge className={`${styles[status]} capitalize`}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Loading users...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <Input
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'active' | 'banned' | 'restricted')}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.avatar_url || ''} />
                            <AvatarFallback>
                              {u.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>{u.department}</TableCell>
                      <TableCell>
                        <RoleBadge userType={u.user_type} />
                      </TableCell>
                      <TableCell>{getStatusBadge(u.status)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(u.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isActionDialogOpen && selectedUser?.user_id === u.user_id} onOpenChange={setIsActionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(u)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage User: {selectedUser?.full_name}</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Change User Type */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Change Role</label>
                                <Select
                                  value={newUserType}
                                  onValueChange={(v) =>
                                    setNewUserType(v as 'student' | 'teacher' | 'alumni' | 'developer')
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="alumni">Alumni</SelectItem>
                                    <SelectItem value="developer">Developer</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    setActionType('change-type');
                                    handleChangeUserType();
                                  }}
                                >
                                  Update Role
                                </Button>
                              </div>

                              {/* Ban/Unban Section */}
                              <div className="border-t pt-4 space-y-2">
                                <label className="text-sm font-medium">
                                  Account Status
                                </label>
                                {selectedUser?.status === 'active' ? (
                                  <>
                                    <Textarea
                                      placeholder="Reason for ban..."
                                      value={banReason}
                                      onChange={(e) => setBanReason(e.target.value)}
                                    />
                                    <Button
                                      variant="destructive"
                                      className="w-full"
                                      onClick={() => {
                                        setActionType('ban');
                                        handleBanUser();
                                      }}
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Ban User
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                      setActionType('unban');
                                      handleUnbanUser();
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Unban User
                                  </Button>
                                )}
                              </div>

                              {selectedUser?.ban_reason && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                  <p className="text-sm font-medium">Ban Reason:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedUser.ban_reason}
                                  </p>
                                  {selectedUser.banned_at && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Banned on {format(new Date(selectedUser.banned_at), 'PPP p')}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found</p>
              </div>
            )}

            <div className="text-sm text-gray-500 pt-4 border-t">
              Total Users: {users.length} | Showing: {filteredUsers.length}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
