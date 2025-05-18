import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generatePDFPreview } from "@/lib/utils/pdf-generator";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PDFPreview from "@/components/pdf/PDFPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, FileDown, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import custom assessment components
import CriterionFeedback from "@/components/assessment/CriterionFeedback";

// Define the schema for a criterion score with feedback
const criterionScoreSchema = z.object({
  id: z.string(), // ID of the criterion
  score: z.number().min(1).max(5), // Score from 1 to 5
  feedback: z.string().optional(), // Optional feedback for this criterion
});

// Define the assessment form schema
const assessmentFormSchema = z.object({
  schoolId: z.string().nonempty("School is required"),
  classId: z.string().nonempty("Class is required"),
  studentId: z.string().nonempty("Student is required"),
  taskId: z.string().nonempty("Task is required"),
  criteriaScores: z.array(criterionScoreSchema),
  feedback: z.string().optional(), // Overall feedback
  status: z.enum(["draft", "completed"]),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

interface AssessmentFormProps {
  assessmentId?: string;
  onSuccess?: () => void;
}

const AssessmentForm = ({ assessmentId, onSuccess }: AssessmentFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | undefined>(undefined);

  // Get form data
  const { data: schools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ['/api/schools'],
    enabled: !!user && user.role === 'assessor',
  });

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  // Get classes based on selected school
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/classes', selectedSchoolId],
    queryFn: () => fetch(`/api/classes?schoolId=${selectedSchoolId}`).then(res => res.json()),
    enabled: !!selectedSchoolId,
  });

  // Get students based on selected class
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/classes', selectedClassId, 'students'],
    queryFn: () => fetch(`/api/classes/${selectedClassId}/students`).then(res => res.json()),
    enabled: !!selectedClassId,
  });

  // Get tasks based on selected class
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/classes', selectedClassId, 'tasks'],
    queryFn: () => fetch(`/api/classes/${selectedClassId}/tasks`).then(res => res.json()),
    enabled: !!selectedClassId,
  });

  // Get task details including rubric template
  const { data: taskDetails, isLoading: isLoadingTaskDetails } = useQuery({
    queryKey: ['/api/tasks', selectedTaskId],
    queryFn: () => fetch(`/api/tasks/${selectedTaskId}`).then(res => res.json()),
    enabled: !!selectedTaskId,
  });

  // If editing, get assessment details
  const { data: assessmentDetails, isLoading: isLoadingAssessment } = useQuery({
    queryKey: ['/api/assessments', assessmentId],
    queryFn: () => fetch(`/api/assessments/${assessmentId}`).then(res => res.json()),
    enabled: !!assessmentId,
  });

  // Create form
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      schoolId: "",
      classId: "",
      studentId: "",
      taskId: "",
      criteriaScores: [],
      feedback: "",
      status: "draft",
    }
  });

  // Update form values when assessment details are loaded
  useEffect(() => {
    if (assessmentDetails) {
      // Extract scores from the assessment
      const criteriaScores = taskDetails?.rubricTemplate?.criteria.map((criterion: any) => ({
        id: criterion.id.toString(),
        score: assessmentDetails.scores[criterion.id] || 3,
      })) || [];

      form.reset({
        schoolId: assessmentDetails.student.class?.schoolId.toString() || "",
        classId: assessmentDetails.student.classId.toString() || "",
        studentId: assessmentDetails.studentId.toString() || "",
        taskId: assessmentDetails.taskId.toString() || "",
        criteriaScores,
        feedback: assessmentDetails.feedback || "",
        status: assessmentDetails.status,
      });

      setSelectedSchoolId(assessmentDetails.student.class?.schoolId.toString() || "");
      setSelectedClassId(assessmentDetails.student.classId.toString() || "");
      setSelectedTaskId(assessmentDetails.taskId.toString() || "");

      // Set PDF preview if available
      if (assessmentDetails.pdfPath) {
        setPdfPreviewUrl(assessmentDetails.pdfPath);
      }
    }
  }, [assessmentDetails, taskDetails, form]);

  // Update criteria scores when task changes
  useEffect(() => {
    if (taskDetails?.rubricTemplate?.criteria) {
      const criteriaScores = taskDetails.rubricTemplate.criteria.map((criterion: any) => ({
        id: criterion.id.toString(),
        score: 3, // Default score is 3 (middle of the range)
        feedback: "", // Initialize empty feedback
      }));

      form.setValue("criteriaScores", criteriaScores);
    }
  }, [taskDetails, form]);

  // Handle school selection change
  const handleSchoolChange = (value: string) => {
    setSelectedSchoolId(value);
    form.setValue("schoolId", value);

    // Reset dependent fields
    setSelectedClassId("");
    setSelectedTaskId("");
    form.setValue("classId", "");
    form.setValue("studentId", "");
    form.setValue("taskId", "");
  };

  // Handle class selection change
  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
    form.setValue("classId", value);

    // Reset dependent fields
    form.setValue("studentId", "");
    form.setValue("taskId", "");
    setSelectedTaskId("");
  };

  // Handle task selection change
  const handleTaskChange = (value: string) => {
    setSelectedTaskId(value);
    form.setValue("taskId", value);
  };

  // Create or update assessment mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Format the data for the API
      const apiData = {
        studentId: parseInt(data.studentId),
        assessorId: user?.assessorId,
        taskId: parseInt(data.taskId),
        status: data.status,
        // Convert scores from array to object format
        scores: data.criteriaScores.reduce((obj: any, item: any) => {
          obj[item.id] = item.score;
          return obj;
        }, {}),
        // Calculate total score
        totalScore: data.criteriaScores.reduce((sum: number, item: any) => sum + item.score, 0),
        feedback: data.feedback,
      };

      // If assessmentId exists, update, otherwise create
      if (assessmentId) {
        return apiRequest('PUT', `/api/assessments/${assessmentId}`, apiData);
      } else {
        return apiRequest('POST', '/api/assessments', apiData);
      }
    },
    onSuccess: async (data) => {
      const result = await data.json();

      toast({
        title: assessmentId ? "Assessment updated" : "Assessment created",
        description: `The assessment was successfully ${assessmentId ? 'updated' : 'created'}.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });

      // If there's an onSuccess callback, call it
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to the assessor dashboard
        navigate("/assessor/dashboard");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${assessmentId ? 'update' : 'create'} assessment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: AssessmentFormValues) => {
    mutation.mutate(data);
  };

  // Generate PDF preview
  const generatePreview = async () => {
    if (!assessmentDetails && !taskDetails) {
      throw new Error("Cannot generate preview: missing assessment or task details");
    }

    // Get current form values
    const formValues = form.getValues();

    // Get student name and assessor name
    const studentName = assessmentDetails?.student?.user?.fullName ||
      students?.find((s: any) => s.id.toString() === formValues.studentId)?.user?.fullName ||
      "Student Name";

    const assessorName = assessmentDetails?.assessor?.user?.fullName ||
      user?.fullName ||
      "Assessor Name";

    // Get task name
    const taskName = assessmentDetails?.task?.name ||
      taskDetails?.name ||
      "Task Name";

    // Format criteria with scores and feedback
    const criteriaWithFeedback = formValues.criteriaScores.map((criterionScore: any) => {
      // Find the criterion details from taskDetails
      const criterionDetails = taskDetails?.rubricTemplate?.criteria?.find(
        (c: any) => c.id.toString() === criterionScore.id
      ) || { name: `Criterion ${criterionScore.id}`, description: "" };

      return {
        name: criterionDetails.name,
        description: criterionDetails.description || "",
        score: Number(criterionScore.score) || 0,
        feedback: criterionScore.feedback || ""
      };
    });

    // Calculate total score - average of all criteria scores
    const criteriaCount = formValues.criteriaScores.length || 1;
    const totalScore = formValues.criteriaScores.reduce(
      (sum: number, item: any) => sum + (Number(item.score) || 0),
      0
    ) / criteriaCount;

    // Create PDF data in the format required by our enhanced PDF generator
    const pdfData = {
      studentName,
      assessorName,
      taskName,
      criteria: criteriaWithFeedback,
      overallFeedback: formValues.feedback || "",
      totalScore,
      date: new Date()
    };

    // Generate and return the PDF blob
    const pdfBlob = generatePDFPreview(pdfData);
    return pdfBlob;
  };

  // Show loading state if data is still loading
  if (isLoadingAssessment && assessmentId) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8">
          {/* Student & Task Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Student & Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* School selection */}
                <FormField
                  control={form.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School</FormLabel>
                      <Select
                        disabled={isLoadingSchools || !!assessmentId}
                        onValueChange={(value) => handleSchoolChange(value)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a school" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schools?.map((school: any) => (
                            <SelectItem key={school.id} value={school.id.toString()}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Class selection */}
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select
                        disabled={!selectedSchoolId || isLoadingClasses || !!assessmentId}
                        onValueChange={(value) => handleClassChange(value)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes?.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Student selection */}
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select
                        disabled={!selectedClassId || isLoadingStudents || !!assessmentId}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students?.map((student: any) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.user.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Task selection */}
                <FormField
                  control={form.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Task</FormLabel>
                      <Select
                        disabled={!selectedClassId || isLoadingTasks || !!assessmentId}
                        onValueChange={(value) => handleTaskChange(value)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tasks?.map((task: any) => (
                            <SelectItem key={task.id} value={task.id.toString()}>
                              {task.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rubric Assessment with Enhanced Criterion Feedback */}
          {taskDetails?.rubricTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Rubric Assessment: {taskDetails.rubricTemplate.name}</CardTitle>
                <CardDescription>
                  Provide detailed feedback for each criterion and rate student performance from 1 (Needs Improvement) to 5 (Exemplary).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="scoring" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="scoring">Criteria Scoring</TabsTrigger>
                    <TabsTrigger value="summary">Score Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="scoring" className="space-y-6">
                    {taskDetails.rubricTemplate.criteria.map((criterion: any, index: number) => {
                      const criterionScore = form.watch(`criteriaScores.${index}`);

                      // Handle score change for this criterion
                      const handleScoreChange = (id: string, score: number) => {
                        form.setValue(`criteriaScores.${index}.score`, score);
                      };

                      // Handle feedback change for this criterion
                      const handleFeedbackChange = (id: string, feedback: string) => {
                        form.setValue(`criteriaScores.${index}.feedback`, feedback);
                      };

                      return (
                        <FormField
                          key={criterion.id}
                          control={form.control}
                          name={`criteriaScores.${index}`}
                          render={({ field }) => (
                            <FormItem>
                              <CriterionFeedback
                                id={criterion.id.toString()}
                                name={criterion.name}
                                description={criterion.description || ""}
                                score={criterionScore?.score || 0}
                                feedback={criterionScore?.feedback || ""}
                                onScoreChange={handleScoreChange}
                                onFeedbackChange={handleFeedbackChange}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="summary">
                    <Card className="border shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Scoring Summary</h3>

                        <div className="space-y-4">
                          {taskDetails.rubricTemplate.criteria.map((criterion: any, index: number) => {
                            const criterionScore = form.watch(`criteriaScores.${index}`);
                            const score = criterionScore?.score || 0;

                            // Get score color based on value
                            const getScoreColor = (score: number): string => {
                              if (score < 2) return "text-red-500";
                              if (score < 3) return "text-orange-500";
                              if (score < 4) return "text-blue-500";
                              return "text-green-500";
                            };

                            return (
                              <div key={criterion.id} className="flex justify-between items-center pb-2 border-b last:border-b-0 last:pb-0">
                                <span className="font-medium">{criterion.name}</span>
                                <div className="flex items-center">
                                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                                    {score.toFixed(1)}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-1">/5</span>
                                </div>
                              </div>
                            );
                          })}

                          <div className="mt-6 pt-4 border-t border-gray-300 flex justify-between items-center">
                            <span className="text-lg font-bold">Total Score</span>
                            <div className="flex items-center">
                              <span className="text-xl font-bold">
                                {(form.watch("criteriaScores") || [])
                                  .reduce((sum, item) => sum + (item?.score || 0), 0)
                                  .toFixed(1)}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">/{(taskDetails.rubricTemplate.criteria.length * 5).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Additional Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Feedback</CardTitle>
              <FormDescription>
                Provide detailed comments on strengths and areas for improvement.
              </FormDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <Textarea
                      placeholder="Add your detailed feedback here..."
                      className="min-h-[150px]"
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* PDF Preview */}
          <PDFPreview
            title="PDF Feedback Preview"
            pdfUrl={pdfPreviewUrl}
            generatePdfFn={generatePreview}
          />

          {/* Submit buttons */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <div>
                        <FormLabel className="text-base">Assessment Status</FormLabel>
                        <FormDescription>
                          Save as draft to continue later or complete to generate final PDF.
                        </FormDescription>
                      </div>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="draft" id="status-draft" />
                          </FormControl>
                          <FormLabel htmlFor="status-draft" className="font-normal cursor-pointer">
                            Draft
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="completed" id="status-completed" />
                          </FormControl>
                          <FormLabel htmlFor="status-completed" className="font-normal cursor-pointer">
                            Completed
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/assessor/dashboard")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !form.formState.isValid}
              >
                {mutation.isPending
                  ? "Saving..."
                  : assessmentId
                    ? "Update Assessment"
                    : "Save Assessment"
                }
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
};

export default AssessmentForm;
