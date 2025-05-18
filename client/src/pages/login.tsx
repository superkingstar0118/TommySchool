import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import AuthLayout from "@/components/layouts/AuthLayout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the form schema
const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const [, navigate] = useLocation();
  const { login, loading, error } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    const success = await login(data.username, data.password);
    if (success) {
      // Navigate to appropriate dashboard based on user role
      // (the AuthProvider will handle this automatically through useEffect in DashboardLayout)
    }
  };

  // Demo login shortcuts
  const demoLogin = async (role: string) => {
    let username = "";
    let password = "";

    switch (role) {
      case "assessor":
        username = "assessor";
        password = "assessor123";
        break;
      case "student":
        username = "student1";
        password = "student123";
        break;
      case "admin":
        username = "admin";
        password = "admin123";
        break;
      default:
        return;
    }

    form.setValue("username", username);
    form.setValue("password", password);
    await login(username, password);
  };

  return (
    <AuthLayout
      title="Feedback & Assessment Platform"
      description="Sign in to your account to access your personalized dashboard"
    >
      <div className="mb-4">
        <img 
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Students working on laptops" 
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>
  
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your username"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium cursor-pointer">
                    Remember me
                  </FormLabel>
                </FormItem>
              )}
            />
            <Button variant="link" className="text-sm px-0" disabled={loading}>
              Forgot password?
            </Button>
          </div>
          
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          
          <div className="mt-4">
            <p className="text-center text-sm text-muted-foreground mb-2">
              Demo login by role:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                onClick={() => demoLogin("assessor")}
                disabled={loading}
              >
                Assessor
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                onClick={() => demoLogin("student")}
                disabled={loading}
              >
                Student
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                onClick={() => demoLogin("admin")}
                disabled={loading}
              >
                Admin
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
};

export default Login;
