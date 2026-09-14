import { z } from "zod";

export const LeadValidationSchema = z.object({
  applicationNumber: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val.trim().length >= 3, "Application Number must be at least 3 characters if provided")
    .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined)),
  applicantName: z.string().min(2, "Applicant Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    // Normalize real-world formats ("+91 98765 43210", "098765-43210") to a bare 10-digit number
    .transform((val) => {
      let digits = val.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
      if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
      return digits;
    })
    .refine((val) => /^[6-9]\d{9}$/.test(val), "Invalid mobile number (10 digits starting with 6-9)"),
  loanAmount: z.coerce.number().min(1, "Loan Amount must be greater than 0"),
  loanType: z.string().min(1, "Loan Type is required"),
  bankId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Bank ID"),
  channelPartnerId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Channel Partner ID")
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val),
  corporateId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Corporate ID")
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val),
  assignedUserId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Assigned User ID")
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val),
  status: z.enum([
    "Underwriting", "Sanctioned", "Reject", "PDD", "Not Interested", "Disbursed", "Not Contactable",
    "Not Intrested", "Rejected", "New", "Assigned", "Not Connected", "Document Pending", "Processing", "Approved", "Pending",
  ]).default("Underwriting"),
  disbursedAmount: z.coerce.number().min(0).default(0),
  remarks: z.string().optional().or(z.literal("")),
});
