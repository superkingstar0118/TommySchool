import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { formatDate, getScoreBadgeColor, formatRelativeTime } from "@/lib/utils/format-data";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Search, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  LineChart,
  BarChart 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import custom components
import AssessmentResults from "@/components/assessment/AssessmentResults";
import ProgressTracker from "@/components/assessment/ProgressTracker";

const StudentFeedback = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date"); // 'date' or 'score'
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  
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
  
  // Filter and sort assessments
  const filteredAndSortedAssessments = [...(completedAssessments || [])]
    .filter((assessment) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        assessment.task.name.toLowerCase().includes(searchLower) ||
        (assessment.feedback && assessment.feedback.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "score") {
        return b.totalScore - a.totalScore;
      }
      return 0;
    });
  
  // Get selected assessment details
  const selectedAssessment = selectedAssessmentId 
    ? completedAssessments.find(a => a.id === selectedAssessmentId)
    : null;
  
  // Helper to format assessment scores to standard format for our components
  const formatAssessmentForDisplay = (assessment: any) => {
    if (!assessment) return null;
    
    // Extract criterion scores from the JSON data
    const criteriaScores = Object.entries(assessment.scores || {}).map(([id, data]: [string, any]) => ({
      id,
      name: data.name,
      description: data.description,
      score: data.score,
      feedback: data.feedback
    }));
    
    return {
      id: assessment.id,
      studentName: assessment.student.user.fullName,
      taskName: assessment.task.name,
      taskDescription: assessment.task.description,
      assessorName: assessment.assessor.user.fullName,
      date: assessment.createdAt,
      status: assessment.status,
      scores: criteriaScores,
      totalScore: assessment.totalScore,
      feedback: assessment.feedback,
      pdfPath: assessment.pdfPath,
    };
  };
  
  // Format assessments for progress tracker
  const formatAssessmentsForProgressTracker = (assessments: any[]) => {
    return assessments.map(assessment => {
      // Extract criterion scores from the JSON data
      const criteria = Object.entries(assessment.scores || {}).map(([id, data]: [string, any]) => ({
        name: data.name,
        score: data.score,
      }));
      
      return {
        id: assessment.id,
        taskName: assessment.task.name,
        date: assessment.createdAt,
        totalScore: assessment.totalScore,
        status: assessment.status,
        criteria
      };
    });
  };
  
  // Return to list view
  const handleBackToList = () => {
    setSelectedAssessmentId(null);
  };
  
  return (
    <DashboardLayout pageTitle="Feedback Portfolio">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Feedback Portfolio</h1>
        <p className="text-gray-500">
          View and analyze your assessment feedback and track your progress
        </p>
      </div>
      
      <Tabs defaultValue="assessments" className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="assessments">
            <FileText className="h-4 w-4 mr-2" />
            Assessment Feedback
          </TabsTrigger>
          <TabsTrigger value="progress">
            <LineChart className="h-4 w-4 mr-2" />
            Progress Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="assessments" className="pt-4">
          {selectedAssessment ? (
            <div>
              <Button 
                variant="outline" 
                onClick={handleBackToList} 
                className="mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to All Assessments
              </Button>
              
              <AssessmentResults 
                {...formatAssessmentForDisplay(selectedAssessment)}
                role="student"
              />
            </div>
          ) : (
            <>
              {/* Search and filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search feedback..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="w-full md:w-48">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="score">Sort by Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Feedback Portfolio Grid */}
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
                ) : filteredAndSortedAssessments.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="p-12 text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No feedback found</h3>
                      <p className="text-gray-500">
                        {searchQuery 
                          ? "Try adjusting your search query" 
                          : "You haven't received any feedback yet"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAndSortedAssessments.map((assessment) => (
                    <Card 
                      key={assessment.id} 
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedAssessmentId(assessment.id)}
                    >
                      <div className="border-b p-4">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-800">{assessment.task.name}</h3>
                          <Badge variant="outline" className={`${getScoreBadgeColor(assessment.totalScore)} border-transparent`}>
                            {assessment.totalScore.toFixed(1)}/5
                          </Badge>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">{formatDate(assessment.createdAt)}</p>
                      </div>
                      <div className="p-4 flex flex-col h-48">
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Overall Score</span>
                            <span className="font-medium text-gray-900">
                              {assessment.totalScore.toFixed(1)}/5
                            </span>
                          </div>
                          <Progress value={(assessment.totalScore / 5) * 100} className="h-2" />
                        </div>
                        <div className="flex-grow overflow-hidden mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Feedback:</h4>
                          <p className="text-sm text-gray-600 line-clamp-4">
                            {assessment.feedback || "No additional comments provided."}
                          </p>
                        </div>
                        <div className="mt-auto flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            By {assessment.assessor.user.fullName}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-blue-50 text-blue-600"
                          >
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="progress" className="pt-4">
          {completedAssessments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No progress data available</h3>
                <p className="text-gray-500">
                  You need at least one completed assessment to track your progress
                </p>
              </CardContent>
            </Card>
          ) : (
            <ProgressTracker 
              assessments={formatAssessmentsForProgressTracker(completedAssessments)}
              studentName={user?.fullName || "Student"}
            />
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

// Using the utility function imported from format-data.ts

// ChevronLeft icon component
const ChevronLeft = ({ className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

export default StudentFeedback;
