import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface BankCommissionRule {
  _id?: string;
  loanType: string;
  commissionValue: number;
  commissionType: "Fixed" | "Percentage";
  effectiveFrom: string;
  effectiveTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface Bank {
  _id: string;
  bankName: string;
  branch: string;
  ifsc: string;
  managerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  city?: string;
  status: "Active" | "Inactive";
  commissionTable: BankCommissionRule[];
  createdAt: string;
  updatedAt: string;
}

export interface BankStats {
  allTime: {
    totalLeads: number;
    approvedLeads: number;
    rejectedLeads: number;
    pendingLeads: number;
    disbursedLeads: number;
    totalLoanAmount: number;
    disbursedAmount: number;
    commissionExpected: number;
    commissionPaid: number;
    commissionPending: number;
  };
  currentMonth: {
    leads: number;
    amount: number;
    commissionExpected: number;
    commissionPaid: number;
    commissionPending: number;
  };
}

export interface BankListStats {
  total: number;
  active: number;
  monthLeads: number;
  monthLoanAmount: number;
  paidCommission: number;
  pendingCommission: number;
}

export function useBanks(params: {
  search?: string;
  status?: string;
  state?: string;
  city?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
} = {}) {
  const queryClient = useQueryClient();

  const banksQuery = useQuery<{ data: Bank[]; total: number; stats: BankListStats }>({
    queryKey: ["banks", params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/banks?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch banks");
      return res.json();
    },
  });

  const createBankMutation = useMutation({
    mutationFn: async (data: Partial<Bank>) => {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create bank");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });

  return {
    data: banksQuery.data?.data || [],
    total: banksQuery.data?.total || 0,
    stats: banksQuery.data?.stats,
    isLoading: banksQuery.isLoading,
    error: banksQuery.error,
    createBank: createBankMutation.mutateAsync,
    isCreating: createBankMutation.isPending,
  };
}

export function useBankDetails(id: string) {
  const queryClient = useQueryClient();

  const detailsQuery = useQuery<{ bank: Bank; stats: BankStats }>({
    queryKey: ["bank", id],
    queryFn: async () => {
      const res = await fetch(`/api/banks/${id}`);
      if (!res.ok) throw new Error("Failed to fetch bank details");
      return res.json();
    },
    enabled: !!id,
  });

  const updateBankMutation = useMutation({
    mutationFn: async (data: Partial<Bank>) => {
      const res = await fetch(`/api/banks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update bank");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank", id] });
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/banks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete bank");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });

  return {
    bank: detailsQuery.data?.bank,
    stats: detailsQuery.data?.stats,
    isLoading: detailsQuery.isLoading,
    error: detailsQuery.error,
    updateBank: updateBankMutation.mutateAsync,
    isUpdating: updateBankMutation.isPending,
    deleteBank: deleteBankMutation.mutateAsync,
    isDeleting: deleteBankMutation.isPending,
  };
}

export function useBankAnalytics(id: string, dateFilters: { startDate?: string; endDate?: string } = {}) {
  return useQuery({
    queryKey: ["bankAnalytics", id, dateFilters],
    queryFn: async () => {
      const queryStr = new URLSearchParams(dateFilters as any).toString();
      const res = await fetch(`/api/banks/${id}/analytics?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch bank analytics");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useBankLeads(id: string, params: any = {}) {
  return useQuery({
    queryKey: ["bankLeads", id, params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params).toString();
      const res = await fetch(`/api/banks/${id}/leads?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch bank leads");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useBankTransactions(id: string) {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery<any[]>({
    queryKey: ["bankTransactions", id],
    queryFn: async () => {
      const res = await fetch(`/api/banks/${id}/transactions`);
      if (!res.ok) throw new Error("Failed to fetch bank transactions");
      return res.json();
    },
    enabled: !!id,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: {
      commissionId: string;
      amount: number;
      paymentDate: string;
      paymentMode: "NEFT" | "RTGS" | "IMPS" | "UPI" | "Cheque" | "Cash";
      referenceNumber: string;
      invoiceNumber?: string;
      remarks?: string;
    }) => {
      const res = await fetch(`/api/banks/${id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to record payment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankTransactions", id] });
      queryClient.invalidateQueries({ queryKey: ["bank", id] });
      queryClient.invalidateQueries({ queryKey: ["bankCommissions", id] });
    },
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    recordPayment: recordPaymentMutation.mutateAsync,
    isRecording: recordPaymentMutation.isPending,
  };
}

export function useBankCommissions(id: string, params: any = {}) {
  return useQuery({
    queryKey: ["bankCommissions", id, params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params).toString();
      const res = await fetch(`/api/banks/${id}/commission?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch bank commissions");
      return res.json();
    },
    enabled: !!id,
  });
}
