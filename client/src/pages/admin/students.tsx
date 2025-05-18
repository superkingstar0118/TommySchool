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
import { Users, Edit, PlusCircle, Search, Trash2, User, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/formatUtils";

// Define form schema for student
const studentFormSchema = z.object({
  user: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(1, "Full name is required"),
  }),
  student: z.object({
    classId: z.string().min(1, "Class is required"),
  }),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

const Students = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

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
  
  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students'],
    enabled: !!user && user.role === 'admin',
  });
  
  // Get selected student for editing
  const selectedStudent = students?.find((s: any) => s.id === selectedStudentId);
  
  // Filter students based on search query and class filter
  const filteredStudents = students?.filter((student: any) => {
    // Filter by name or email
    const searchMatch = 
      student.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.user.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by class
    const classMatch = classFilter === "all" || student.classId.toString() === classFilter;
    
    return searchMatch && classMatch;
  }) || [];
  
  // Form for adding/editing a student
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      user: {
        username: "",
        password: "",
        email: "",
        fullName: "",
      },
      student: {
        classId: "",
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
      student: {
        classId: "",
      },
    });
    setIsAddDialogOpen(true);
  };
  
  // Set form values when opening edit dialog
  const handleEditDialogOpen = (id: number) => {
    const student = students?.find((s: any) => s.id === id);
    if (student) {
      form.reset({
        user: {
          username: student.user.username,
          password: "", // Don't populate password for security
          email: student.user.email,
          fullName: student.user.fullName,
        },
        student: {
          classId: student.classId.toString(),
        },
      });
      setSelectedStudentId(id);
      setIsEditDialogOpen(true);
    }
  };
  
  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (data: StudentFormValues) => {
      const payload = {
        student: {
          classId: parseInt(data.student.classId),
        },
        user: {
          ...data.user,
        },
      };
      return apiRequest('POST', '/api/students', payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create student: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: (data: StudentFormValues) => {
      // Only include password if it was changed
      const userData = data.user.password 
        ? { ...data.user } 
        : { 
            username: data.user.username,
            email: data.user.email,
            fullName: data.user.fullName,
          };
      
      const payload = {
        student: {
          classId: parseInt(data.student.classId),
        },
        user: userData,
      };
      return apiRequest('PUT', `/api/students/${selectedStudentId}`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update student: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/students/${id}`, undefined),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: StudentFormValues) => {
    if (isAddDialogOpen) {
      createMutation.mutate(data);
    } else if (isEditDialogOpen && selectedStudentId) {
      updateMutation.mutate(data);
    }
  };
  
  // Get class name by id
  const getClassName = (classId: number) => {
    const cls = classes?.find((c: any) => c.id === classId);
    return cls ? cls.name : "Unknown Class";
  };
  
  // Get school name by class id
  const getSchoolByClassId = (classId: number) => {
    const cls = classes?.find((c: any) => c.id === classId);
    if (!cls) return "Unknown School";
    
    const school = schools?.find((s: any) => s.id === cls.schoolId);
    return school ? school.name : "Unknown School";
  };
  
  return (
    <DashboardLayout pageTitle="Students">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Management</h1>
        <p className="text-gray-500">
          Add, edit, and manage students in the system
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>
              All students registered in the platform
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search students..."
                className="pl-8 w-[200px] md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddDialogOpen}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Enter student details below to add a new student to the system.
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
                      <h3 className="text-sm font-medium text-gray-700">Class Assignment</h3>
                      
                      <FormField
                        control={form.control}
                        name="student.classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classes?.map((cls: any) => (
                                  <SelectItem key={cls.id} value={cls.id.toString()}>
                                    {cls.name} ({getSchoolByClassId(cls.id)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                        {createMutation.isPending ? "Creating..." : "Create Student"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Student</DialogTitle>
                  <DialogDescription>
                    Update the student details below.
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
                      <h3 className="text-sm font-medium text-gray-700">Class Assignment</h3>
                      
                      <FormField
                        control={form.control}
                        name="student.classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classes?.map((cls: any) => (
                                  <SelectItem key={cls.id} value={cls.id.toString()}>
                                    {cls.name} ({getSchoolByClassId(cls.id)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                        {updateMutation.isPending ? "Updating..." : "Update Student"}
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
            {isLoadingStudents || isLoadingClasses || isLoadingSchools ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center p-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium">No students found</h3>
                <p className="text-gray-500">
                  {searchQuery || classFilter !== "all"
                    ? "Try adjusting your filters" 
                    : "Add your first student to get started"}
                </p>
                {(searchQuery || classFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => {
                      setSearchQuery("");
                      setClassFilter("all");
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
                    <TableHead>Student</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>
                              {getInitials(student.user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.user.fullName}</div>
                            <div className="flex items-center mt-1">
                              <RoleBadge role="student" />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.user.username}</TableCell>
                      <TableCell>{student.user.email}</TableCell>
                      <TableCell>{getClassName(student.classId)}</TableCell>
                      <TableCell>{getSchoolByClassId(student.classId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditDialogOpen(student.id)}
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
                                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{student.user.fullName}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(student.id)}
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

export default Students;
