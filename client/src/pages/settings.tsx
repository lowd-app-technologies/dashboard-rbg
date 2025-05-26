import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FaGoogle, FaGithub, FaTwitter } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Helmet } from 'react-helmet';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, {
      message: "Current password is required",
    }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function Settings() {
  const { user, logout } = useAuth();
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [isAccountDeleting, setIsAccountDeleting] = useState(false);
  
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsPasswordChanging(true);
    try {
      // This would be implemented with Firebase Auth
      console.log("Changing password:", data);
      
      // Reset form
      form.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setIsAccountDeleting(true);
      try {
        // This would be implemented with Firebase Auth
        console.log("Deleting account");
        
        // Logout after account deletion
        await logout();
      } catch (error) {
        console.error("Account deletion error:", error);
        setIsAccountDeleting(false);
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Account Settings - Systems RBG</title>
        <meta name="description" content="Manage your Systems RBG account settings, security options, and linked accounts." />
      </Helmet>
      <DashboardLayout title="Account Settings" contentId="settings-content">
        {/* Password Change Form */}
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Update your password associated with your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters with a number and special character
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isPasswordChanging}>
                  {isPasswordChanging ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* MFA Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Two-factor authentication</CardTitle>
            <CardDescription>
              Add additional security to your account using two-factor authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => alert("This feature would be implemented with Firebase Auth")}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Enable two-factor authentication
            </Button>
          </CardContent>
        </Card>
        
        {/* Linked Accounts */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Linked accounts</CardTitle>
            <CardDescription>
              Connect your account with third-party services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <FaGoogle className="text-red-500 text-xl" />
                  <span className="ml-3 text-sm font-medium text-gray-900">Google</span>
                </div>
                <Badge variant="primary">Connected</Badge>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <FaGithub className="text-gray-800 text-xl" />
                  <span className="ml-3 text-sm font-medium text-gray-900">GitHub</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  onClick={() => alert("This feature would be implemented with Firebase Auth")}
                >
                  Connect
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <FaTwitter className="text-blue-400 text-xl" />
                  <span className="ml-3 text-sm font-medium text-gray-900">Twitter</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  onClick={() => alert("This feature would be implemented with Firebase Auth")}
                >
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Delete Account Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Delete account</CardTitle>
            <CardDescription>
              Permanently delete your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This action is irreversible and will permanently delete all your data.
              </AlertDescription>
            </Alert>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isAccountDeleting}
            >
              {isAccountDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete account</>
              )}
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    </>
  );
}
