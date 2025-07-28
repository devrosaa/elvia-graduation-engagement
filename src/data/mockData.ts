import { Student, Job } from "../types";

// Mock Data as specified in the technical challenge
const students: Student[] = [
  {
    id: 1,
    name: "Ana",
    phone: "+14155552671",
    graduation_date: "2025-07-20",
    title: "Técnico en Expresión gráfica",
    education_institution: "Universidad Técnica XYZ",
  },
  {
    id: 2,
    name: "Carlos",
    phone: "+14155552672",
    graduation_date: "2025-07-20",
    title: "Técnico en Expresión gráfica",
    education_institution: "Universidad Técnica XYZ",
  },
];

const jobs: Job[] = [
  {
    id: 101,
    title: "Diseñador técnico junior",
    type: "full-time",
    model: "remote",
  },
  {
    id: 102,
    title: "Analista de mercadeo",
    type: "part-time",
    model: "remote",
  },
  {
    id: 103,
    title: "Analista comunicación interna",
    type: "full-time",
    model: "on-site",
  },
  {
    id: 104,
    title: "Diseñador asistente de mercadeo",
    type: "part-time",
    model: "on-site",
  },
];

// Helper functions for data access
const getStudentById = (id: number): Student | undefined => {
  return students.find((student) => student.id === id);
};

const getStudentsByGraduationDate = (date: string): Student[] => {
  return students.filter((student) => student.graduation_date === date);
};

const getJobsByPreferences = (
  type?: string | null,
  model?: string | null
): Job[] => {
  return jobs.filter((job) => {
    const typeMatch = !type || job.type === type;
    const modelMatch = !model || job.model === model;
    return typeMatch && modelMatch;
  });
};

const getAllJobs = (): Job[] => {
  return [...jobs];
};

export {
  students,
  jobs,
  getStudentById,
  getStudentsByGraduationDate,
  getJobsByPreferences,
  getAllJobs,
};
