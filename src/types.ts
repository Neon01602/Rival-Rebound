export type Difficulty = 'easy' | 'medium' | 'hard';
export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isFlagged: boolean;
  isTerminated: boolean;
  lastActive: any;
  rollNumber?: string;
  activeExamId?: string;
  examStartTime?: string; // ISO string
  submittedExams?: string[]; // array of examIds the student has already submitted
}

export interface Exam {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  timeLimit: number; // in minutes
  terminatedAt?: string | null; // ISO string set by admin to force-end exam
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: Difficulty;
  section: string;
}

export interface UserResponse {
  userId: string;
  examId: string;
  questionId: string;
  selectedOption: number;
  timestamp: any;
  isCorrect: boolean;
  timeTaken: number; // in seconds
  score: number;
}

export interface AdminConfig {
  email?: string;
  passwordHash?: string;
  hashcode?: string;
  isInitialized: boolean;
}