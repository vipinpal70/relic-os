import { z } from "zod";

export const CaseValidationSchema = z.object({
  applicationNumber: z.string().min(3, "Application Number must be at least 3 characters"),
  applicantName: z.string().min(2, "Applicant Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number (10 digits starting with 6-9)"),
  loanAmount: z.coerce.number().min(1, "Loan Amount must be greater than 0"),
  loanType: z.string().min(1, "Loan Type is required"),
  bankId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Bank ID"),
  channelPartnerId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Channel Partner ID")
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val),
  assignedUserId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Assigned User ID")
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val),
  status: z.enum(["New", "Pending", "Approved", "Rejected", "Disbursed"]).default("New"),
  disbursedAmount: z.coerce.number().min(0).default(0),
  remarks: z.string().optional().or(z.literal("")),
});
