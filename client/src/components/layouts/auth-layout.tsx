import { ReactNode } from "react";
import { Link } from "wouter";
import { Lock } from "lucide-react";

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
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center">
            <Lock className="mr-2 h-6 w-6 text-primary" />
            NextAuth
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {description || "Secure authentication for your Next.js app"}
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
