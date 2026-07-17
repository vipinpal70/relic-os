import { z } from "zod";

export const CommissionRuleValidationSchema = z.object({
  loanType: z.string().min(1, "Loan Type is required"),
  commissionValue: z.coerce.number().min(0, "Commission value must be at least 0"),
  commissionType: z.enum(["Fixed", "Percentage"]),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Effective From must be YYYY-MM-DD"),
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Effective To must be YYYY-MM-DD")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  minAmount: z.coerce.number().min(0).optional().default(0),
  maxAmount: z.coerce.number().min(0).optional().default(999999999),
}).refine(data => {
  if (data.effectiveTo && data.effectiveFrom > data.effectiveTo) {
    return false;
  }
  return true;
}, {
  message: "Effective To date must be after Effective From date",
  path: ["effectiveTo"],
});

// Validate that there are no duplicate loan types in the commission table for the same active period
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

const BankBaseSchema = z.object({
  bankName: z.string().min(2, "Bank Name must be at least 2 characters"),
  branch: z.string().min(2, "Branch must be at least 2 characters"),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code (e.g. SBIN0001234)"),
  managerName: z.string().optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number (10 digits starting with 6-9)")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  state: z.string().min(1, "State is required").optional().or(z.literal("")),
  city: z.string().min(1, "City is required").optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  commissionTable: z.array(CommissionRuleValidationSchema).default([]),
});

export const BankValidationSchema = BankBaseSchema.refine(
  data => noDuplicateLoanTypes.check(data.commissionTable),
  { message: noDuplicateLoanTypes.message, path: noDuplicateLoanTypes.path }
);

// Zod v4 forbids .partial() on schemas with object-level refinements,
// so the update schema is built from the base object before refining.
export const BankUpdateValidationSchema = BankBaseSchema.partial().refine(
  data => noDuplicateLoanTypes.check(data.commissionTable),
  { message: noDuplicateLoanTypes.message, path: noDuplicateLoanTypes.path }
);
