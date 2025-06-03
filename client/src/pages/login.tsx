import { TwoColumnAuthLayout } from "@/components/layouts/two-column-auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Helmet } from 'react-helmet';

export default function Login() {
  return (
    <>
      <Helmet>
        <title>Entrar - RBG</title>
        <meta name="description" content="Acesse sua conta RBG para gerenciar seus negócios, projetos e ofertas de trabalho." />
      </Helmet>
      <TwoColumnAuthLayout 
        title="Bem-vindo de volta!"
        description="A RBG é uma ferramenta de gestão de negócios e serviços para a nossa igreja Reviver. Entre para continuar acessando sua conta e gerenciar seus negócios, serviços e ofertas de trabalho."
      >
        <LoginForm />
      </TwoColumnAuthLayout>
    </>
  );
}
