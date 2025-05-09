import { AuthLayout } from "@/components/layouts/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { Helmet } from 'react-helmet';

export default function Register() {
  return (
    <>
      <Helmet>
        <title>Create Account - NextAuth</title>
        <meta name="description" content="Create a new NextAuth account to access secure authentication services." />
      </Helmet>
      <AuthLayout title="Create a new account">
        <RegisterForm />
      </AuthLayout>
    </>
  );
}
