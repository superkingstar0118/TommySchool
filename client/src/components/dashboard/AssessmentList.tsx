import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ClipboardList, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface Assessment {
  id: number;
  status: 'draft' | 'completed';
  createdAt: string;
  student: {
    user: {
      fullName: string;
    }
  };
  task: {
    name: string;
  };
  totalScore?: number;
  pdfPath?: string;
}

interface AssessmentListProps {
  assessments: Assessment[];
  title?: string;
  emptyMessage?: string;
  showViewAllLink?: boolean;
  viewAllHref?: string;
  role?: 'assessor' | 'student';
}

const AssessmentList = ({
  assessments,
  title = "Recent Assessments",
  emptyMessage = "No assessments found",
  showViewAllLink = false,
  viewAllHref = "/assessor/assessments",
  role = "assessor",
}: AssessmentListProps) => {
  if (!assessments || assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ClipboardList className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {showViewAllLink && (
          <Link href={viewAllHref}>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 truncate">
                    {assessment.task.name}
                  </h3>
                  <Badge
                    variant={assessment.status === "completed" ? "success" : "secondary"}
                  >
                    {assessment.status === "completed" ? "Completed" : "Draft"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {role === "assessor" ? "Student: " : ""}
                  {assessment.student.user.fullName}
                </p>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span>
                    {formatDistanceToNow(new Date(assessment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {assessment.totalScore !== undefined && (
                  <div className="mt-2 flex items-center">
                    <div className="text-sm font-medium">
                      Score: {assessment.totalScore}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                {assessment.status === "completed" && assessment.pdfPath ? (
                  <a
                    href={assessment.pdfPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" /> View PDF
                  </a>
                ) : (
                  <span></span>
                )}
                <Link
                  href={`/${role}/assessment/${assessment.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {assessment.status === "draft" ? "Continue" : "View details"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentList;
