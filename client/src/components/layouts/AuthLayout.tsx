import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  footerContent?: React.ReactNode;
}

const AuthLayout = ({ 
  children, 
  title, 
  description, 
  footerContent 
}: AuthLayoutProps) => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Use useEffect for navigation to prevent state updates during render
  useEffect(() => {
    // If user is already authenticated, redirect to appropriate dashboard
    if (user) {
      const dashboardUrl = `/${user.role}`;
      if (location !== dashboardUrl) {
        setLocation(dashboardUrl);
      }
    }
  }, [user, location, setLocation]);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">FA</span>
              </div>
            </div>
            <CardTitle className="text-2xl text-center">{title}</CardTitle>
            {description && <CardDescription className="text-center">{description}</CardDescription>}
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
          {footerContent && (
            <CardFooter>
              {footerContent}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuthLayout;
