import { z } from "zod";

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
});

export const CorporateValidationSchema = CorporateBaseSchema;

export const CorporateUpdateValidationSchema = CorporateBaseSchema.partial();
