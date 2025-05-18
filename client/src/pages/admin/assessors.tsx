import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { RoleBadge } from "@/components/ui/role-badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Edit, 
  PlusCircle, 
  Search, 
  Trash2, 
  User, 
  School, 
  Building, 
  Check 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/formatUtils";
import { Checkbox } from "@/components/ui/checkbox";

// Define form schema for assessor
const assessorFormSchema = z.object({
  user: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(1, "Full name is required"),
  }),
  assessor: z.object({
    schoolIds: z.array(z.string()).min(1, "At least one school must be selected"),
  }),
});

type AssessorFormValues = z.infer<typeof assessorFormSchema>;

const Assessors = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAssessorId, setSelectedAssessorId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect if user is not an admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);
  
  // Fetch schools
  const { data: schools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ['/api/schools'],
    enabled: !!user && user.role === 'admin',
  });
  
  // Fetch assessors
  const { data: assessors, isLoading: isLoadingAssessors } = useQuery({
    queryKey: ['/api/assessors'],
    enabled: !!user && user.role === 'admin',
  });
  
  // Get selected assessor for editing
  const selectedAssessor = assessors?.find((a: any) => a.id === selectedAssessorId);
  
  // Filter assessors based on search query
  const filteredAssessors = assessors?.filter((assessor: any) => {
    // Filter by name or email
    const searchMatch = 
      assessor.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessor.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessor.user.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    return searchMatch;
  }) || [];
  
  // Form for adding/editing an assessor
  const form = useForm<AssessorFormValues>({
    resolver: zodResolver(assessorFormSchema),
    defaultValues: {
      user: {
        username: "",
        password: "",
        email: "",
        fullName: "",
      },
      assessor: {
        schoolIds: [],
      },
    }
  });
  
  // Reset form when opening add dialog
  const handleAddDialogOpen = () => {
    form.reset({
      user: {
        username: "",
        password: "",
        email: "",
        fullName: "",
      },
      assessor: {
        schoolIds: [],
      },
    });
    setIsAddDialogOpen(true);
  };
  
  // Set form values when opening edit dialog
  const handleEditDialogOpen = (id: number) => {
    const assessor = assessors?.find((a: any) => a.id === id);
    if (assessor) {
      form.reset({
        user: {
          username: assessor.user.username,
          password: "", // Don't populate password for security
          email: assessor.user.email,
          fullName: assessor.user.fullName,
        },
        assessor: {
          schoolIds: assessor.schoolIds.map((id: number) => id.toString()),
        },
      });
      setSelectedAssessorId(id);
      setIsEditDialogOpen(true);
    }
  };
  
  // Create assessor mutation
  const createMutation = useMutation({
    mutationFn: (data: AssessorFormValues) => {
      const payload = {
        assessor: {
          schoolIds: data.assessor.schoolIds.map(id => parseInt(id)),
        },
        user: {
          ...data.user,
        },
      };
      return apiRequest('POST', '/api/assessors', payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessor created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assessors'] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create assessor: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update assessor mutation
  const updateMutation = useMutation({
    mutationFn: (data: AssessorFormValues) => {
      // Only include password if it was changed
      const userData = data.user.password 
        ? { ...data.user } 
        : { 
            username: data.user.username,
            email: data.user.email,
            fullName: data.user.fullName,
          };
      
      const payload = {
        assessor: {
          schoolIds: data.assessor.schoolIds.map(id => parseInt(id)),
        },
        user: userData,
      };
      return apiRequest('PUT', `/api/assessors/${selectedAssessorId}`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessor updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assessors'] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update assessor: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete assessor mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/assessors/${id}`, undefined),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessor deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assessors'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete assessor: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: AssessorFormValues) => {
    if (isAddDialogOpen) {
      createMutation.mutate(data);
    } else if (isEditDialogOpen && selectedAssessorId) {
      updateMutation.mutate(data);
    }
  };
  
  // Get school names by ids
  const getSchoolNames = (schoolIds: number[]) => {
    if (!schools) return "Loading...";
    
    return schoolIds.map(id => {
      const school = schools.find((s: any) => s.id === id);
      return school ? school.name : `School ${id}`;
    }).join(", ");
  };
  
  return (
    <DashboardLayout pageTitle="Assessors">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assessor Management</h1>
        <p className="text-gray-500">
          Add, edit, and manage assessors in the system
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assessors</CardTitle>
            <CardDescription>
              All assessors registered in the platform
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search assessors..."
                className="pl-8 w-[200px] md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddDialogOpen}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Assessor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Assessor</DialogTitle>
                  <DialogDescription>
                    Enter assessor details below to add a new assessor to the system.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700">User Information</h3>
                      
                      <FormField
                        control={form.control}
                        name="user.fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="user.username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="user.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter email address" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="user.password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {isEditDialogOpen 
                                ? "Password (leave blank to keep unchanged)" 
                                : "Password"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder={isEditDialogOpen 
                                  ? "Enter new password or leave blank" 
                                  : "Enter password"} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-sm font-medium text-gray-700">School Assignments</h3>
                      
                      <FormField
                        control={form.control}
                        name="assessor.schoolIds"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>Assigned Schools</FormLabel>
                              <FormDescription>
                                Select the schools this assessor can access
                              </FormDescription>
                            </div>
                            <div className="space-y-2">
                              {schools?.map((school: any) => (
                                <FormField
                                  key={school.id}
                                  control={form.control}
                                  name="assessor.schoolIds"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={school.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(school.id.toString())}
                                            onCheckedChange={(checked) => {
                                              const value = school.id.toString();
                                              return checked
                                                ? field.onChange([...field.value, value])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (val) => val !== value
                                                    )
                                                  );
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          {school.name}
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? "Creating..." : "Create Assessor"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Assessor</DialogTitle>
                  <DialogDescription>
                    Update the assessor details below.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700">User Information</h3>
                      
                      <FormField
                        control={form.control}
                        name="user.fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="user.username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="user.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter email address" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="user.password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Password (leave blank to keep unchanged)
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter new password or leave blank"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-sm font-medium text-gray-700">School Assignments</h3>
                      
                      <FormField
                        control={form.control}
                        name="assessor.schoolIds"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>Assigned Schools</FormLabel>
                              <FormDescription>
                                Select the schools this assessor can access
                              </FormDescription>
                            </div>
                            <div className="space-y-2">
                              {schools?.map((school: any) => (
                                <FormField
                                  key={school.id}
                                  control={form.control}
                                  name="assessor.schoolIds"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={school.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(school.id.toString())}
                                            onCheckedChange={(checked) => {
                                              const value = school.id.toString();
                                              return checked
                                                ? field.onChange([...field.value, value])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (val) => val !== value
                                                    )
                                                  );
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          {school.name}
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? "Updating..." : "Update Assessor"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            {isLoadingAssessors || isLoadingSchools ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAssessors.length === 0 ? (
              <div className="text-center p-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium">No assessors found</h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? "Try adjusting your search query" 
                    : "Add your first assessor to get started"}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessor</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Schools</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessors.map((assessor: any) => (
                    <TableRow key={assessor.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>
                              {getInitials(assessor.user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{assessor.user.fullName}</div>
                            <div className="flex items-center mt-1">
                              <RoleBadge role="assessor" />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{assessor.user.username}</TableCell>
                      <TableCell>{assessor.user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {assessor.schoolIds.length > 0 ? (
                            getSchoolNames(assessor.schoolIds)
                          ) : (
                            <span className="text-gray-500">No schools assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditDialogOpen(assessor.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Assessor</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{assessor.user.fullName}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(assessor.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Assessors;
