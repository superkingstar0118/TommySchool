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
import { School, Edit, PlusCircle, Search, Trash2, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define form schema for class
const classFormSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  schoolId: z.string().min(1, "School is required"),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

const Classes = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");

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
  
  // Fetch classes
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/classes'],
    enabled: !!user && user.role === 'admin',
  });
  
  // Get selected class for editing
  const selectedClass = classes?.find((cls: any) => cls.id === selectedClassId);
  
  // Filter classes based on search query and school filter
  const filteredClasses = classes?.filter((cls: any) => {
    // Filter by name
    const nameMatch = cls.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by school
    const schoolMatch = schoolFilter === "all" || cls.schoolId.toString() === schoolFilter;
    
    return nameMatch && schoolMatch;
  }) || [];
  
  // Form for adding/editing a class
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      schoolId: "",
    }
  });
  
  // Reset form when opening add dialog
  const handleAddDialogOpen = () => {
    form.reset({
      name: "",
      schoolId: "",
    });
    setIsAddDialogOpen(true);
  };
  
  // Set form values when opening edit dialog
  const handleEditDialogOpen = (id: number) => {
    const cls = classes?.find((c: any) => c.id === id);
    if (cls) {
      form.reset({
        name: cls.name,
        schoolId: cls.schoolId.toString(),
      });
      setSelectedClassId(id);
      setIsEditDialogOpen(true);
    }
  };
  
  // Create class mutation
  const createMutation = useMutation({
    mutationFn: (data: ClassFormValues) => {
      const payload = {
        name: data.name,
        schoolId: parseInt(data.schoolId),
      };
      return apiRequest('POST', '/api/classes', payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create class: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update class mutation
  const updateMutation = useMutation({
    mutationFn: (data: ClassFormValues) => {
      const payload = {
        name: data.name,
        schoolId: parseInt(data.schoolId),
      };
      return apiRequest('PUT', `/api/classes/${selectedClassId}`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update class: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/classes/${id}`, undefined),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete class: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: ClassFormValues) => {
    if (isAddDialogOpen) {
      createMutation.mutate(data);
    } else if (isEditDialogOpen && selectedClassId) {
      updateMutation.mutate(data);
    }
  };
  
  // Get school name by id
  const getSchoolName = (schoolId: number) => {
    const school = schools?.find((s: any) => s.id === schoolId);
    return school ? school.name : "Unknown School";
  };
  
  return (
    <DashboardLayout pageTitle="Classes">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Class Management</h1>
        <p className="text-gray-500">
          Add, edit, and manage classes in the system
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Classes</CardTitle>
            <CardDescription>
              All classes registered in the platform
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search classes..."
                className="pl-8 w-[200px] md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by School" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools?.map((school: any) => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddDialogOpen}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                  <DialogDescription>
                    Enter class details below to add a new class to the system.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter class name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="schoolId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a school" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {schools?.map((school: any) => (
                                <SelectItem key={school.id} value={school.id.toString()}>
                                  {school.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                        {createMutation.isPending ? "Creating..." : "Create Class"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Class</DialogTitle>
                  <DialogDescription>
                    Update the class details below.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter class name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="schoolId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a school" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {schools?.map((school: any) => (
                                <SelectItem key={school.id} value={school.id.toString()}>
                                  {school.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                        {updateMutation.isPending ? "Updating..." : "Update Class"}
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
            {isLoadingClasses || isLoadingSchools ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center p-8">
                <School className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium">No classes found</h3>
                <p className="text-gray-500">
                  {searchQuery || schoolFilter !== "all"
                    ? "Try adjusting your filters" 
                    : "Add your first class to get started"}
                </p>
                {(searchQuery || schoolFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => {
                      setSearchQuery("");
                      setSchoolFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((cls: any) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                          <Building className="h-3 w-3 mr-1" />
                          {getSchoolName(cls.schoolId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditDialogOpen(cls.id)}
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
                                <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{cls.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(cls.id)}
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

export default Classes;
