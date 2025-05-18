import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ClassList from "@/components/dashboard/ClassList";
import ResultsTable from "@/components/tables/ResultsTable";
import { UserPlus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AssessorClasses = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const classIdFromUrl = params.get('id');
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classIdFromUrl);
  const [selectedTab, setSelectedTab] = useState<string>("students");
  
  // Redirect if user is not an assessor
  useEffect(() => {
    if (user && user.role !== "assessor") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);
  
  // Fetch assessor-specific data
  const assessorId = user?.assessorId;
  
  // Get classes for this assessor
  const { data: assessorClasses, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/assessors', assessorId, 'classes'],
    queryFn: () => 
      fetch(`/api/assessors/${assessorId}/classes`)
        .then(res => res.json()),
    enabled: !!assessorId,
  });
  
  // Process and enrich class data for display
  const classesWithStats = assessorClasses?.map((cls: any) => {
    // Calculate completion metrics (this would be based on assessments in a real app)
    // Here we're just generating random values for demonstration
    const completionPercentage = Math.floor(Math.random() * 100);
    
    return {
      ...cls,
      studentCount: Math.floor(Math.random() * 25) + 10, // Random student count
      taskCount: Math.floor(Math.random() * 5) + 1, // Random task count
      completionPercentage,
    };
  });
  
  // Selected class details
  const { data: classDetails, isLoading: isLoadingClassDetails } = useQuery({
    queryKey: ['/api/classes', selectedClassId, 'details'],
    queryFn: () => 
      fetch(`/api/classes/${selectedClassId}/details`)
        .then(res => res.json()),
    enabled: !!selectedClassId,
  });
  
  // Get students for selected class
  const { data: classStudents, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/classes', selectedClassId, 'students'],
    queryFn: () => 
      fetch(`/api/classes/${selectedClassId}/students`)
        .then(res => res.json()),
    enabled: !!selectedClassId,
  });
  
  // Get tasks for selected class
  const { data: classTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/classes', selectedClassId, 'tasks'],
    queryFn: () => 
      fetch(`/api/classes/${selectedClassId}/tasks`)
        .then(res => res.json()),
    enabled: !!selectedClassId,
  });
  
  // Get assessments for selected class
  const { data: classAssessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['/api/classes', selectedClassId, 'assessments'],
    queryFn: () => 
      fetch(`/api/classes/${selectedClassId}/assessments`)
        .then(res => res.json()),
    enabled: !!selectedClassId,
  });
  
  // Handle class selection
  const handleClassSelect = (classId: number) => {
    setSelectedClassId(classId.toString());
    navigate(`/assessor/classes?id=${classId}`);
  };
  
  // Handle create assessment for student
  const handleCreateAssessment = (studentId: number) => {
    navigate(`/assessor/assessment?classId=${selectedClassId}&studentId=${studentId}`);
  };
  
  // If no class is selected, show the class list
  if (!selectedClassId) {
    return (
      <DashboardLayout pageTitle="My Classes">
        <h1 className="text-3xl font-bold mb-6">Class Overview</h1>
        <ClassList
          classes={classesWithStats}
          emptyMessage="No classes assigned yet"
          role="assessor"
          onClassSelect={handleClassSelect}
        />
      </DashboardLayout>
    );
  }
  
  // Generate criteria columns for results table
  const criteriaColumns = classAssessments?.length 
    ? Object.keys(classAssessments[0]?.task?.rubricTemplate?.criteria || {}).map((key) => {
        const criterion = classAssessments[0].task.rubricTemplate.criteria[key];
        return {
          id: criterion.id.toString(),
          name: criterion.name,
          maxScore: 5 // All criteria are scored from 1-5
        };
      })
    : [];
  
  return (
    <DashboardLayout pageTitle="Class Details">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedClassId(null);
            navigate("/assessor/classes");
          }}
          className="mb-4"
        >
          ← Back to Classes
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{classDetails?.name}</h1>
            <p className="text-gray-500">
              {classDetails?.school?.name} • {classDetails?.students?.length || 0} Students
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => navigate(`/assessor/assessment?classId=${selectedClassId}`)}
            >
              <FileText className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="results">Class Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students in {classDetails?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStudents ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : classStudents?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No students in this class</p>
                </div>
              ) : (
                <div className="divide-y">
                  {classStudents?.map((student: any) => (
                    <div key={student.id} className="py-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{student.user.fullName}</h3>
                        <p className="text-sm text-gray-500">{student.user.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateAssessment(student.id)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Assess
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <ResultsTable
            title={`Results for ${classDetails?.name}`}
            results={classAssessments || []}
            isLoading={isLoadingAssessments}
            criteria={criteriaColumns}
            emptyMessage="No assessments have been completed for this class yet"
            onViewResult={(id) => navigate(`/assessor/assessment/${id}`)}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AssessorClasses;
