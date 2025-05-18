import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { formatRelativeTime } from "@/lib/utils/format-data";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import AssessmentList from "@/components/dashboard/AssessmentList";
import ClassList from "@/components/dashboard/ClassList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, CheckCircle, Clock } from "lucide-react";

const AssessorDashboard = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if user is not an assessor
  useEffect(() => {
    if (user && user.role !== "assessor") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);
  
  // Fetch assessor-specific data
  const assessorId = user?.assessorId;
  
  // Get pending assessments
  const { data: pendingAssessments, isLoading: isLoadingPending } = useQuery({
    queryKey: ['/api/assessments', { assessorId, status: 'draft' }],
    queryFn: () => 
      fetch(`/api/assessments?assessorId=${assessorId}&status=draft`)
        .then(res => res.json()),
    enabled: !!assessorId,
  });
  
  // Get completed assessments
  const { data: completedAssessments, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ['/api/assessments', { assessorId, status: 'completed' }],
    queryFn: () => 
      fetch(`/api/assessments?assessorId=${assessorId}&status=completed`)
        .then(res => res.json()),
    enabled: !!assessorId,
  });
  
  // Get classes for this assessor
  const { data: assessorClasses, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/assessors', assessorId, 'classes'],
    queryFn: () => 
      fetch(`/api/assessors/${assessorId}/classes`)
        .then(res => res.json()),
    enabled: !!assessorId,
  });
  
  // Process and enrich class data for display
  const classesWithStats = Array.isArray(assessorClasses)
  ? assessorClasses.map((cls: any) => {
    // Calculate completion metrics (this would be based on assessments in a real app)
    // Here we're just generating random values for demonstration
    const completionPercentage = Math.floor(Math.random() * 100);
    
    return {
      ...cls,
      studentCount: Math.floor(Math.random() * 25) + 10, // Random student count
      taskCount: Math.floor(Math.random() * 5) + 1, // Random task count
      completionPercentage,
    };
  }):[];
  
  // Recent assessments (combining both pending and completed, sorted by date)
  const recentAssessments = [...(pendingAssessments || []), ...(completedAssessments || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5); // Only show the 5 most recent
  
  // Handle class selection
  const handleClassSelect = (classId: number) => {
    navigate(`/assessor/classes?id=${classId}`);
  };
  
  return (
    <DashboardLayout pageTitle="Assessor Dashboard">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.fullName}</h1>
        <p className="text-gray-500">
          {pendingAssessments && pendingAssessments.length > 0
            ? `You have ${pendingAssessments.length} assessment${pendingAssessments.length === 1 ? '' : 's'} waiting to be completed`
            : "You have no pending assessments"}
        </p>
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold mb-4 sm:mb-0">Quick Actions</h2>
        <Button 
          onClick={() => navigate("/assessor/assessment")}
          className="flex items-center"
        >
          <FileText className="mr-2 h-4 w-4" />
          New Assessment
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Pending Assessments"
          value={pendingAssessments?.length || "0"}
          icon={Clock}
          description={pendingAssessments?.length ? "Awaiting your review" : "All caught up!"}
          colorClass="bg-blue-500"
          linkText="View all"
          linkHref="/assessor/results?status=draft"
        />
        
        <StatCard
          title="Completed Assessments"
          value={completedAssessments?.length || "0"}
          icon={CheckCircle}
          description="Successfully evaluated"
          colorClass="bg-green-500"
          linkText="View all"
          linkHref="/assessor/results?status=completed"
        />
        
        <StatCard
          title="Assigned Classes"
          value={assessorClasses?.length || "0"}
          icon={Users}
          description="Under your supervision"
          colorClass="bg-purple-500"
          linkText="View all"
          linkHref="/assessor/classes"
        />
        
        <StatCard
          title="Average Response Time"
          value="2.4 days"
          icon={Clock}
          description="Based on recent assessments"
          colorClass="bg-amber-500"
        />
      </div>
      
      {/* Recent Activity */}
      <div className="mb-8">
        <AssessmentList
          assessments={recentAssessments}
          title="Recent Activity"
          emptyMessage="No recent assessment activity"
          showViewAllLink={true}
          viewAllHref="/assessor/results"
          role="assessor"
          onViewResult={(id) => navigate(`/assessor/assessment/${id}`)}
        />
      </div>
      
      {/* Classes */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Classes</h2>
        <ClassList
          classes={classesWithStats}
          emptyMessage="No classes assigned yet"
          role="assessor"
          onClassSelect={handleClassSelect}
        />
      </div>
    </DashboardLayout>
  );
};

export default AssessorDashboard;
