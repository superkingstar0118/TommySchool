import React from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Assessment {
  id: number;
  taskName: string;
  date: string;
  totalScore: number;
  status: "draft" | "completed";
  criteria: {
    name: string;
    score: number;
  }[];
}

interface ProgressTrackerProps {
  assessments: Assessment[];
  studentName: string;
}

const ProgressTracker = ({ assessments, studentName }: ProgressTrackerProps) => {
  // Only use completed assessments for progress tracking
  const completedAssessments = assessments
    .filter(a => a.status === "completed")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Data for the line chart - progress over time
  const progressData = completedAssessments.map(assessment => ({
    name: assessment.taskName,
    score: assessment.totalScore,
    date: new Date(assessment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // Get average scores per criterion across all assessments
  const getCriteriaAverages = () => {
    const criteriaMap = new Map();
    
    // Collect all scores for each criterion
    completedAssessments.forEach(assessment => {
      assessment.criteria.forEach(criterion => {
        if (!criteriaMap.has(criterion.name)) {
          criteriaMap.set(criterion.name, []);
        }
        criteriaMap.get(criterion.name).push(criterion.score);
      });
    });
    
    // Calculate averages
    const result = Array.from(criteriaMap.entries()).map(([name, scores]) => {
      const total = scores.reduce((sum: number, score: number) => sum + score, 0);
      const average = total / scores.length;
      return { name, value: average, percentage: (average / 5) * 100 };
    });
    
    return result;
  };

  const criteriaAverages = getCriteriaAverages();

  // Score distribution data
  const getScoreDistribution = () => {
    const distribution = [
      { name: 'Needs Improvement (1-2)', value: 0, color: '#ef4444' },
      { name: 'Satisfactory (2-3)', value: 0, color: '#f97316' },
      { name: 'Good (3-4)', value: 0, color: '#3b82f6' },
      { name: 'Excellent (4-5)', value: 0, color: '#22c55e' },
    ];
    
    let totalScores = 0;
    
    completedAssessments.forEach(assessment => {
      assessment.criteria.forEach(criterion => {
        totalScores++;
        if (criterion.score < 2) {
          distribution[0].value++;
        } else if (criterion.score < 3) {
          distribution[1].value++;
        } else if (criterion.score < 4) {
          distribution[2].value++;
        } else {
          distribution[3].value++;
        }
      });
    });
    
    // Convert to percentages
    distribution.forEach(item => {
      item.value = totalScores > 0 ? (item.value / totalScores) * 100 : 0;
    });
    
    return distribution;
  };

  const scoreDistribution = getScoreDistribution();
  const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#22c55e'];

  // Calculate overall average score
  const calculateOverallAverage = () => {
    if (completedAssessments.length === 0) return 0;
    
    const sum = completedAssessments.reduce((total, assessment) => total + assessment.totalScore, 0);
    return sum / completedAssessments.length;
  };

  const overallAverage = calculateOverallAverage();

  // Calculate improvement from first to latest assessment
  const calculateImprovement = () => {
    if (completedAssessments.length < 2) return 0;
    
    const firstScore = completedAssessments[0].totalScore;
    const latestScore = completedAssessments[completedAssessments.length - 1].totalScore;
    
    return latestScore - firstScore;
  };

  const improvement = calculateImprovement();

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Progress Tracker</CardTitle>
        <CardDescription>
          Performance tracking and analytics for {studentName}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {completedAssessments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No completed assessments yet to track progress.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="py-4 px-5">
                  <CardTitle className="text-sm font-medium text-gray-500">Assessments Completed</CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-5">
                  <div className="text-2xl font-bold">{completedAssessments.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4 px-5">
                  <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-5">
                  <div className="text-2xl font-bold">{overallAverage.toFixed(1)}<span className="text-sm text-gray-500">/5</span></div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4 px-5">
                  <CardTitle className="text-sm font-medium text-gray-500">Improvement</CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-5">
                  <div className={`text-2xl font-bold ${improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="progress">Progress Over Time</TabsTrigger>
                <TabsTrigger value="criteria">Criteria Breakdown</TabsTrigger>
                <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="space-y-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={progressData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        activeDot={{ r: 8 }} 
                        name="Assessment Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="text-sm text-gray-500 text-center">
                  Showing progress across {completedAssessments.length} completed assessments over time
                </div>
              </TabsContent>
              
              <TabsContent value="criteria" className="space-y-4">
                <div className="space-y-3">
                  {criteriaAverages.map((criterion, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{criterion.name}</span>
                        <span className="text-sm font-medium">{criterion.value.toFixed(1)}/5</span>
                      </div>
                      <Progress value={criterion.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="distribution" className="space-y-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scoreDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Percentage']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {scoreDistribution.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-xs">{item.name}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;