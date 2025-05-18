import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { Link } from "wouter";

interface Class {
  id: number;
  name: string;
  schoolId: number;
  school?: {
    name: string;
  };
  studentCount?: number;
  taskCount?: number;
  completionPercentage?: number;
}

interface ClassListProps {
  classes: Class[];
  title?: string;
  emptyMessage?: string;
  role?: 'assessor' | 'admin';
  onClassSelect?: (classId: number) => void;
}

const ClassList = ({
  classes,
  title = "Your Classes",
  emptyMessage = "No classes found",
  role = "assessor",
  onClassSelect,
}: ClassListProps) => {
  if (!classes || classes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {classes.map((cls) => (
        <Card key={cls.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">{cls.name}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {cls.school ? cls.school.name : ""}
              </p>
              <div className="mt-4 flex space-x-2">
                {cls.studentCount !== undefined && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-transparent">
                    {cls.studentCount} Student{cls.studentCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                {cls.taskCount !== undefined && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-transparent">
                    {cls.taskCount} Task{cls.taskCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              
              {cls.completionPercentage !== undefined && (
                <div className="mt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Completion</span>
                    <span className="font-medium text-gray-900">
                      {cls.completionPercentage}%
                    </span>
                  </div>
                  <Progress 
                    value={cls.completionPercentage} 
                    className="mt-2 h-2"
                  />
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              {onClassSelect ? (
                <Button 
                  variant="ghost" 
                  className="text-blue-600 hover:text-blue-800 p-0"
                  onClick={() => onClassSelect(cls.id)}
                >
                  View class <span aria-hidden="true">&rarr;</span>
                </Button>
              ) : (
                <Link 
                  href={`/${role}/classes/${cls.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View class <span aria-hidden="true">&rarr;</span>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClassList;
