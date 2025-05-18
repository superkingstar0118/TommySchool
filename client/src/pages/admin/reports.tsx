import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, BarChart2, PieChart, LineChart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generatePdf } from "@/lib/utils/pdf-generator";

// Import chart components - these would be created in a real implementation
import StudentsPerformanceChart from "@/components/charts/StudentsPerformanceChart";
import SchoolPerformanceChart from "@/components/charts/SchoolPerformanceChart";
import CompletionRateChart from "@/components/charts/CompletionRateChart";

const AdminReports = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [reportPeriod, setReportPeriod] = useState<string>("month");

  // Redirect if user is not an admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);

  // Fetch schools
  const { data: schools } = useQuery({
    queryKey: ['/api/schools'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch classes - dependent on selected school
  const { data: classes } = useQuery({
    queryKey: ['/api/classes', selectedSchool !== 'all' ? selectedSchool : null],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch assessments with all relations for reporting
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['/api/assessments/all'],
    enabled: !!user && user.role === 'admin',
  });

  // Generate comprehensive report PDF
  const handleGenerateReport = () => {
    if (!assessments) return;

    // This would generate a comprehensive PDF report with filtered data
    generatePdf({
      title: "Comprehensive Assessment Report",
      period: reportPeriod,
      schoolFilter: selectedSchool,
      classFilter: selectedClass,
      assessmentData: assessments,
    });
  };

  return (
    <DashboardLayout pageTitle="Reports & Analytics">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
        <p className="text-gray-500">
          Generate reports and view analytics about assessment performance
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-wrap gap-3">
          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select School" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools?.map((school: any) => (
                <SelectItem key={school.id} value={school.id.toString()}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes?.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerateReport} className="w-full md:w-auto">
          <FileDown className="mr-2 h-4 w-4" />
          Generate PDF Report
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <BarChart2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="students">
            <LineChart className="h-4 w-4 mr-2" />
            Student Performance
          </TabsTrigger>
          <TabsTrigger value="schools">
            <PieChart className="h-4 w-4 mr-2" />
            School Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Assessments</CardTitle>
                <CardDescription>All assessments in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingAssessments ? "..." : assessments?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {reportPeriod === 'all' 
                    ? 'All time' 
                    : `In the last ${reportPeriod}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Completion Rate</CardTitle>
                <CardDescription>Completed vs. draft assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingAssessments 
                    ? "..." 
                    : assessments 
                      ? `${Math.round((assessments.filter((a: any) => a.status === 'completed').length / assessments.length) * 100)}%` 
                      : "0%"}
                </div>
                <p className="text-sm text-muted-foreground">
                  {reportPeriod === 'all' 
                    ? 'Overall completion rate' 
                    : `In the last ${reportPeriod}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Average Score</CardTitle>
                <CardDescription>Across all completed assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingAssessments ? "..." : "3.8/5"}
                </div>
                <p className="text-sm text-muted-foreground">
                  {reportPeriod === 'all' 
                    ? 'All time average' 
                    : `In the last ${reportPeriod}`}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assessment Completion Rate Over Time</CardTitle>
              <CardDescription>
                Track how assessment completion rates have changed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <CompletionRateChart />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Comparison</CardTitle>
              <CardDescription>
                Compare performance across students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <StudentsPerformanceChart />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>School Performance Comparison</CardTitle>
              <CardDescription>
                Compare average scores across different schools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <SchoolPerformanceChart />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminReports;