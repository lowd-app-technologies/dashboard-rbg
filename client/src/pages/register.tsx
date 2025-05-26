import { TwoColumnAuthLayout } from "@/components/layouts/two-column-auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { Helmet } from 'react-helmet';

export default function Register() {
  return (
    <>
      <Helmet>
        <title>Criar Conta - RBG</title>
        <meta name="description" content="Crie sua conta RBG para começar a gerenciar seus negócios e projetos de forma eficiente." />
      </Helmet>
      <TwoColumnAuthLayout 
        title="Crie sua conta"
        description="Preencha os dados abaixo para criar sua conta e começar a usar nossa plataforma."
      >
        <RegisterForm />
      </TwoColumnAuthLayout>
    </>
  );
}
