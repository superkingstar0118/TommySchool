import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ResultsTable from "@/components/tables/ResultsTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AssessorResults = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const statusFilter = params.get('status');
  
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>(statusFilter || "all");
  
  // Redirect if user is not an assessor
  useEffect(() => {
    if (user && user.role !== "assessor") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);
  
  // Update URL when status filter changes
  useEffect(() => {
    if (selectedStatus !== "all") {
      navigate(`/assessor/results?status=${selectedStatus}`);
    } else {
      navigate("/assessor/results");
    }
  }, [selectedStatus, navigate]);
  
  // Fetch assessor-specific data
  const assessorId = user?.assessorId;
  
  // Get all assessments for this assessor
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['/api/assessments', { assessorId }],
    queryFn: () => 
      fetch(`/api/assessments?assessorId=${assessorId}`)
        .then(res => res.json()),
    enabled: !!assessorId,
  });
  
  // Get schools for this assessor
  const { data: schools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ['/api/schools'],
    enabled: !!assessorId,
  });
  
  // Get classes for selected school
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/classes', selectedSchool],
    queryFn: () => 
      fetch(`/api/classes?schoolId=${selectedSchool}`)
        .then(res => res.json()),
    enabled: selectedSchool !== "all",
  });
  
  // Get tasks for selected class
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/classes', selectedClass, 'tasks'],
    queryFn: () => 
      fetch(`/api/classes/${selectedClass}/tasks`)
        .then(res => res.json()),
    enabled: selectedClass !== "all",
  });
  
  // Filter assessments based on selection
  const filteredAssessments = assessments?.filter((assessment: any) => {
    // Filter by status
    if (selectedStatus !== "all" && assessment.status !== selectedStatus) {
      return false;
    }
    
    // Filter by school (via class)
    if (selectedSchool !== "all") {
      const schoolId = assessment.student?.class?.schoolId;
      if (schoolId?.toString() !== selectedSchool) {
        return false;
      }
    }
    
    // Filter by class
    if (selectedClass !== "all") {
      const classId = assessment.student?.classId;
      if (classId?.toString() !== selectedClass) {
        return false;
      }
    }
    
    // Filter by task
    if (selectedTask !== "all") {
      if (assessment.taskId?.toString() !== selectedTask) {
        return false;
      }
    }
    
    return true;
  });
  
  // Generate criteria columns for results table
  const criteriaColumns = assessments?.length 
    ? Object.keys(assessments[0]?.task?.rubricTemplate?.criteria || {}).map((key) => {
        const criterion = assessments[0].task.rubricTemplate.criteria[key];
        return {
          id: criterion.id.toString(),
          name: criterion.name,
          maxScore: 5 // All criteria are scored from 1-5
        };
      })
    : [];
  
  // Handle export results (CSV download)
  const handleExportResults = () => {
    // In a real application, this would generate and download a CSV file
    alert("Export functionality would download a CSV of the current filtered results");
  };
  
  return (
    <DashboardLayout pageTitle="Assessment Results">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Assessment Results</h1>
        <p className="text-gray-500">
          View, filter, and export all your assessment results
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School
              </label>
              <Select
                value={selectedSchool}
                onValueChange={setSelectedSchool}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Schools" />
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={selectedSchool === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task
              </label>
              <Select
                value={selectedTask}
                onValueChange={setSelectedTask}
                disabled={selectedClass === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  {tasks?.map((task: any) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue={selectedStatus !== "all" ? selectedStatus : "all"}>
        <TabsList className="mb-6">
          <TabsTrigger 
            value="all" 
            onClick={() => setSelectedStatus("all")}
          >
            All Assessments
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            onClick={() => setSelectedStatus("completed")}
          >
            Completed
          </TabsTrigger>
          <TabsTrigger 
            value="draft" 
            onClick={() => setSelectedStatus("draft")}
          >
            Drafts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <ResultsTable
            title="All Assessments"
            results={filteredAssessments || []}
            isLoading={isLoadingAssessments}
            criteria={criteriaColumns}
            onViewResult={(id) => navigate(`/assessor/assessment/${id}`)}
            allowExport={true}
            onExport={handleExportResults}
          />
        </TabsContent>
        
        <TabsContent value="completed">
          <ResultsTable
            title="Completed Assessments"
            results={filteredAssessments || []}
            isLoading={isLoadingAssessments}
            criteria={criteriaColumns}
            onViewResult={(id) => navigate(`/assessor/assessment/${id}`)}
            allowExport={true}
            onExport={handleExportResults}
          />
        </TabsContent>
        
        <TabsContent value="draft">
          <ResultsTable
            title="Draft Assessments"
            results={filteredAssessments || []}
            isLoading={isLoadingAssessments}
            criteria={criteriaColumns}
            onViewResult={(id) => navigate(`/assessor/assessment/${id}`)}
            allowExport={true}
            onExport={handleExportResults}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AssessorResults;
