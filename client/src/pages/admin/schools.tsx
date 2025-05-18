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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building, Edit, PlusCircle, Search, Trash2 } from "lucide-react";

// Define form schema for school
const schoolFormSchema = z.object({
  name: z.string().min(1, "School name is required"),
  address: z.string().optional(),
});

type SchoolFormValues = z.infer<typeof schoolFormSchema>;

const Schools = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
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
  
  // Get selected school for editing
  const selectedSchool = schools?.find((school: any) => school.id === selectedSchoolId);
  
  // Filter schools based on search query
  const filteredSchools = schools?.filter((school: any) => 
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (school.address && school.address.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  // Form for adding/editing a school
  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      name: "",
      address: "",
    }
  });
  
  // Reset form when opening add dialog
  const handleAddDialogOpen = () => {
    form.reset({
      name: "",
      address: "",
    });
    setIsAddDialogOpen(true);
  };
  
  // Set form values when opening edit dialog
  const handleEditDialogOpen = (id: number) => {
    const school = schools?.find((s: any) => s.id === id);
    if (school) {
      form.reset({
        name: school.name,
        address: school.address || "",
      });
      setSelectedSchoolId(id);
      setIsEditDialogOpen(true);
    }
  };
  
  // Create school mutation
  const createMutation = useMutation({
    mutationFn: (data: SchoolFormValues) => apiRequest('POST', '/api/schools', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schools'] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create school: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update school mutation
  const updateMutation = useMutation({
    mutationFn: (data: SchoolFormValues) => 
      apiRequest('PUT', `/api/schools/${selectedSchoolId}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schools'] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update school: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete school mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/schools/${id}`, undefined),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schools'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete school: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: SchoolFormValues) => {
    if (isAddDialogOpen) {
      createMutation.mutate(data);
    } else if (isEditDialogOpen && selectedSchoolId) {
      updateMutation.mutate(data);
    }
  };
  
  return (
    <DashboardLayout pageTitle="Schools">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">School Management</h1>
        <p className="text-gray-500">
          Add, edit, and manage schools in the system
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Schools</CardTitle>
            <CardDescription>
              All schools registered in the platform
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search schools..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddDialogOpen}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add School
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New School</DialogTitle>
                  <DialogDescription>
                    Enter school details below to add a new school to the system.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter school name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter school address" {...field} />
                          </FormControl>
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
                        {createMutation.isPending ? "Creating..." : "Create School"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit School</DialogTitle>
                  <DialogDescription>
                    Update the school details below.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter school name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter school address" {...field} />
                          </FormControl>
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
                        {updateMutation.isPending ? "Updating..." : "Update School"}
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
            {isLoadingSchools ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-center p-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium">No schools found</h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? "Try adjusting your search query" 
                    : "Add your first school to get started"}
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
                    <TableHead>School Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.map((school: any) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>{school.address || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditDialogOpen(school.id)}
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
                                <AlertDialogTitle>Delete School</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{school.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(school.id)}
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

export default Schools;
