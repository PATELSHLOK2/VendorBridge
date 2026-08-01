import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  phone: z.string().optional(),
  country: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  additionalInfo: z.string().optional(),
});
