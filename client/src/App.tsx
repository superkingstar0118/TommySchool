import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/hooks/use-auth";

// Pages
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

// Assessor Pages
import AssessorDashboard from "@/pages/assessor/dashboard";
import AssessmentForm from "@/pages/assessor/assessment";
import AssessorClasses from "@/pages/assessor/classes";
import AssessorResults from "@/pages/assessor/results";

// Student Pages
import StudentDashboard from "@/pages/student/dashboard";
import StudentFeedback from "@/pages/student/feedback";
import StudentResults from "@/pages/student/results";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSchools from "@/pages/admin/schools";
import AdminClasses from "@/pages/admin/classes";
import AdminStudents from "@/pages/admin/students";
import AdminAssessors from "@/pages/admin/assessors";
import AdminRubrics from "@/pages/admin/rubrics";
import AdminReports from "@/pages/admin/reports";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      
      {/* Assessor routes */}
      <Route path="/assessor" component={AssessorDashboard} />
      <Route path="/assessor/dashboard" component={AssessorDashboard} />
      <Route path="/assessor/assessment" component={AssessmentForm} />
      <Route path="/assessor/assessment/:id" component={AssessmentForm} />
      <Route path="/assessor/classes" component={AssessorClasses} />
      <Route path="/assessor/results" component={AssessorResults} />
      
      {/* Student routes */}
      <Route path="/student" component={StudentDashboard} />
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/feedback" component={StudentFeedback} />
      <Route path="/student/results" component={StudentResults} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/schools" component={AdminSchools} />
      <Route path="/admin/classes" component={AdminClasses} />
      <Route path="/admin/students" component={AdminStudents} />
      <Route path="/admin/assessors" component={AdminAssessors} />
      <Route path="/admin/rubrics" component={AdminRubrics} />
      <Route path="/admin/reports" component={AdminReports} />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
