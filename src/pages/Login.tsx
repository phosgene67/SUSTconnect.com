import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { APP_NAME, UNIVERSITY_EMAIL_DOMAIN } from '@/lib/constants';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [lastEmail, setLastEmail] = useState('');
  const { toast } = useToast();
  const { signIn, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleResendVerification = async () => {
    if (!lastEmail) return;
    
    setIsResending(true);
    try {
      const { error } = await resendVerificationEmail(lastEmail);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox and spam folder.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send verification email.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setShowVerificationMessage(false);
    setLastEmail(data.email);
    
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        // Check for email not confirmed error
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('Invalid login credentials')) {
          // Show verification message for any login failure since Supabase returns generic error
          setShowVerificationMessage(true);
          toast({
            title: 'Login failed',
            description: 'Please check your credentials or verify your email address.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Login failed',
            description: error.message,
            variant: 'destructive',
          });
        }
        return;
      }
      
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      navigate('/feed');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6">
      <div className="w-full max-w-md">
        {/* Logo and branding - Facebook/Reddit style */}
        <div className="text-center mb-4">
          <img 
            src={logo} 
            alt={APP_NAME} 
            className="h-24 sm:h-28 md:h-32 w-auto mx-auto mb-2 object-contain"
          />
          <p className="text-muted-foreground text-sm">
            Your private academic community
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in with your university email
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {showVerificationMessage && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <p className="font-medium">Haven't verified your email yet?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Check your inbox for a verification link, or click below to resend it.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleResendVerification}
                      disabled={isResending}
                    >
                      {isResending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      Resend verification email
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">University Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={`you${UNIVERSITY_EMAIL_DOMAIN}`}
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Create account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* University notice */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          This platform is exclusively for SUST students. Only {UNIVERSITY_EMAIL_DOMAIN} emails are accepted.
        </p>
      </div>
    </div>
  );
}
