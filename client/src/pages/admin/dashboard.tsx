import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building,
  Users,
  User,
  FileText,
  BarChart2,
  School,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatDate } from "@/lib/utils/format-data";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if user is not an admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);

  // Fetch admin dashboard data
  const { data: schools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ['/api/schools'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/classes'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: assessors, isLoading: isLoadingAssessors } = useQuery({
    queryKey: ['/api/assessors'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['/api/assessments'],
    enabled: !!user && user.role === 'admin',
  });

  // Sample data for charts - in a real app, this would be derived from actual assessments
  const activityByMonthData = [
    { name: "Jan", assessments: 65 },
    { name: "Feb", assessments: 85 },
    { name: "Mar", assessments: 110 },
    { name: "Apr", assessments: 90 },
    { name: "May", assessments: 120 },
    { name: "Jun", assessments: 95 },
  ];

  const schoolDistributionData = [
    { name: "Westside High School", value: 45 },
    { name: "Eastside Academy", value: 30 },
    { name: "North Central", value: 25 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <DashboardLayout pageTitle="Admin Dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">
          System overview and analytics
        </p>
      </div>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Schools"
          value={schools?.length || "0"}
          icon={Building}
          colorClass="bg-purple-500"
          linkText="Manage Schools"
          linkHref="/admin/schools"
        />

        <StatCard
          title="Total Classes"
          value={classes?.length || "0"}
          icon={School}
          colorClass="bg-indigo-500"
          linkText="Manage Classes"
          linkHref="/admin/classes"
        />

        <StatCard
          title="Total Students"
          value={students?.length || "0"}
          icon={Users}
          colorClass="bg-blue-500"
          linkText="Manage Students"
          linkHref="/admin/students"
        />

        <StatCard
          title="Assessments"
          value={assessments?.length || "0"}
          icon={FileText}
          colorClass="bg-green-500"
          linkText="View Reports"
          linkHref="/admin/reports"
        />
      </div>

      {/* Analytics Dashboard */}
      <div className="mb-8">
        <Card className="overflow-hidden">
          <CardHeader className="bg-purple-50">
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>
              Key metrics and performance indicators
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Assessment Activity by Month</h3>
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={activityByMonthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="assessments" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-3">Distribution of Assessments by School</h3>
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={schoolDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {schoolDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activity across all users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAssessments ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          ) : assessments?.length === 0 ? (
            <div className="text-center p-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No recent activity</h3>
              <p className="text-gray-500">Activity will appear here as users interact with the system</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(assessments || []).slice(0, 5).map((assessment: any) => (
                <div key={assessment.id} className="flex items-start p-3 rounded-lg border hover:bg-gray-50">
                  <div className="flex-shrink-0 mr-3">
                    <span className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <FileText className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {assessment.assessor.user.fullName} assessed {assessment.student.user.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Task: {assessment.task.name} • Score: {assessment.totalScore}/25
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <span className="text-xs text-gray-500">{formatDate(assessment.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;
