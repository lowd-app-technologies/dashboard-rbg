import { AuthLayout } from "@/components/layouts/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Helmet } from 'react-helmet';

export default function Login() {
  return (
    <>
      <Helmet>
        <title>Sign In - NextAuth</title>
        <meta name="description" content="Sign in to your NextAuth account to access your dashboard and settings." />
      </Helmet>
      <AuthLayout title="Sign in to your account">
        <LoginForm />
      </AuthLayout>
    </>
  );
}
