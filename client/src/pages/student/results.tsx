import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ResultsTable from "@/components/tables/ResultsTable";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format-data";
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
} from "recharts";

const StudentResults = () => {
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
  
  // Get completed assessments only
  const completedAssessments = assessments?.filter((assessment: any) => 
    assessment.status === 'completed'
  ) || [];
  
  // Prepare data for score distribution chart
  const scoreDistributionData = completedAssessments.length > 0
    ? [
        { name: "0-20%", count: 0 },
        { name: "21-40%", count: 0 },
        { name: "41-60%", count: 0 },
        { name: "61-80%", count: 0 },
        { name: "81-100%", count: 0 },
      ]
    : [];
  
  // Count assessments in each score range
  completedAssessments.forEach((assessment: any) => {
    const percentageScore = (assessment.totalScore / 25) * 100;
    if (percentageScore <= 20) {
      scoreDistributionData[0].count++;
    } else if (percentageScore <= 40) {
      scoreDistributionData[1].count++;
    } else if (percentageScore <= 60) {
      scoreDistributionData[2].count++;
    } else if (percentageScore <= 80) {
      scoreDistributionData[3].count++;
    } else {
      scoreDistributionData[4].count++;
    }
  });
  
  // Prepare data for progress over time chart
  const progressChartData = completedAssessments
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((assessment: any) => ({
      date: formatDate(assessment.createdAt),
      score: (assessment.totalScore / 25) * 100,
      name: assessment.task.name,
    }));
  
  // Generate criteria columns for results table
  const criteriaColumns = completedAssessments.length > 0
    ? Object.keys(completedAssessments[0]?.task?.rubricTemplate?.criteria || {}).map((key) => {
        const criterion = completedAssessments[0].task.rubricTemplate.criteria[key];
        return {
          id: criterion.id.toString(),
          name: criterion.name,
          maxScore: 5 // All criteria are scored from 1-5
        };
      })
    : [];
  
  return (
    <DashboardLayout pageTitle="Assessment Results">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Assessment Results</h1>
        <p className="text-gray-500">
          Track your academic progress across all assessments
        </p>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>
              Distribution of your scores across all assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAssessments ? (
              <div className="h-64 w-full bg-gray-100 animate-pulse rounded"></div>
            ) : completedAssessments.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">No assessment data available yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {/* Progress Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
            <CardDescription>
              Your score progression across different assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAssessments ? (
              <div className="h-64 w-full bg-gray-100 animate-pulse rounded"></div>
            ) : completedAssessments.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">No assessment data available yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    name="Score (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Results Table */}
      <ResultsTable
        title="Assessment Results"
        results={completedAssessments}
        isLoading={isLoadingAssessments}
        criteria={criteriaColumns}
        showStudentColumn={false}
        emptyMessage="No assessment results available yet"
      />
    </DashboardLayout>
  );
};

export default StudentResults;
