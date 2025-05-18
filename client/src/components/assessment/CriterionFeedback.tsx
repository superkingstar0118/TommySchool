import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CriterionFeedbackProps {
  id: string;
  name: string;
  description: string;
  score: number;
  feedback?: string;
  onScoreChange: (id: string, score: number) => void;
  onFeedbackChange: (id: string, feedback: string) => void;
}

const CriterionFeedback = ({
  id,
  name,
  description,
  score,
  feedback = "",
  onScoreChange,
  onFeedbackChange,
}: CriterionFeedbackProps) => {
  // State for the current score
  const [currentScore, setCurrentScore] = useState<number>(score);

  // Handle score change
  const handleScoreChange = (value: number[]) => {
    const newScore = value[0];
    setCurrentScore(newScore);
    onScoreChange(id, newScore);
  };

  // Handle feedback change
  const handleFeedbackChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFeedbackChange(id, event.target.value);
  };

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score < 2) return "text-red-500";
    if (score < 3) return "text-orange-500";
    if (score < 4) return "text-blue-500";
    return "text-green-500";
  };

  // Get score level text
  const getScoreText = (score: number): string => {
    if (score < 2) return "Needs Improvement";
    if (score < 3) return "Developing";
    if (score < 4) return "Proficient";
    if (score < 4.5) return "Advanced";
    return "Exemplary";
  };

  // Get feedback suggestion based on score
  function getScoreSuggestion(score: number, criterionName: string): string {
    if (score < 2) {
      return `The student struggles with ${criterionName.toLowerCase()}. Consider providing specific resources for improvement.`;
    } else if (score < 3) {
      return `The student shows basic understanding of ${criterionName.toLowerCase()} but needs more practice to develop consistency.`;
    } else if (score < 4) {
      return `The student demonstrates solid proficiency in ${criterionName.toLowerCase()}.`;
    } else if (score < 4.5) {
      return `The student shows advanced understanding of ${criterionName.toLowerCase()} with only minor areas for improvement.`;
    } else {
      return `The student demonstrates exemplary mastery of ${criterionName.toLowerCase()}.`;
    }
  }

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-medium flex items-center">
              {name}
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 ml-2 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 line-clamp-2">{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center">
            <span className={`text-2xl font-bold ${getScoreColor(currentScore)}`}>
              {currentScore.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500 ml-1">/5</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <Label htmlFor={`score-${id}`}>Score</Label>
            <Badge variant="outline" className={getScoreColor(currentScore)}>
              {getScoreText(currentScore)}
            </Badge>
          </div>
          <Slider
            id={`score-${id}`}
            defaultValue={[score]}
            max={5}
            min={1}
            step={0.5}
            onValueChange={handleScoreChange}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1.0</span>
            <span>2.0</span>
            <span>3.0</span>
            <span>4.0</span>
            <span>5.0</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`feedback-${id}`}>Feedback</Label>
          <Textarea
            id={`feedback-${id}`}
            placeholder="Provide specific feedback for this criterion..."
            className="min-h-[100px]"
            value={feedback}
            onChange={handleFeedbackChange}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col text-xs text-gray-500 pt-0">
        <div className="w-full p-2 bg-gray-50 rounded-md border border-gray-100">
          <p className="font-medium mb-1">Suggestion:</p>
          <p>{getScoreSuggestion(currentScore, name)}</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CriterionFeedback;