import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { formatDate } from "@/lib/utils/format-data";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BarChart, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if user is not a student
  useEffect(() => {
    if (user && user.role !== "student") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);
  
  // Fetch student-specific data
  const studentId = user?.studentId;
  
  // Get assessments for this student
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['/api/students', studentId, 'assessments'],
    queryFn: () => 
      fetch(`/api/students/${studentId}/assessments`)
        .then(res => res.json()),
    enabled: !!studentId,
  });
  
  // Get completed assessments (for feedback portfolio)
  const completedAssessments = assessments?.filter((assessment: any) => 
    assessment.status === 'completed'
  ) || [];
  
  // Calculate statistics
  const totalAssessments = assessments?.length || 0;
  const averageScore = completedAssessments.length > 0
    ? Math.round(completedAssessments.reduce((acc: number, assessment: any) => 
        acc + assessment.totalScore, 0) / completedAssessments.length * 10) / 10
    : 0;
  
  // Find newest assessment feedback
  const latestAssessments = [...(completedAssessments || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  return (
    <DashboardLayout pageTitle="Student Dashboard">
      {/* Welcome section */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0 md:w-1/3">
              {/* Student studying at a desk with an open book */}
              <img 
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Student studying" 
                className="h-48 w-full object-cover md:h-full"
              />
            </div>
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-2">Welcome, {user?.fullName}</h1>
              <p className="text-gray-500 mb-4">
                Track your academic progress and view feedback from your teachers
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-green-50 rounded-lg p-3 flex items-center">
                  <FileText className="text-green-500 h-5 w-5 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Total Assessments</p>
                    <p className="font-medium">{totalAssessments}</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 flex items-center">
                  <BarChart className="text-blue-500 h-5 w-5 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Average Score</p>
                    <p className="font-medium">{averageScore}/5</p>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 flex items-center">
                  <Clock className="text-purple-500 h-5 w-5 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Recent Feedback</p>
                    <p className="font-medium">{latestAssessments.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Feedback */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Feedback</h2>
          <Button
            variant="outline"
            onClick={() => navigate("/student/feedback")}
          >
            View All Feedback
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoadingAssessments ? (
            <>
              <Card className="animate-pulse">
                <CardContent className="p-0 h-[200px]"></CardContent>
              </Card>
              <Card className="animate-pulse">
                <CardContent className="p-0 h-[200px]"></CardContent>
              </Card>
              <Card className="animate-pulse">
                <CardContent className="p-0 h-[200px]"></CardContent>
              </Card>
            </>
          ) : latestAssessments.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No feedback available yet</p>
              </CardContent>
            </Card>
          ) : (
            latestAssessments.map((assessment: any) => (
              <Card key={assessment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="border-b p-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-800">{assessment.task.name}</h3>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-transparent">
                      {Math.round((assessment.totalScore / 25) * 100)}%
                    </Badge>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{formatDate(assessment.createdAt)}</p>
                </div>
                <div className="p-4 flex flex-col">
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Score</span>
                      <span className="font-medium text-gray-900">
                        {assessment.totalScore}/25
                      </span>
                    </div>
                    <Progress value={(assessment.totalScore / 25) * 100} className="h-2" />
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {assessment.feedback || "No additional comments provided."}
                  </p>
                  <div className="mt-auto">
                    {assessment.pdfPath ? (
                      <a 
                        href={assessment.pdfPath} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Full Feedback
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No PDF available</span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Progress Overview */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAssessments ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            ) : completedAssessments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No assessment data available yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedAssessments.slice(0, 5).map((assessment: any) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.task.name}</TableCell>
                      <TableCell>{formatDate(assessment.createdAt)}</TableCell>
                      <TableCell>{assessment.totalScore}/25</TableCell>
                      <TableCell className="w-1/3">
                        <div className="flex items-center">
                          <Progress value={(assessment.totalScore / 25) * 100} className="h-2 mr-2" />
                          <span className="text-sm">{Math.round((assessment.totalScore / 25) * 100)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
