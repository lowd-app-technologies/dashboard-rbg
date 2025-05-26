import { ReactNode } from "react";
import { Link } from "wouter";
import { FaBible } from "react-icons/fa";

interface TwoColumnAuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function TwoColumnAuthLayout({ children, title, description }: TwoColumnAuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Coluna da esquerda com imagem e versículo */}
      <div 
        className="hidden lg:flex flex-col items-center w-1/2 p-12 text-white relative overflow-hidden"
        style={{
          backgroundImage: `url(/assets/images/Projecção_FUNDOS_01.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay escuro para melhor legibilidade */}
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        
        {/* Container centralizado com largura máxima */}
        <div className="w-full max-w-md flex flex-col h-full justify-between">
          <div className="relative z-10">
            <Link href="/" className="flex items-center">
              <img 
                src="/assets/images/logo-rbg-horizontal-positivo.png" 
                alt="RBG Logo" 
                className="h-12 w-auto"
              />
            </Link>
          </div>
          
          <div className="mt-8 space-y-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FaBible className="h-6 w-6 text-yellow-300" />
                <span className="text-sm font-medium text-yellow-300">Provérbios 16:3</span>
              </div>
              <blockquote className="text-2xl font-light leading-relaxed">
                "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos."
              </blockquote>
              <p className="text-blue-100 italic">Bíblia Sagrada - Nova Versão Internacional</p>
            </div>
            
            <div className="mt-12 pt-8 border-t border-blue-500">
              <p className="text-blue-200">
                "O empreendedorismo cristão é uma forma de adoração quando feito com excelência e para a glória de Deus."
              </p>
            </div>
          </div>
          
          <div className="text-sm text-white/80 relative z-10">
            <p>© {new Date().getFullYear()} RBG - Todos os direitos reservados</p>
          </div>
        </div>
      </div>

      {/* Coluna da direita com o formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/assets/images/logo-rbg-horizontal-positivo.png" 
              alt="RBG Logo" 
              className="h-12 w-auto mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            )}
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <img 
                  src="/assets/images/favicon.png" 
                  alt="RBG Favicon" 
                  className="h-16 w-16 mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                {description && (
                  <p className="mt-2 text-sm text-gray-600">{description}</p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
