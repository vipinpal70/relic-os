import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface InvoiceLineItem {
  leadId: string;
  applicationNumber: string;
  applicantName: string;
  loanType: string;
  loanAmount: number;
  disbursedAmount: number;
  rate: number;
  commissionType: "Fixed" | "Percentage";
  commissionAmount: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  entityType: "Bank" | "ChannelPartner";
  entityId: string;
  entitySnapshot: {
    name: string;
    branch?: string;
    ifsc?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    gst?: string;
    pan?: string;
  };
  invoiceDate: string;
  periodStart?: string;
  periodEnd?: string;
  lineItems: InvoiceLineItem[];
  totalApplications: number;
  totalLoanAmount: number;
  totalDisbursedAmount: number;
  commissionSubtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: "Generated" | "Sent" | "Paid" | "Cancelled";
  paidDate?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillableLead {
  _id: string;
  applicationNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanType: string;
  status: string;
  disbursedAmount: number;
  disbursedDate?: string;
  billableAmount: number;
  suggestedRate: number;
  suggestedCommissionType: "Fixed" | "Percentage";
  suggestedCommission: number;
  needsRateOverride: boolean;
}

export interface GenerateInvoicePayload {
  entityType: "Bank" | "ChannelPartner";
  entityId: string;
  leadIds: string[];
  periodStart?: string;
  periodEnd?: string;
  taxRate: number;
  lineOverrides?: Record<string, { rate: number; commissionType: "Fixed" | "Percentage" }>;
  notes?: string;
}

export function useInvoices(
  params: {
    entityType?: "Bank" | "ChannelPartner";
    entityId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
  options: { enabled?: boolean } = {}
) {
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ["invoices", params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/invoices?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: options.enabled !== false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["billableLeads"] });
  };

  const generateInvoiceMutation = useMutation({
    mutationFn: async (payload: GenerateInvoicePayload): Promise<Invoice> => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate invoice");
      }
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: () => invalidate(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      paidDate,
    }: {
      id: string;
      status: "Sent" | "Paid";
      paidDate?: string;
    }): Promise<Invoice> => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paidDate }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update invoice");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: async (id: string): Promise<Invoice> => {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel invoice");
      }
      return res.json();
    },
    onSuccess: () => invalidate(),
  });

  return {
    data: invoicesQuery.data?.data || [],
    total: invoicesQuery.data?.total || 0,
    isLoading: invoicesQuery.isLoading,
    error: invoicesQuery.error,
    generateInvoice: generateInvoiceMutation.mutateAsync,
    isGenerating: generateInvoiceMutation.isPending,
    updateInvoiceStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    cancelInvoice: cancelInvoiceMutation.mutateAsync,
    isCancelling: cancelInvoiceMutation.isPending,
  };
}

export function useInvoice(id: string) {
  const invoiceQuery = useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return res.json();
    },
    enabled: !!id,
  });

  return {
    invoice: invoiceQuery.data,
    isLoading: invoiceQuery.isLoading,
    error: invoiceQuery.error,
  };
}

export function useBillableLeads(params: {
  entityType: "Bank" | "ChannelPartner";
  entityId: string;
  startDate?: string;
  endDate?: string;
}) {
  const billableQuery = useQuery<{ data: BillableLead[]; total: number }>({
    queryKey: ["billableLeads", params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/invoices/billable-leads?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch billable applications");
      return res.json();
    },
    enabled: !!params.entityId,
  });

  return {
    data: billableQuery.data?.data || [],
    total: billableQuery.data?.total || 0,
    isLoading: billableQuery.isLoading,
    error: billableQuery.error,
  };
}
