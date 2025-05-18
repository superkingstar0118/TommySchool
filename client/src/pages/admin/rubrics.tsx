import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import RubricForm, { RubricFormValues } from "@/components/forms/RubricForm";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  List, 
  LibraryBig 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Rubrics = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedRubricId, setSelectedRubricId] = useState<number | null>(null);

  // Redirect if user is not an admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);
  
  // Fetch rubric templates
  const { data: rubricTemplates, isLoading: isLoadingRubrics } = useQuery({
    queryKey: ['/api/rubric-templates'],
    enabled: !!user && user.role === 'admin',
  });
  
  // Get selected rubric for editing/viewing
  const selectedRubric = rubricTemplates?.find((r: any) => r.id === selectedRubricId);
  
  // Filter rubrics based on search query
  const filteredRubrics = rubricTemplates?.filter((rubric: any) => 
    rubric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rubric.description && rubric.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  // Create rubric mutation
  const createMutation = useMutation({
    mutationFn: (data: RubricFormValues) => {
      // Format criteria as needed for the API
      const criteriaObjects = data.criteria.map((criterion, index) => ({
        id: index + 1,
        name: criterion.name,
        description: criterion.description,
      }));
      
      return apiRequest('POST', '/api/rubric-templates', {
        name: data.name,
        description: data.description || "",
        criteria: criteriaObjects,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rubric template created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rubric-templates'] });
      setIsCreating(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create rubric template: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update rubric mutation
  const updateMutation = useMutation({
    mutationFn: (data: RubricFormValues) => {
      // Format criteria as needed for the API
      const criteriaObjects = data.criteria.map((criterion, index) => ({
        id: criterion.id || index + 1,
        name: criterion.name,
        description: criterion.description,
      }));
      
      return apiRequest('PUT', `/api/rubric-templates/${selectedRubricId}`, {
        name: data.name,
        description: data.description || "",
        criteria: criteriaObjects,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rubric template updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rubric-templates'] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update rubric template: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete rubric mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/rubric-templates/${id}`, undefined),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rubric template deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rubric-templates'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete rubric template: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = (data: RubricFormValues) => {
    if (isCreating) {
      createMutation.mutate(data);
    } else if (isEditing && selectedRubricId) {
      updateMutation.mutate(data);
    }
  };
  
  // Handle view mode
  const handleViewRubric = (id: number) => {
    setSelectedRubricId(id);
    setIsViewing(true);
  };
  
  // Handle edit mode
  const handleEditRubric = (id: number) => {
    setSelectedRubricId(id);
    setIsEditing(true);
  };
  
  // Handle create mode
  const handleCreateRubric = () => {
    setIsCreating(true);
  };
  
  // Format rubric data for the form
  const formatRubricForForm = (rubric: any): RubricFormValues => {
    if (!rubric) return { name: "", description: "", criteria: [] };
    
    return {
      name: rubric.name,
      description: rubric.description || "",
      criteria: Array.isArray(rubric.criteria) 
        ? rubric.criteria.map((criterion: any) => ({
            id: criterion.id,
            name: criterion.name,
            description: criterion.description,
          }))
        : Object.values(rubric.criteria).map((criterion: any) => ({
            id: criterion.id,
            name: criterion.name,
            description: criterion.description,
          })),
    };
  };
  
  return (
    <DashboardLayout pageTitle="Rubric Templates">
      {isCreating ? (
        <div>
          <div className="flex items-center mb-6">
            <Button
              variant="outline"
              onClick={() => setIsCreating(false)}
              className="mr-2"
            >
              ← Back to Rubrics
            </Button>
            <h1 className="text-2xl font-bold">Create New Rubric Template</h1>
          </div>
          
          <RubricForm
            onSubmit={handleSubmit}
            onCancel={() => setIsCreating(false)}
            isLoading={createMutation.isPending}
          />
        </div>
      ) : isEditing && selectedRubric ? (
        <div>
          <div className="flex items-center mb-6">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="mr-2"
            >
              ← Back to Rubrics
            </Button>
            <h1 className="text-2xl font-bold">Edit Rubric Template</h1>
          </div>
          
          <RubricForm
            initialData={formatRubricForForm(selectedRubric)}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditing(false)}
            isLoading={updateMutation.isPending}
          />
        </div>
      ) : isViewing && selectedRubric ? (
        <div>
          <div className="flex items-center mb-6">
            <Button
              variant="outline"
              onClick={() => setIsViewing(false)}
              className="mr-2"
            >
              ← Back to Rubrics
            </Button>
            <h1 className="text-2xl font-bold">Rubric Template Details</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{selectedRubric.name}</CardTitle>
              {selectedRubric.description && (
                <CardDescription>{selectedRubric.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Criteria</h3>
                
                {Array.isArray(selectedRubric.criteria) 
                  ? selectedRubric.criteria.map((criterion: any) => (
                      <div key={criterion.id} className="border rounded-lg p-4">
                        <h4 className="font-medium">{criterion.name}</h4>
                        <p className="text-gray-500 text-sm mt-1">{criterion.description}</p>
                        
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-gray-500 mb-2">Scoring Guide</h5>
                          <div className="grid grid-cols-5 gap-2">
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">1</div>
                              <p className="text-xs mt-1">Poor</p>
                            </div>
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">2</div>
                              <p className="text-xs mt-1">Fair</p>
                            </div>
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto">3</div>
                              <p className="text-xs mt-1">Satisfactory</p>
                            </div>
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">4</div>
                              <p className="text-xs mt-1">Good</p>
                            </div>
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">5</div>
                              <p className="text-xs mt-1">Excellent</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : Object.values(selectedRubric.criteria).map((criterion: any) => (
                      <div key={criterion.id} className="border rounded-lg p-4">
                        <h4 className="font-medium">{criterion.name}</h4>
                        <p className="text-gray-500 text-sm mt-1">{criterion.description}</p>
                        
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-gray-500 mb-2">Scoring Guide</h5>
                          <div className="grid grid-cols-5 gap-2">
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">1</div>
                              <p className="text-xs mt-1">Poor</p>
                            </div>
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">2</div>
                              <p className="text-xs mt-1">Fair</p>
                            </div>
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto">3</div>
                              <p className="text-xs mt-1">Satisfactory</p>
                            </div>
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">4</div>
                              <p className="text-xs mt-1">Good</p>
                            </div>
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">5</div>
                              <p className="text-xs mt-1">Excellent</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                }
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsViewing(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewing(false);
                  handleEditRubric(selectedRubric.id);
                }}
              >
                Edit Rubric
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Rubric Templates</h1>
            <p className="text-gray-500">
              Manage assessment rubric templates
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search rubrics..."
                className="pl-8 w-full md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button onClick={handleCreateRubric}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Rubric
            </Button>
          </div>
          
          <Tabs defaultValue="grid">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="grid">
                  <LibraryBig className="h-4 w-4 mr-2" />
                  Grid View
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="grid">
              {isLoadingRubrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="h-20 bg-gray-100"></CardHeader>
                      <CardContent className="h-32 bg-gray-50"></CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredRubrics.length === 0 ? (
                <div className="text-center p-12 border rounded-lg bg-gray-50">
                  <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No rubric templates found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? "Try adjusting your search query" 
                      : "Create your first rubric template to get started"}
                  </p>
                  {searchQuery ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchQuery("")}
                    >
                      Clear Search
                    </Button>
                  ) : (
                    <Button onClick={handleCreateRubric}>
                      Create New Rubric
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRubrics.map((rubric: any) => (
                    <Card key={rubric.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="truncate">{rubric.name}</CardTitle>
                        {rubric.description && (
                          <CardDescription className="truncate">
                            {rubric.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Criteria:</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(rubric.criteria) 
                              ? rubric.criteria.map((criterion: any) => (
                                  <Badge
                                    key={criterion.id}
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700 border-purple-200"
                                  >
                                    {criterion.name}
                                  </Badge>
                                ))
                              : Object.values(rubric.criteria).map((criterion: any) => (
                                  <Badge
                                    key={criterion.id}
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700 border-purple-200"
                                  >
                                    {criterion.name}
                                  </Badge>
                                ))
                            }
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4 flex justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewRubric(rubric.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditRubric(rubric.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Rubric Template</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{rubric.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(rubric.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list">
              <Card>
                <CardContent className="p-0">
                  {isLoadingRubrics ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-100 animate-pulse rounded"></div>
                      ))}
                    </div>
                  ) : filteredRubrics.length === 0 ? (
                    <div className="text-center p-12">
                      <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium">No rubric templates found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery 
                          ? "Try adjusting your search query" 
                          : "Create your first rubric template to get started"}
                      </p>
                      {searchQuery ? (
                        <Button 
                          variant="outline" 
                          onClick={() => setSearchQuery("")}
                        >
                          Clear Search
                        </Button>
                      ) : (
                        <Button onClick={handleCreateRubric}>
                          Create New Rubric
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredRubrics.map((rubric: any) => (
                        <div key={rubric.id} className="p-4 flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{rubric.name}</h3>
                            <p className="text-sm text-gray-500">
                              {rubric.description || `Contains ${Array.isArray(rubric.criteria) ? rubric.criteria.length : Object.keys(rubric.criteria).length} criteria`}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewRubric(rubric.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditRubric(rubric.id)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Rubric Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{rubric.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteMutation.mutate(rubric.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardLayout>
  );
};

export default Rubrics;
