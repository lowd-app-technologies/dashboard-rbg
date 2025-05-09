import { useState } from "react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PasswordResetMessage } from "@/components/auth/password-reset-message";
import { Helmet } from 'react-helmet';

export default function ForgotPassword() {
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleResetSuccess = () => {
    setResetEmailSent(true);
  };

  return (
    <>
      <Helmet>
        <title>Reset Password - NextAuth</title>
        <meta name="description" content="Reset your NextAuth account password with a secure reset link sent to your email." />
      </Helmet>
      <AuthLayout title="Reset your password">
        {resetEmailSent ? (
          <PasswordResetMessage />
        ) : (
          <ForgotPasswordForm onResetSuccess={handleResetSuccess} />
        )}
      </AuthLayout>
    </>
  );
}
