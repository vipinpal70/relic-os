import { z } from "zod";
import { CommissionRuleValidationSchema } from "./bank.validation";

// Validate that there are no duplicate loan types in the commission table
const noDuplicateLoanTypes = {
  check: (commissionTable?: Array<{ loanType: string }>) => {
    if (!commissionTable) return true;
    const loanTypes = commissionTable.map(r => r.loanType.toLowerCase());
    const uniqueLoanTypes = new Set(loanTypes);
    return uniqueLoanTypes.size === loanTypes.length;
  },
  message: "Duplicate Loan Types are not allowed in the commission table",
  path: ["commissionTable"],
};

const ChannelPartnerBaseSchema = z.object({
  name: z.string().min(2, "Partner Name must be at least 2 characters"),
  companyName: z.string().min(2, "Company Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number (10 digits starting with 6-9)"),
  alternativePhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid alternative mobile number")
    .optional()
    .or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  state: z.string().min(1, "State is required").optional().or(z.literal("")),
  city: z.string().min(1, "City is required").optional().or(z.literal("")),
  gst: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)")
    .optional()
    .or(z.literal("")),
  pan: z
    .string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, "Invalid PAN format (e.g. ABCDE1234F)")
    .optional()
    .or(z.literal("")),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  notes: z.string().optional().or(z.literal("")),
  profileImage: z.string().optional().or(z.literal("")),
  commissionTable: z.array(CommissionRuleValidationSchema).default([]),
});

export const ChannelPartnerValidationSchema = ChannelPartnerBaseSchema.refine(
  data => noDuplicateLoanTypes.check(data.commissionTable),
  { message: noDuplicateLoanTypes.message, path: noDuplicateLoanTypes.path }
);

// Zod v4 forbids .partial() on schemas with object-level refinements,
// so the update schema is built from the base object before refining.
export const ChannelPartnerUpdateValidationSchema = ChannelPartnerBaseSchema.partial().refine(
  data => noDuplicateLoanTypes.check(data.commissionTable),
  { message: noDuplicateLoanTypes.message, path: noDuplicateLoanTypes.path }
);
