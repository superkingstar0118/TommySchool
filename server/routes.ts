import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import fs from "fs";
import path from "path";
import { insertUserSchema, insertSchoolSchema, insertClassSchema, insertStudentSchema, insertAssessorSchema, insertRubricTemplateSchema, insertTaskSchema, insertClassTaskSchema, insertAssessmentSchema } from "@shared/schema";
import { z } from "zod";

// Create the PDF directory if it doesn't exist
const pdfDirectory = path.join(process.cwd(), 'pdfs');
if (!fs.existsSync(pdfDirectory)) {
  fs.mkdirSync(pdfDirectory, { recursive: true });
}

// Define a mock PDF generation function (in a real app, this would use a proper PDF library)
const generatePDF = async (assessmentId: number): Promise<string> => {
  // In a real app, this would generate a PDF based on the assessment
  // For now, we'll just return a mock path
  const assessment = await storage.getAssessmentWithRelations(assessmentId);
  if (!assessment) throw new Error('Assessment not found');
  
  const student = assessment.student;
  const task = assessment.task;
  
  const filename = `${student.user.fullName.replace(/\s+/g, '')}_${task.name.replace(/\s+/g, '')}.pdf`;
  const filePath = path.join('pdfs', filename);
  
  // In a real app, we would create an actual PDF here
  // For the mock version, we'll just create an empty file
  fs.writeFileSync(path.join(process.cwd(), filePath), 'Mock PDF content');
  
  return `/${filePath}`;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session management
  app.use(session({
    secret: 'assessment-platform-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));
  
  // Set up passport authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Invalid username' });
      }
      
      // In a real app, we'd use bcrypt to compare passwords
      if (user.password !== password) {
        return done(null, false, { message: 'Invalid password' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Authentication routes
  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user });
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false });
    }
  });
  
  // Authentication middleware for protected routes
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };
  
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && (req.user as any).role === 'admin') {
      return next();
    }
    res.status(403).json({ message: 'Forbidden' });
  };
  
  const isAssessor = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && ((req.user as any).role === 'assessor' || (req.user as any).role === 'admin')) {
      return next();
    }
    res.status(403).json({ message: 'Forbidden' });
  };
  
  const isStudent = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && ((req.user as any).role === 'student' || (req.user as any).role === 'admin')) {
      return next();
    }
    res.status(403).json({ message: 'Forbidden' });
  };
  
  // User routes
  app.get('/api/user', isAuthenticated, async (req, res) => {
    const user = req.user;
    let extendedUser: any = { ...user };
    
    // Add role-specific information
    if (user && (user as any).role === 'assessor') {
      const assessor = await storage.getAssessorByUserId((user as any).id);
      if (assessor) {
        extendedUser.assessorId = assessor.id;
        extendedUser.schoolIds = assessor.schoolIds;
      }
    } else if (user && (user as any).role === 'student') {
      const student = await storage.getStudentByUserId((user as any).id);
      if (student) {
        extendedUser.studentId = student.id;
        extendedUser.classId = student.classId;
        
        // Get the class and school info
        const cls = await storage.getClass(student.classId);
        if (cls) {
          extendedUser.class = cls;
          const school = await storage.getSchool(cls.schoolId);
          if (school) {
            extendedUser.school = school;
          }
        }
      }
    }
    
    res.json(extendedUser);
  });
  
  // School routes (admin only)
  app.get('/api/schools', isAuthenticated, async (req, res) => {
    const schools = await storage.getSchools();
    res.json(schools);
  });
  
  app.get('/api/schools/:id', isAuthenticated, async (req, res) => {
    const school = await storage.getSchool(parseInt(req.params.id));
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  });
  
  app.post('/api/schools', isAdmin, async (req, res) => {
    try {
      const schoolData = insertSchoolSchema.parse(req.body);
      const school = await storage.createSchool(schoolData);
      res.status(201).json(school);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid school data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error creating school' });
    }
  });
  
  app.put('/api/schools/:id', isAdmin, async (req, res) => {
    try {
      const schoolData = insertSchoolSchema.partial().parse(req.body);
      const school = await storage.updateSchool(parseInt(req.params.id), schoolData);
      if (!school) {
        return res.status(404).json({ message: 'School not found' });
      }
      res.json(school);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid school data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error updating school' });
    }
  });
  
  app.delete('/api/schools/:id', isAdmin, async (req, res) => {
    const success = await storage.deleteSchool(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.status(204).end();
  });
  
  // Class routes
  app.get('/api/classes', isAuthenticated, async (req, res) => {
    const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : undefined;
    const classes = await storage.getClasses(schoolId);
    res.json(classes);
  });
  
  app.get('/api/classes/:id', isAuthenticated, async (req, res) => {
    const cls = await storage.getClass(parseInt(req.params.id));
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(cls);
  });
  
  app.get('/api/classes/:id/details', isAuthenticated, async (req, res) => {
    const cls = await storage.getClassWithRelations(parseInt(req.params.id));
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(cls);
  });
  
  app.post('/api/classes', isAdmin, async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      const cls = await storage.createClass(classData);
      res.status(201).json(cls);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid class data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error creating class' });
    }
  });
  
  app.put('/api/classes/:id', isAdmin, async (req, res) => {
    try {
      const classData = insertClassSchema.partial().parse(req.body);
      const cls = await storage.updateClass(parseInt(req.params.id), classData);
      if (!cls) {
        return res.status(404).json({ message: 'Class not found' });
      }
      res.json(cls);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid class data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error updating class' });
    }
  });
  
  app.delete('/api/classes/:id', isAdmin, async (req, res) => {
    const success = await storage.deleteClass(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.status(204).end();
  });
  
  // Student routes
  app.get('/api/students', isAuthenticated, async (req, res) => {
    const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
    const students = await storage.getStudents(classId);
    
    // Fetch user data for each student
    const studentsWithUsers = await Promise.all(
      students.map(async (student) => {
        const user = await storage.getUser(student.userId);
        return { ...student, user };
      })
    );
    
    res.json(studentsWithUsers);
  });
  
  app.get('/api/students/:id', isAuthenticated, async (req, res) => {
    const student = await storage.getStudent(parseInt(req.params.id));
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const user = await storage.getUser(student.userId);
    
    res.json({ ...student, user });
  });
  
  app.post('/api/students', isAdmin, async (req, res) => {
    try {
      const { student, user } = req.body;
      const studentData = insertStudentSchema.parse(student);
      const userData = insertUserSchema.parse(user);
      
      const newStudent = await storage.createStudent(studentData, userData);
      const newUser = await storage.getUser(newStudent.userId);
      
      res.status(201).json({ ...newStudent, user: newUser });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid student data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error creating student' });
    }
  });
  
  app.put('/api/students/:id', isAdmin, async (req, res) => {
    try {
      const studentData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(parseInt(req.params.id), studentData);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      const user = await storage.getUser(student.userId);
      
      res.json({ ...student, user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid student data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error updating student' });
    }
  });
  
  app.delete('/api/students/:id', isAdmin, async (req, res) => {
    const success = await storage.deleteStudent(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(204).end();
  });
  
  // Assessor routes
  app.get('/api/assessors', isAdmin, async (req, res) => {
    const assessors = await storage.getAssessors();
    
    // Fetch user data for each assessor
    const assessorsWithUsers = await Promise.all(
      assessors.map(async (assessor) => {
        const user = await storage.getUser(assessor.userId);
        return { ...assessor, user };
      })
    );
    
    res.json(assessorsWithUsers);
  });
  
  app.get('/api/assessors/:id', isAdmin, async (req, res) => {
    const assessor = await storage.getAssessor(parseInt(req.params.id));
    if (!assessor) {
      return res.status(404).json({ message: 'Assessor not found' });
    }
    
    const user = await storage.getUser(assessor.userId);
    
    res.json({ ...assessor, user });
  });
  
  app.post('/api/assessors', isAdmin, async (req, res) => {
    try {
      const { assessor, user } = req.body;
      const assessorData = insertAssessorSchema.parse(assessor);
      const userData = insertUserSchema.parse(user);
      
      const newAssessor = await storage.createAssessor(assessorData, userData);
      const newUser = await storage.getUser(newAssessor.userId);
      
      res.status(201).json({ ...newAssessor, user: newUser });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid assessor data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error creating assessor' });
    }
  });
  
  app.put('/api/assessors/:id', isAdmin, async (req, res) => {
    try {
      const assessorData = insertAssessorSchema.partial().parse(req.body);
      const assessor = await storage.updateAssessor(parseInt(req.params.id), assessorData);
      if (!assessor) {
        return res.status(404).json({ message: 'Assessor not found' });
      }
      
      const user = await storage.getUser(assessor.userId);
      
      res.json({ ...assessor, user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid assessor data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error updating assessor' });
    }
  });
  
  app.delete('/api/assessors/:id', isAdmin, async (req, res) => {
    const success = await storage.deleteAssessor(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Assessor not found' });
    }
    res.status(204).end();
  });
  
  // Rubric Template routes
  app.get('/api/rubric-templates', isAuthenticated, async (req, res) => {
    const templates = await storage.getRubricTemplates();
    res.json(templates);
  });
  
  app.get('/api/rubric-templates/:id', isAuthenticated, async (req, res) => {
    const template = await storage.getRubricTemplate(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ message: 'Rubric template not found' });
    }
    res.json(template);
  });
  
  app.post('/api/rubric-templates', isAdmin, async (req, res) => {
    try {
      const templateData = insertRubricTemplateSchema.parse(req.body);
      const template = await storage.createRubricTemplate(templateData);
      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid rubric template data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error creating rubric template' });
    }
  });
  
  app.put('/api/rubric-templates/:id', isAdmin, async (req, res) => {
    try {
      const templateData = insertRubricTemplateSchema.partial().parse(req.body);
      const template = await storage.updateRubricTemplate(parseInt(req.params.id), templateData);
      if (!template) {
        return res.status(404).json({ message: 'Rubric template not found' });
      }
      res.json(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid rubric template data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error updating rubric template' });
    }
  });
  
  app.delete('/api/rubric-templates/:id', isAdmin, async (req, res) => {
    const success = await storage.deleteRubricTemplate(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Rubric template not found' });
    }
    res.status(204).end();
  });
  
  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req, res) => {
    const rubricTemplateId = req.query.rubricTemplateId 
      ? parseInt(req.query.rubricTemplateId as string) 
      : undefined;
    const tasks = await storage.getTasks(rubricTemplateId);
    res.json(tasks);
  });
  
  app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    const task = await storage.getTask(parseInt(req.params.id));
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Also fetch the rubric template
    const rubricTemplate = await storage.getRubricTemplate(task.rubricTemplateId);
    
    res.json({ ...task, rubricTemplate });
  });
  
  app.post('/api/tasks', isAdmin, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid task data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error creating task' });
    }
  });
  
  app.put('/api/tasks/:id', isAdmin, async (req, res) => {
    try {
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(parseInt(req.params.id), taskData);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid task data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error updating task' });
    }
  });
  
  app.delete('/api/tasks/:id', isAdmin, async (req, res) => {
    const success = await storage.deleteTask(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(204).end();
  });
  
  // Class Task routes
  app.get('/api/class-tasks', isAuthenticated, async (req, res) => {
    const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
    const taskId = req.query.taskId ? parseInt(req.query.taskId as string) : undefined;
    const classTasks = await storage.getClassTasks(classId, taskId);
    res.json(classTasks);
  });
  
  app.post('/api/class-tasks', isAdmin, async (req, res) => {
    try {
      const classTaskData = insertClassTaskSchema.parse(req.body);
      const classTask = await storage.createClassTask(classTaskData);
      res.status(201).json(classTask);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid class task data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error creating class task' });
    }
  });
  
  app.delete('/api/class-tasks/:id', isAdmin, async (req, res) => {
    const success = await storage.deleteClassTask(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Class task not found' });
    }
    res.status(204).end();
  });
  
  // Assessment routes
  app.get('/api/assessments', isAuthenticated, async (req, res) => {
    const filters: any = {};
    
    if (req.query.studentId) {
      filters.studentId = parseInt(req.query.studentId as string);
    }
    if (req.query.assessorId) {
      filters.assessorId = parseInt(req.query.assessorId as string);
    }
    if (req.query.taskId) {
      filters.taskId = parseInt(req.query.taskId as string);
    }
    if (req.query.status) {
      filters.status = req.query.status as any;
    }
    
    const assessments = await storage.getAssessments(filters);
    
    // For each assessment, fetch the related entities
    const assessmentsWithRelations = await Promise.all(
      assessments.map(async (assessment) => {
        return await storage.getAssessmentWithRelations(assessment.id);
      })
    );
    
    res.json(assessmentsWithRelations.filter(a => a !== undefined));
  });
  
  app.get('/api/assessments/:id', isAuthenticated, async (req, res) => {
    const assessment = await storage.getAssessmentWithRelations(parseInt(req.params.id));
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.json(assessment);
  });
  
  app.post('/api/assessments', isAssessor, async (req, res) => {
    try {
      const assessmentData = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(assessmentData);
      
      // If the assessment is completed, generate a PDF
      if (assessment.status === 'completed') {
        const pdfPath = await generatePDF(assessment.id);
        await storage.updateAssessment(assessment.id, { pdfPath });
      }
      
      const assessmentWithRelations = await storage.getAssessmentWithRelations(assessment.id);
      res.status(201).json(assessmentWithRelations);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid assessment data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error creating assessment' });
    }
  });
  
  app.put('/api/assessments/:id', isAssessor, async (req, res) => {
    try {
      const assessmentData = insertAssessmentSchema.partial().parse(req.body);
      
      // Get the current assessment
      const currentAssessment = await storage.getAssessment(parseInt(req.params.id));
      if (!currentAssessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      // Update the assessment
      const assessment = await storage.updateAssessment(parseInt(req.params.id), assessmentData);
      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      // If the assessment was marked as completed, generate a PDF
      if (assessment.status === 'completed' && 
          (currentAssessment.status !== 'completed' || !currentAssessment.pdfPath)) {
        const pdfPath = await generatePDF(assessment.id);
        await storage.updateAssessment(assessment.id, { pdfPath });
      }
      
      const assessmentWithRelations = await storage.getAssessmentWithRelations(assessment.id);
      res.json(assessmentWithRelations);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid assessment data', errors: err.errors });
      }
      res.status(500).json({ message: 'Error updating assessment' });
    }
  });
  
  app.delete('/api/assessments/:id', isAssessor, async (req, res) => {
    const success = await storage.deleteAssessment(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.status(204).end();
  });
  
  // Other routes for assessors
  app.get('/api/assessors/:id/classes', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Check if user is admin or the assessor themselves
    if (user.role === 'admin' || (user.role === 'assessor' && user.assessorId === parseInt(req.params.id))) {
      const classes = await storage.getClassesForAssessor(parseInt(req.params.id));
      res.json(classes);
    } else {
      res.status(403).json({ message: 'Forbidden - You do not have access to this assessor\'s classes' });
    }
  });
  
  app.get('/api/classes/:id/students', isAssessor, async (req, res) => {
    const students = await storage.getStudentsForClass(parseInt(req.params.id));
    res.json(students);
  });
  
  app.get('/api/classes/:id/tasks', isAssessor, async (req, res) => {
    const tasks = await storage.getTasksForClass(parseInt(req.params.id));
    res.json(tasks);
  });
  
  app.get('/api/classes/:id/assessments', isAssessor, async (req, res) => {
    const assessments = await storage.getAssessmentsForClass(parseInt(req.params.id));
    
    // For each assessment, fetch the related entities
    const assessmentsWithRelations = await Promise.all(
      assessments.map(async (assessment) => {
        return await storage.getAssessmentWithRelations(assessment.id);
      })
    );
    
    res.json(assessmentsWithRelations.filter(a => a !== undefined));
  });
  
  // Additional routes for students
  app.get('/api/students/:id/assessments', isAuthenticated, async (req, res) => {
    const assessments = await storage.getAssessmentsForStudent(parseInt(req.params.id));
    
    // For each assessment, fetch the related entities
    const assessmentsWithRelations = await Promise.all(
      assessments.map(async (assessment) => {
        return await storage.getAssessmentWithRelations(assessment.id);
      })
    );
    
    res.json(assessmentsWithRelations.filter(a => a !== undefined));
  });
  
  // Serve static PDF files
  // Use Express's static middleware for serving PDF files
  app.use('/pdfs', express.static(path.join(process.cwd(), 'pdfs')));
  
  const httpServer = createServer(app);
  return httpServer;
}
