import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export function PasswordResetMessage() {
  return (
    <div>
      <Alert className="bg-green-50 text-green-800 border-green-100">
        <CheckCircle className="h-5 w-5 text-green-400" />
        <AlertTitle className="text-green-800 font-medium">Password reset email sent</AlertTitle>
        <AlertDescription className="text-green-700 mt-2">
          We've sent you an email with instructions to reset your password. Please check your inbox.
        </AlertDescription>
      </Alert>
      
      <div className="mt-6 text-center">
        <Link href="/login">
          <Button
            variant="link"
            className="font-medium text-primary hover:text-primary/80"
          >
            Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}
