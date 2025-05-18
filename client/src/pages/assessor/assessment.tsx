import { useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AssessmentForm from "@/components/forms/AssessmentForm";

const Assessment = () => {
  const { user } = useAuth();
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const assessmentId = params?.id;
  
  // Redirect if user is not an assessor
  useEffect(() => {
    if (user && user.role !== "assessor") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);
  
  // Handle form submission success
  const handleSuccess = () => {
    navigate("/assessor/dashboard");
  };
  
  return (
    <DashboardLayout pageTitle={assessmentId ? "Edit Assessment" : "New Assessment"}>
      <AssessmentForm 
        assessmentId={assessmentId} 
        onSuccess={handleSuccess} 
      />
    </DashboardLayout>
  );
};

export default Assessment;
