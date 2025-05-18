import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DownloadIcon, 
  EyeIcon, 
  FileIcon, 
  FilterIcon, 
  Search, 
  SortAsc, 
  SortDesc 
} from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getScoreColorClass } from "@/lib/utils/format-data";

// Define expected result types
interface Assessor {
  id: number;
  user: {
    id: number;
    fullName: string;
    role: string;
  };
}

interface ResultRow {
  id: number;
  student: {
    user: {
      id: number;
      fullName: string;
    }
  };
  task: {
    id: number;
    name: string;
  };
  scores: Record<string, number>;
  totalScore: number;
  assessor: Assessor;
  status: string;
  pdfPath?: string;
  createdAt: string;
}

interface CriteriaColumn {
  id: string;
  name: string;
  maxScore: number;
}

interface ResultsTableProps {
  results: ResultRow[];
  title?: string;
  criteria?: CriteriaColumn[];
  isLoading?: boolean;
  showStudentColumn?: boolean;
  showAssessorColumn?: boolean;
  onViewResult?: (id: number) => void;
  emptyMessage?: string;
  allowExport?: boolean;
  onExport?: () => void;
}

const ResultsTable = ({
  results,
  title = "Assessment Results",
  criteria = [],
  isLoading = false,
  showStudentColumn = true,
  showAssessorColumn = true,
  onViewResult,
  emptyMessage = "No results found",
  allowExport = false,
  onExport,
}: ResultsTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtering function
  const filteredResults = results.filter((result) => {
    const studentName = result.student?.user?.fullName?.toLowerCase() || "";
    const taskName = result.task?.name?.toLowerCase() || "";
    const assessorName = result.assessor?.user?.fullName?.toLowerCase() || "";
    
    const searchLower = searchQuery.toLowerCase();
    
    return (
      studentName.includes(searchLower) ||
      taskName.includes(searchLower) ||
      assessorName.includes(searchLower)
    );
  });

  // Sorting function
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (!sortField) return 0;
    
    let valueA, valueB;
    
    switch (sortField) {
      case "student":
        valueA = a.student?.user?.fullName || "";
        valueB = b.student?.user?.fullName || "";
        break;
      case "task":
        valueA = a.task?.name || "";
        valueB = b.task?.name || "";
        break;
      case "total":
        valueA = a.totalScore;
        valueB = b.totalScore;
        break;
      case "assessor":
        valueA = a.assessor?.user?.fullName || "";
        valueB = b.assessor?.user?.fullName || "";
        break;
      case "date":
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
        break;
      default:
        // Check if the field is a criteria score
        if (sortField.startsWith("criteria_")) {
          const criteriaId = sortField.split("_")[1];
          valueA = a.scores[criteriaId] || 0;
          valueB = b.scores[criteriaId] || 0;
        } else {
          return 0;
        }
    }
    
    // Handle string vs number comparison
    const comparison = typeof valueA === "string" 
      ? valueA.localeCompare(valueB) 
      : valueA - valueB;
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Handle sort toggle
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === "asc" 
      ? <SortAsc className="h-4 w-4 ml-1" /> 
      : <SortDesc className="h-4 w-4 ml-1" />;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>{title}</CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full sm:w-auto"
              />
            </div>
            
            {allowExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {showStudentColumn && (
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleSort("student")}
                    >
                      <div className="flex items-center">
                        Student {renderSortIndicator("student")}
                      </div>
                    </TableHead>
                  )}
                  
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort("task")}
                  >
                    <div className="flex items-center">
                      Task {renderSortIndicator("task")}
                    </div>
                  </TableHead>
                  
                  {criteria.map((criterion) => (
                    <TableHead 
                      key={criterion.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleSort(`criteria_${criterion.id}`)}
                    >
                      <div className="flex items-center whitespace-nowrap">
                        {criterion.name} {renderSortIndicator(`criteria_${criterion.id}`)}
                      </div>
                    </TableHead>
                  ))}
                  
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 text-right"
                    onClick={() => toggleSort("total")}
                  >
                    <div className="flex items-center justify-end">
                      Total {renderSortIndicator("total")}
                    </div>
                  </TableHead>
                  
                  {showAssessorColumn && (
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleSort("assessor")}
                    >
                      <div className="flex items-center">
                        Assessor {renderSortIndicator("assessor")}
                      </div>
                    </TableHead>
                  )}
                  
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {sortedResults.map((result) => {
                  // Calculate max possible score
                  const maxPossibleScore = criteria.reduce(
                    (total, criterion) => total + criterion.maxScore,
                    0
                  );
                  
                  return (
                    <TableRow key={result.id}>
                      {showStudentColumn && (
                        <TableCell className="font-medium">
                          {result.student?.user?.fullName}
                        </TableCell>
                      )}
                      
                      <TableCell>{result.task?.name}</TableCell>
                      
                      {criteria.map((criterion) => (
                        <TableCell key={criterion.id} className="text-center">
                          {result.scores[criterion.id] ?? "-"}
                        </TableCell>
                      ))}
                      
                      <TableCell className="text-right">
                        <span className={getScoreColorClass(result.totalScore, maxPossibleScore || 25)}>
                          {result.totalScore}/{maxPossibleScore || 25}
                        </span>
                      </TableCell>
                      
                      {showAssessorColumn && (
                        <TableCell>
                          <div className="flex items-center">
                            <RoleBadge role="assessor" className="mr-2" />
                            <span className="text-sm">{result.assessor?.user?.fullName}</span>
                          </div>
                        </TableCell>
                      )}
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {result.pdfPath && (
                            <a
                              href={result.pdfPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Button variant="ghost" size="sm">
                                <FileIcon className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          
                          {onViewResult && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewResult(result.id)}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsTable;
