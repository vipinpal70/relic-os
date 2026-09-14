import { z } from "zod";

const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const GenerateInvoiceSchema = z.object({
  entityType: z.enum(["Bank", "ChannelPartner", "Corporate"]),
  entityId: z.string().min(1, "Entity is required"),
  leadIds: z.array(z.string().min(1)).min(1, "Select at least one application"),
  periodStart: DateString.optional(),
  periodEnd: DateString.optional(),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100).default(18),
  // Keyed by leadId; the server recomputes every amount from these rates and
  // never trusts client-side totals.
  lineOverrides: z
    .record(
      z.string(),
      z.object({
        rate: z.coerce.number().min(0),
        commissionType: z.enum(["Fixed", "Percentage"]),
      })
    )
    .optional(),
  notes: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceSchema>;

export const UpdateInvoiceStatusSchema = z.object({
  status: z.enum(["Sent", "Paid"]),
  paidDate: DateString.optional(),
});

export type UpdateInvoiceStatusInput = z.infer<typeof UpdateInvoiceStatusSchema>;
