

# Plan: Fix Login Credentials Issue with Email Verification Flow

## Problem Summary
Users who registered but haven't verified their email (or whose verification link expired) receive a confusing "Invalid login credentials" error instead of being told their email isn't verified. There's also no way to resend the verification email.

## Solution Overview
1. Add a "Resend verification email" feature
2. Improve error handling to detect unverified emails
3. Create a forgot password page (link exists but page is missing)
4. Show clearer, more helpful error messages

## Implementation Steps

### Step 1: Add Resend Verification Email Function
Update `AuthContext.tsx` to include a `resendVerificationEmail` function using Supabase's `resend` API.

### Step 2: Update Login Page Error Handling
Modify `Login.tsx` to:
- Detect when login fails due to unverified email
- Show a helpful message with option to resend verification
- Add a "Resend verification email" button that appears after failed login attempts

### Step 3: Create Forgot Password Page
Create `src/pages/ForgotPassword.tsx` with:
- Email input field (validated for university domain)
- Send password reset email functionality
- Success/error feedback

### Step 4: Add Reset Password Route
Update `App.tsx` to add the `/forgot-password` route.

### Step 5: Improve Error Messages
- Show "Please verify your email first" when appropriate
- Provide actionable next steps for users
- Add toast notifications with resend options

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/contexts/AuthContext.tsx` | Add `resendVerificationEmail` and `resetPassword` functions |
| `src/pages/Login.tsx` | Add resend verification option, improve error handling |
| `src/pages/ForgotPassword.tsx` | Create new page |
| `src/App.tsx` | Add forgot password route |

## Technical Details

### Resend Verification Implementation
```typescript
const resendVerificationEmail = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  return { error };
};
```

### Password Reset Implementation
```typescript
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error };
};
```

## User Experience Flow

```text
Login Failed (unverified email)
         |
         v
+---------------------------+
| "Email not verified"      |
| [Resend Verification]     |
+---------------------------+
         |
         v
Email sent -> User verifies -> Login works
```

## Expected Outcome
- Users will understand why login fails (email not verified)
- Users can easily resend verification emails
- Users can reset forgotten passwords
- Clearer, more actionable error messages

