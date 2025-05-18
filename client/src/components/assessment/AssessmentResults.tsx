import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileDown, 
  Calendar, 
  User, 
  FileText, 
  Award,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  formatRelativeTime,
  getScoreColor, 
  getScoreText 
} from "@/lib/utils/formatUtils";

interface CriterionScore {
  id: number | string;
  name: string;
  description?: string;
  score: number;
  feedback?: string;
}

interface AssessmentResultProps {
  id: number;
  studentName: string;
  taskName: string;
  taskDescription?: string;
  assessorName: string;
  date: string;
  status: "draft" | "completed";
  scores: CriterionScore[];
  totalScore: number;
  feedback?: string;
  pdfPath?: string;
  role?: "student" | "assessor" | "admin";
}

const AssessmentResults = ({
  id,
  studentName,
  taskName,
  taskDescription,
  assessorName,
  date,
  status,
  scores,
  totalScore,
  feedback,
  pdfPath,
  role = "student"
}: AssessmentResultProps) => {
  const [expanded, setExpanded] = useState(false);

  // Using utility functions from format-data.ts for consistency

  // Calculate progress percentage for visualization
  const getProgressPercent = (score: number): number => {
    return (score / 5) * 100;
  };

  // Format date
  const formattedDate = new Date(date).toLocaleDateString();
  const relativeTime = formatRelativeTime(new Date(date));

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{taskName}</CardTitle>
            <CardDescription className="mt-1 flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              {formattedDate} ({relativeTime})
            </CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <Badge 
                variant={status === "completed" ? "default" : "outline"} 
                className={`${status === "completed" ? "bg-green-500" : "text-amber-500 border-amber-500"}`}
              >
                {status === "completed" ? "Completed" : "Draft"}
              </Badge>
            </div>
            <div className="mt-2 text-right">
              <span className={`text-2xl font-bold ${getScoreColor(totalScore)}`}>
                {totalScore.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">/5</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            <span>Student: <span className="font-medium text-gray-700">{studentName}</span></span>
          </div>
          <div className="flex items-center mt-1 md:mt-0">
            <Award className="h-4 w-4 mr-1" />
            <span>Assessor: <span className="font-medium text-gray-700">{assessorName}</span></span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Overall Performance</span>
            <span className="text-sm font-medium">{getScoreText(totalScore)}</span>
          </div>
          <Progress value={getProgressPercent(totalScore)} className="h-2" />
        </div>

        {taskDescription && (
          <div className="mb-4 text-sm">
            <p className="font-medium mb-1">Task Description:</p>
            <p className="text-gray-600">{taskDescription}</p>
          </div>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="criteria" className="border-b-0">
            <AccordionTrigger className="py-2">
              <span className="font-medium text-sm">Criteria Breakdown</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {scores.map((criterion) => (
                  <div key={criterion.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{criterion.name}</h4>
                        {criterion.description && (
                          <p className="text-xs text-gray-500 mt-1">{criterion.description}</p>
                        )}
                      </div>
                      <Badge className={`${getScoreColor(criterion.score)} bg-opacity-10`}>
                        {criterion.score}/5
                      </Badge>
                    </div>
                    <Progress value={getProgressPercent(criterion.score)} className="h-1.5 mb-2" />
                    {criterion.feedback && (
                      <div className="mt-2 text-xs bg-gray-50 p-2 rounded border">
                        <p className="font-medium">Feedback:</p>
                        <p className="text-gray-600">{criterion.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {feedback && (
            <AccordionItem value="feedback" className="border-t">
              <AccordionTrigger className="py-2">
                <span className="font-medium text-sm">Overall Feedback</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-gray-50 p-3 rounded-md border text-sm">
                  <p className="whitespace-pre-line">{feedback}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>

      {pdfPath && (
        <CardFooter className="pt-0 flex justify-end">
          <a 
            href={pdfPath} 
            download={`assessment_${id}_feedback.pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Download PDF Report
            </Button>
          </a>
        </CardFooter>
      )}
    </Card>
  );
};

export default AssessmentResults;