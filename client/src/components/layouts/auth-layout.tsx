import { ReactNode } from "react";
import { Link } from "wouter";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {/* App Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/images/logo-rbg-horizontal-positivo.png" 
              alt="RBG Logo" 
              className="h-12 w-auto"
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {description || "Sistema de gerenciamento RBG"}
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-center text-gray-900">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}
