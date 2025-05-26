import { useState } from "react";
import { TwoColumnAuthLayout } from "@/components/layouts/two-column-auth-layout";
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
        <title>Redefinir Senha - RBG</title>
        <meta name="description" content="Redefina sua senha da conta RBG com um link seguro enviado para o seu e-mail." />
      </Helmet>
      <TwoColumnAuthLayout 
        title={resetEmailSent ? "E-mail enviado!" : "Redefinir senha"}
        description={resetEmailSent 
          ? "Verifique sua caixa de entrada para redefinir sua senha." 
          : "Digite seu e-mail para receber um link de redefinição de senha."}
      >
        {resetEmailSent ? (
          <PasswordResetMessage />
        ) : (
          <ForgotPasswordForm onResetSuccess={handleResetSuccess} />
        )}
      </TwoColumnAuthLayout>
    </>
  );
}
