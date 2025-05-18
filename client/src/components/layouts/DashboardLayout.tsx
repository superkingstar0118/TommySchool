import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/ui/role-badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getInitials } from "@/lib/utils/formatUtils";

// Icons
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  LineChart, 
  School, 
  Settings,
  LogOut,
  Menu,
  User,
  ClipboardList,
  Building,
  Download
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

const DashboardLayout = ({ children, pageTitle }: DashboardLayoutProps) => {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // If no user is authenticated, redirect to login
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);
  
  if (!user) {
    return null; // Don't render anything while redirecting
  }
  
  // Define navigation items based on role
  const getNavItems = (role: string): NavItem[] => {
    switch (role) {
      case "assessor":
        return [
          { href: "/assessor/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { href: "/assessor/assessment", label: "Assessments", icon: <FileText className="h-5 w-5" /> },
          { href: "/assessor/classes", label: "My Classes", icon: <Users className="h-5 w-5" /> },
          { href: "/assessor/results", label: "Results", icon: <LineChart className="h-5 w-5" /> },
        ];
      case "student":
        return [
          { href: "/student/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { href: "/student/feedback", label: "Feedback Portfolio", icon: <FileText className="h-5 w-5" /> },
          { href: "/student/results", label: "Assessment Results", icon: <LineChart className="h-5 w-5" /> },
        ];
      case "admin":
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { href: "/admin/schools", label: "Schools", icon: <Building className="h-5 w-5" /> },
          { href: "/admin/classes", label: "Classes", icon: <School className="h-5 w-5" /> },
          { href: "/admin/students", label: "Students", icon: <Users className="h-5 w-5" /> },
          { href: "/admin/assessors", label: "Assessors", icon: <User className="h-5 w-5" /> },
          { href: "/admin/rubrics", label: "Rubrics", icon: <ClipboardList className="h-5 w-5" /> },
          { href: "/admin/reports", label: "Reports", icon: <Download className="h-5 w-5" /> },
        ];
      default:
        return [];
    }
  };
  
  const navItems = getNavItems(user.role);
  
  // Get primary color based on role
  const getPrimaryColor = (role: string): string => {
    switch (role) {
      case "assessor":
        return "bg-blue-600";
      case "student":
        return "bg-green-600";
      case "admin":
        return "bg-purple-600";
      default:
        return "bg-gray-600";
    }
  };
  
  const primaryColor = getPrimaryColor(user.role);
  
  const handleLogout = () => {
    logout();
    setLocation("/login");
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-800 text-white">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <span className={`text-${user.role === 'assessor' ? 'blue' : user.role === 'student' ? 'green' : 'purple'}-600 font-bold`}>
                FA
              </span>
            </div>
            <div>
              <h2 className="font-bold text-sm">Feedback & Assessment</h2>
              <div className="flex items-center mt-1">
                <RoleBadge role={user.role as any} />
              </div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 pt-4 pb-4 overflow-y-auto">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu
          </div>
          <div className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm rounded-md ${
                  location === item.href
                    ? `bg-gray-900 text-white`
                    : `text-gray-300 hover:bg-gray-700 hover:text-white`
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </div>
          
          <div className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Account
          </div>
          <div className="space-y-1 px-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gray-600">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.fullName}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Mobile navigation */}
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-gray-800">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <span className={`text-${user.role === 'assessor' ? 'blue' : user.role === 'student' ? 'green' : 'purple'}-600 font-bold`}>
                  FA
                </span>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Feedback & Assessment</h2>
                <div className="flex items-center mt-1">
                  <RoleBadge role={user.role as any} />
                </div>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 pt-4 pb-4">
            <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Menu
            </div>
            <div className="space-y-1 px-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm rounded-md ${
                    location === item.href
                      ? `bg-gray-900 text-white`
                      : `text-gray-300 hover:bg-gray-700 hover:text-white`
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              ))}
            </div>
            
            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Account
            </div>
            <div className="space-y-1 px-2">
              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Logout</span>
              </button>
            </div>
          </nav>
          
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gray-600">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top nav */}
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setIsMobileNavOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open navigation</span>
                </Button>
                <h1 className="text-xl font-bold text-gray-800 ml-2 md:ml-0">{pageTitle}</h1>
              </div>
              <div className="flex items-center">
                <Avatar className="h-8 w-8 md:hidden">
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
