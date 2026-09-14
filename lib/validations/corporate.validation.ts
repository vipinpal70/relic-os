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

const CorporateBaseSchema = z.object({
  corporateName: z.string().min(2, "Corporate Name must be at least 2 characters"),
  contactPerson: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number (10 digits starting with 6-9)")
    .optional()
    .or(z.literal("")),
  gst: z.string().optional().or(z.literal("")),
  pan: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  state: z.string().min(1, "State is required").optional().or(z.literal("")),
  city: z.string().min(1, "City is required").optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  notes: z.string().optional().or(z.literal("")),
  commissionTable: z.array(CommissionRuleValidationSchema).default([]),
});

export const CorporateValidationSchema = CorporateBaseSchema.refine(
  data => noDuplicateLoanTypes.check(data.commissionTable),
  { message: noDuplicateLoanTypes.message, path: noDuplicateLoanTypes.path }
);

// Zod v4 forbids .partial() on schemas with object-level refinements,
// so the update schema is built from the base object before refining.
export const CorporateUpdateValidationSchema = CorporateBaseSchema.partial().refine(
  data => noDuplicateLoanTypes.check(data.commissionTable),
  { message: noDuplicateLoanTypes.message, path: noDuplicateLoanTypes.path }
);
