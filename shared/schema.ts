import { pgTable, text, serial, integer, boolean, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for user roles
export const roleEnum = pgEnum('role', ['admin', 'assessor', 'student']);

// Enum for assessment status
export const assessmentStatusEnum = pgEnum('assessment_status', ['draft', 'completed']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Schools table
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
});

// Classes table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

// Students table - extends users
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  classId: integer("class_id").notNull().references(() => classes.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

// Assessors table - extends users
export const assessors = pgTable("assessors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  schoolIds: integer("school_ids").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssessorSchema = createInsertSchema(assessors).omit({
  id: true,
  createdAt: true,
});

// Rubric templates table
export const rubricTemplates = pgTable("rubric_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  criteria: jsonb("criteria").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRubricTemplateSchema = createInsertSchema(rubricTemplates).omit({
  id: true,
  createdAt: true,
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  rubricTemplateId: integer("rubric_template_id").notNull().references(() => rubricTemplates.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

// Class Tasks - join table between classes and tasks
export const classTasks = pgTable("class_tasks", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClassTaskSchema = createInsertSchema(classTasks).omit({
  id: true,
  createdAt: true,
});

// Assessments table
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  assessorId: integer("assessor_id").notNull().references(() => assessors.id),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  status: assessmentStatusEnum("status").notNull().default('draft'),
  scores: jsonb("scores").notNull(),
  totalScore: integer("total_score").notNull(),
  feedback: text("feedback"),
  pdfPath: text("pdf_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define types
export type Role = z.infer<typeof roleEnum.enum>;
export type AssessmentStatus = z.infer<typeof assessmentStatusEnum.enum>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Assessor = typeof assessors.$inferSelect;
export type InsertAssessor = z.infer<typeof insertAssessorSchema>;

export type RubricTemplate = typeof rubricTemplates.$inferSelect;
export type InsertRubricTemplate = z.infer<typeof insertRubricTemplateSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type ClassTask = typeof classTasks.$inferSelect;
export type InsertClassTask = z.infer<typeof insertClassTaskSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

// Extended types (for frontend use)
export type AssessmentWithRelations = Assessment & {
  student: Student & { user: User };
  assessor: Assessor & { user: User };
  task: Task & { rubricTemplate: RubricTemplate };
};

export type ClassWithRelations = Class & {
  school: School;
  students: (Student & { user: User })[];
  classTasks: (ClassTask & { task: Task })[];
};

export type SchoolWithRelations = School & {
  classes: Class[];
};
