import {
  users, User, InsertUser,
  schools, School, InsertSchool,
  classes, Class, InsertClass,
  students, Student, InsertStudent,
  assessors, Assessor, InsertAssessor,
  rubricTemplates, RubricTemplate, InsertRubricTemplate,
  tasks, Task, InsertTask,
  classTasks, ClassTask, InsertClassTask,
  assessments, Assessment, InsertAssessment,
  Role, AssessmentStatus, 
  AssessmentWithRelations, ClassWithRelations, SchoolWithRelations
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // School operations
  getSchool(id: number): Promise<School | undefined>;
  getSchools(): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined>;
  deleteSchool(id: number): Promise<boolean>;
  
  // Class operations
  getClass(id: number): Promise<Class | undefined>;
  getClasses(schoolId?: number): Promise<Class[]>;
  createClass(cls: InsertClass): Promise<Class>;
  updateClass(id: number, cls: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
  getClassWithRelations(id: number): Promise<ClassWithRelations | undefined>;
  
  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudents(classId?: number): Promise<Student[]>;
  createStudent(student: InsertStudent, userData: InsertUser): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  
  // Assessor operations
  getAssessor(id: number): Promise<Assessor | undefined>;
  getAssessors(): Promise<Assessor[]>;
  createAssessor(assessor: InsertAssessor, userData: InsertUser): Promise<Assessor>;
  updateAssessor(id: number, assessor: Partial<InsertAssessor>): Promise<Assessor | undefined>;
  deleteAssessor(id: number): Promise<boolean>;
  getAssessorByUserId(userId: number): Promise<Assessor | undefined>;
  
  // Rubric Template operations
  getRubricTemplate(id: number): Promise<RubricTemplate | undefined>;
  getRubricTemplates(): Promise<RubricTemplate[]>;
  createRubricTemplate(template: InsertRubricTemplate): Promise<RubricTemplate>;
  updateRubricTemplate(id: number, template: Partial<InsertRubricTemplate>): Promise<RubricTemplate | undefined>;
  deleteRubricTemplate(id: number): Promise<boolean>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasks(rubricTemplateId?: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Class Task operations
  getClassTask(id: number): Promise<ClassTask | undefined>;
  getClassTasks(classId?: number, taskId?: number): Promise<ClassTask[]>;
  createClassTask(classTask: InsertClassTask): Promise<ClassTask>;
  deleteClassTask(id: number): Promise<boolean>;
  
  // Assessment operations
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessments(filters?: {
    studentId?: number;
    assessorId?: number;
    taskId?: number;
    status?: AssessmentStatus;
  }): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  getAssessmentWithRelations(id: number): Promise<AssessmentWithRelations | undefined>;
  
  // Advanced queries
  getClassesForAssessor(assessorId: number): Promise<Class[]>;
  getStudentsForClass(classId: number): Promise<(Student & { user: User })[]>;
  getTasksForClass(classId: number): Promise<Task[]>;
  getAssessmentsForStudent(studentId: number): Promise<Assessment[]>;
  getAssessmentsForClass(classId: number): Promise<Assessment[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private schools: Map<number, School>;
  private classes: Map<number, Class>;
  private students: Map<number, Student>;
  private assessors: Map<number, Assessor>;
  private rubricTemplates: Map<number, RubricTemplate>;
  private tasks: Map<number, Task>;
  private classTasks: Map<number, ClassTask>;
  private assessments: Map<number, Assessment>;
  
  private userId: number = 1;
  private schoolId: number = 1;
  private classId: number = 1;
  private studentId: number = 1;
  private assessorId: number = 1;
  private rubricTemplateId: number = 1;
  private taskId: number = 1;
  private classTaskId: number = 1;
  private assessmentId: number = 1;
  
  constructor() {
    this.users = new Map();
    this.schools = new Map();
    this.classes = new Map();
    this.students = new Map();
    this.assessors = new Map();
    this.rubricTemplates = new Map();
    this.tasks = new Map();
    this.classTasks = new Map();
    this.assessments = new Map();
    
    // Add some demo data
    this.seedDemoData();
  }
  
  private seedDemoData() {
    // Create admin user
    const adminUser: User = {
      id: this.userId++,
      username: 'admin',
      password: 'admin123', // In a real app, this would be hashed
      email: 'admin@example.com',
      fullName: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
    
    // Create sample schools
    const school1: School = {
      id: this.schoolId++,
      name: 'Westside High School',
      address: '123 West Street',
      createdAt: new Date(),
    };
    this.schools.set(school1.id, school1);
    
    const school2: School = {
      id: this.schoolId++,
      name: 'Eastside Academy',
      address: '456 East Avenue',
      createdAt: new Date(),
    };
    this.schools.set(school2.id, school2);
    
    // Create sample classes
    const class1: Class = {
      id: this.classId++,
      name: 'English 10A',
      schoolId: school1.id,
      createdAt: new Date(),
    };
    this.classes.set(class1.id, class1);
    
    const class2: Class = {
      id: this.classId++,
      name: 'Science 11B',
      schoolId: school1.id,
      createdAt: new Date(),
    };
    this.classes.set(class2.id, class2);
    
    const class3: Class = {
      id: this.classId++,
      name: 'Literature 12C',
      schoolId: school2.id,
      createdAt: new Date(),
    };
    this.classes.set(class3.id, class3);
    
    // Create assessor user
    const assessorUser: User = {
      id: this.userId++,
      username: 'assessor',
      password: 'assessor123', // In a real app, this would be hashed
      email: 'assessor@example.com',
      fullName: 'John Smith',
      role: 'assessor',
      createdAt: new Date(),
    };
    this.users.set(assessorUser.id, assessorUser);
    
    // Create assessor
    const assessor: Assessor = {
      id: this.assessorId++,
      userId: assessorUser.id,
      schoolIds: [school1.id, school2.id],
      createdAt: new Date(),
    };
    this.assessors.set(assessor.id, assessor);
    
    // Create student users
    const studentUser1: User = {
      id: this.userId++,
      username: 'student1',
      password: 'student123', // In a real app, this would be hashed
      email: 'student1@example.com',
      fullName: 'Jordan Smith',
      role: 'student',
      createdAt: new Date(),
    };
    this.users.set(studentUser1.id, studentUser1);
    
    const studentUser2: User = {
      id: this.userId++,
      username: 'student2',
      password: 'student123', // In a real app, this would be hashed
      email: 'student2@example.com',
      fullName: 'Emma Johnson',
      role: 'student',
      createdAt: new Date(),
    };
    this.users.set(studentUser2.id, studentUser2);
    
    // Create students
    const student1: Student = {
      id: this.studentId++,
      userId: studentUser1.id,
      classId: class1.id,
      createdAt: new Date(),
    };
    this.students.set(student1.id, student1);
    
    const student2: Student = {
      id: this.studentId++,
      userId: studentUser2.id,
      classId: class1.id,
      createdAt: new Date(),
    };
    this.students.set(student2.id, student2);
    
    // Create sample rubric template
    const writingRubric: RubricTemplate = {
      id: this.rubricTemplateId++,
      name: 'Writing Skills Rubric',
      description: 'Rubric for evaluating writing skills',
      criteria: [
        { id: 1, name: 'Content Knowledge', description: 'Understanding of key concepts and subject matter' },
        { id: 2, name: 'Analysis & Critical Thinking', description: 'Ability to analyze information, draw conclusions, and think critically' },
        { id: 3, name: 'Organization & Structure', description: 'Logical organization and clear structure of ideas and information' },
        { id: 4, name: 'Language & Communication', description: 'Use of appropriate language, grammar, and ability to communicate ideas' },
        { id: 5, name: 'Creativity & Innovation', description: 'Original thinking, creative solutions, and innovative approaches' }
      ],
      createdAt: new Date(),
    };
    this.rubricTemplates.set(writingRubric.id, writingRubric);
    
    // Create sample tasks
    const task1: Task = {
      id: this.taskId++,
      name: 'Text Response Essay',
      description: 'Write a response to the provided text',
      rubricTemplateId: writingRubric.id,
      createdAt: new Date(),
    };
    this.tasks.set(task1.id, task1);
    
    const task2: Task = {
      id: this.taskId++,
      name: 'Creative Writing Assignment',
      description: 'Create an original piece of creative writing',
      rubricTemplateId: writingRubric.id,
      createdAt: new Date(),
    };
    this.tasks.set(task2.id, task2);
    
    // Assign tasks to classes
    const classTask1: ClassTask = {
      id: this.classTaskId++,
      classId: class1.id,
      taskId: task1.id,
      createdAt: new Date(),
    };
    this.classTasks.set(classTask1.id, classTask1);
    
    const classTask2: ClassTask = {
      id: this.classTaskId++,
      classId: class1.id,
      taskId: task2.id,
      createdAt: new Date(),
    };
    this.classTasks.set(classTask2.id, classTask2);
    
    // Create sample assessment
    const assessment1: Assessment = {
      id: this.assessmentId++,
      studentId: student1.id,
      assessorId: assessor.id,
      taskId: task1.id,
      status: 'completed',
      scores: {
        1: 3, // Content Knowledge: 3/5
        2: 4, // Analysis & Critical Thinking: 4/5
        3: 5, // Organization & Structure: 5/5
        4: 3, // Language & Communication: 3/5
        5: 4  // Creativity & Innovation: 4/5
      },
      totalScore: 19, // Out of 25
      feedback: "Jordan demonstrates excellent organization and structure in their essay. Their analytical skills are strong, showing good critical thinking in their interpretation of the text. Areas for improvement include expanding content knowledge with more specific examples from the text, and working on grammar and sentence structure for clearer communication. Overall, this is a solid effort with great potential for further development.",
      pdfPath: '/pdfs/JordanSmith_TextResponseEssay.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.assessments.set(assessment1.id, assessment1);
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    return this.schools.get(id);
  }
  
  async getSchools(): Promise<School[]> {
    return Array.from(this.schools.values());
  }
  
  async createSchool(school: InsertSchool): Promise<School> {
    const id = this.schoolId++;
    const newSchool: School = { ...school, id, createdAt: new Date() };
    this.schools.set(id, newSchool);
    return newSchool;
  }
  
  async updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined> {
    const existingSchool = this.schools.get(id);
    if (!existingSchool) return undefined;
    
    const updatedSchool: School = { ...existingSchool, ...school };
    this.schools.set(id, updatedSchool);
    return updatedSchool;
  }
  
  async deleteSchool(id: number): Promise<boolean> {
    return this.schools.delete(id);
  }
  
  // Class operations
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }
  
  async getClasses(schoolId?: number): Promise<Class[]> {
    const allClasses = Array.from(this.classes.values());
    if (schoolId) {
      return allClasses.filter(cls => cls.schoolId === schoolId);
    }
    return allClasses;
  }
  
  async createClass(cls: InsertClass): Promise<Class> {
    const id = this.classId++;
    const newClass: Class = { ...cls, id, createdAt: new Date() };
    this.classes.set(id, newClass);
    return newClass;
  }
  
  async updateClass(id: number, cls: Partial<InsertClass>): Promise<Class | undefined> {
    const existingClass = this.classes.get(id);
    if (!existingClass) return undefined;
    
    const updatedClass: Class = { ...existingClass, ...cls };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }
  
  async deleteClass(id: number): Promise<boolean> {
    return this.classes.delete(id);
  }
  
  async getClassWithRelations(id: number): Promise<ClassWithRelations | undefined> {
    const cls = this.classes.get(id);
    if (!cls) return undefined;
    
    const school = this.schools.get(cls.schoolId);
    if (!school) return undefined;
    
    const students = Array.from(this.students.values())
      .filter(student => student.classId === id)
      .map(student => {
        const user = this.users.get(student.userId);
        return { ...student, user: user! };
      });
    
    const classTasks = Array.from(this.classTasks.values())
      .filter(classTask => classTask.classId === id)
      .map(classTask => {
        const task = this.tasks.get(classTask.taskId);
        return { ...classTask, task: task! };
      });
    
    return {
      ...cls,
      school,
      students,
      classTasks,
    };
  }
  
  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }
  
  async getStudents(classId?: number): Promise<Student[]> {
    const allStudents = Array.from(this.students.values());
    if (classId) {
      return allStudents.filter(student => student.classId === classId);
    }
    return allStudents;
  }
  
  async createStudent(student: InsertStudent, userData: InsertUser): Promise<Student> {
    // First create the user
    const userWithRole: InsertUser = { ...userData, role: 'student' };
    const user = await this.createUser(userWithRole);
    
    // Then create the student
    const id = this.studentId++;
    const newStudent: Student = { ...student, id, userId: user.id, createdAt: new Date() };
    this.students.set(id, newStudent);
    return newStudent;
  }
  
  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const existingStudent = this.students.get(id);
    if (!existingStudent) return undefined;
    
    const updatedStudent: Student = { ...existingStudent, ...student };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }
  
  async deleteStudent(id: number): Promise<boolean> {
    const student = this.students.get(id);
    if (student) {
      this.users.delete(student.userId);
    }
    return this.students.delete(id);
  }
  
  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.userId === userId);
  }
  
  // Assessor operations
  async getAssessor(id: number): Promise<Assessor | undefined> {
    return this.assessors.get(id);
  }
  
  async getAssessors(): Promise<Assessor[]> {
    return Array.from(this.assessors.values());
  }
  
  async createAssessor(assessor: InsertAssessor, userData: InsertUser): Promise<Assessor> {
    // First create the user
    const userWithRole: InsertUser = { ...userData, role: 'assessor' };
    const user = await this.createUser(userWithRole);
    
    // Then create the assessor
    const id = this.assessorId++;
    const newAssessor: Assessor = { ...assessor, id, userId: user.id, createdAt: new Date() };
    this.assessors.set(id, newAssessor);
    return newAssessor;
  }
  
  async updateAssessor(id: number, assessor: Partial<InsertAssessor>): Promise<Assessor | undefined> {
    const existingAssessor = this.assessors.get(id);
    if (!existingAssessor) return undefined;
    
    const updatedAssessor: Assessor = { ...existingAssessor, ...assessor };
    this.assessors.set(id, updatedAssessor);
    return updatedAssessor;
  }
  
  async deleteAssessor(id: number): Promise<boolean> {
    const assessor = this.assessors.get(id);
    if (assessor) {
      this.users.delete(assessor.userId);
    }
    return this.assessors.delete(id);
  }
  
  async getAssessorByUserId(userId: number): Promise<Assessor | undefined> {
    return Array.from(this.assessors.values()).find(assessor => assessor.userId === userId);
  }
  
  // Rubric Template operations
  async getRubricTemplate(id: number): Promise<RubricTemplate | undefined> {
    return this.rubricTemplates.get(id);
  }
  
  async getRubricTemplates(): Promise<RubricTemplate[]> {
    return Array.from(this.rubricTemplates.values());
  }
  
  async createRubricTemplate(template: InsertRubricTemplate): Promise<RubricTemplate> {
    const id = this.rubricTemplateId++;
    const newTemplate: RubricTemplate = { ...template, id, createdAt: new Date() };
    this.rubricTemplates.set(id, newTemplate);
    return newTemplate;
  }
  
  async updateRubricTemplate(id: number, template: Partial<InsertRubricTemplate>): Promise<RubricTemplate | undefined> {
    const existingTemplate = this.rubricTemplates.get(id);
    if (!existingTemplate) return undefined;
    
    const updatedTemplate: RubricTemplate = { ...existingTemplate, ...template };
    this.rubricTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteRubricTemplate(id: number): Promise<boolean> {
    return this.rubricTemplates.delete(id);
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasks(rubricTemplateId?: number): Promise<Task[]> {
    const allTasks = Array.from(this.tasks.values());
    if (rubricTemplateId) {
      return allTasks.filter(task => task.rubricTemplateId === rubricTemplateId);
    }
    return allTasks;
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const newTask: Task = { ...task, id, createdAt: new Date() };
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask: Task = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Class Task operations
  async getClassTask(id: number): Promise<ClassTask | undefined> {
    return this.classTasks.get(id);
  }
  
  async getClassTasks(classId?: number, taskId?: number): Promise<ClassTask[]> {
    const allClassTasks = Array.from(this.classTasks.values());
    if (classId && taskId) {
      return allClassTasks.filter(ct => ct.classId === classId && ct.taskId === taskId);
    } else if (classId) {
      return allClassTasks.filter(ct => ct.classId === classId);
    } else if (taskId) {
      return allClassTasks.filter(ct => ct.taskId === taskId);
    }
    return allClassTasks;
  }
  
  async createClassTask(classTask: InsertClassTask): Promise<ClassTask> {
    const id = this.classTaskId++;
    const newClassTask: ClassTask = { ...classTask, id, createdAt: new Date() };
    this.classTasks.set(id, newClassTask);
    return newClassTask;
  }
  
  async deleteClassTask(id: number): Promise<boolean> {
    return this.classTasks.delete(id);
  }
  
  // Assessment operations
  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }
  
  async getAssessments(filters?: {
    studentId?: number;
    assessorId?: number;
    taskId?: number;
    status?: AssessmentStatus;
  }): Promise<Assessment[]> {
    let result = Array.from(this.assessments.values());
    
    if (filters) {
      if (filters.studentId) {
        result = result.filter(a => a.studentId === filters.studentId);
      }
      if (filters.assessorId) {
        result = result.filter(a => a.assessorId === filters.assessorId);
      }
      if (filters.taskId) {
        result = result.filter(a => a.taskId === filters.taskId);
      }
      if (filters.status) {
        result = result.filter(a => a.status === filters.status);
      }
    }
    
    return result;
  }
  
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentId++;
    const now = new Date();
    const newAssessment: Assessment = { 
      ...assessment, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }
  
  async updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const existingAssessment = this.assessments.get(id);
    if (!existingAssessment) return undefined;
    
    const updatedAssessment: Assessment = { 
      ...existingAssessment, 
      ...assessment,
      updatedAt: new Date()
    };
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }
  
  async deleteAssessment(id: number): Promise<boolean> {
    return this.assessments.delete(id);
  }
  
  async getAssessmentWithRelations(id: number): Promise<AssessmentWithRelations | undefined> {
    const assessment = this.assessments.get(id);
    if (!assessment) return undefined;
    
    const student = this.students.get(assessment.studentId);
    if (!student) return undefined;
    
    const studentUser = this.users.get(student.userId);
    if (!studentUser) return undefined;
    
    const assessor = this.assessors.get(assessment.assessorId);
    if (!assessor) return undefined;
    
    const assessorUser = this.users.get(assessor.userId);
    if (!assessorUser) return undefined;
    
    const task = this.tasks.get(assessment.taskId);
    if (!task) return undefined;
    
    const rubricTemplate = this.rubricTemplates.get(task.rubricTemplateId);
    if (!rubricTemplate) return undefined;
    
    return {
      ...assessment,
      student: { ...student, user: studentUser },
      assessor: { ...assessor, user: assessorUser },
      task: { ...task, rubricTemplate }
    };
  }
  
  // Advanced queries
  async getClassesForAssessor(assessorId: number): Promise<Class[]> {
    const assessor = this.assessors.get(assessorId);
    if (!assessor) return [];
    
    return Array.from(this.classes.values())
      .filter(cls => assessor.schoolIds.includes(cls.schoolId));
  }
  
  async getStudentsForClass(classId: number): Promise<(Student & { user: User })[]> {
    const students = Array.from(this.students.values())
      .filter(student => student.classId === classId);
    
    return students.map(student => {
      const user = this.users.get(student.userId);
      return { ...student, user: user! };
    });
  }
  
  async getTasksForClass(classId: number): Promise<Task[]> {
    const classTasksForClass = Array.from(this.classTasks.values())
      .filter(ct => ct.classId === classId);
    
    return classTasksForClass.map(ct => this.tasks.get(ct.taskId)!)
      .filter(task => task !== undefined);
  }
  
  async getAssessmentsForStudent(studentId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values())
      .filter(assessment => assessment.studentId === studentId);
  }
  
  async getAssessmentsForClass(classId: number): Promise<Assessment[]> {
    const studentsInClass = Array.from(this.students.values())
      .filter(student => student.classId === classId);
    
    const studentIds = studentsInClass.map(student => student.id);
    
    return Array.from(this.assessments.values())
      .filter(assessment => studentIds.includes(assessment.studentId));
  }
}

export const storage = new MemStorage();
