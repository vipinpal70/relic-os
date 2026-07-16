import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BankCommissionRule } from "./useBanks";

export interface ChannelPartner {
  _id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  address?: string;
  state?: string;
  city?: string;
  gst?: string;
  pan?: string;
  status: "Active" | "Inactive";
  notes?: string;
  profileImage?: string;
  commissionTable: BankCommissionRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ChannelPartnerStats {
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

export function useChannelPartners(params: {
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

  const partnersQuery = useQuery<{ data: ChannelPartner[]; total: number }>({
    queryKey: ["channelPartners", params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/channel-partners?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch channel partners");
      return res.json();
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: Partial<ChannelPartner>) => {
      const res = await fetch("/api/channel-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create channel partner");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channelPartners"] });
    },
  });

  return {
    data: partnersQuery.data?.data || [],
    total: partnersQuery.data?.total || 0,
    isLoading: partnersQuery.isLoading,
    error: partnersQuery.error,
    createPartner: createPartnerMutation.mutateAsync,
    isCreating: createPartnerMutation.isPending,
  };
}

export function useChannelPartnerDetails(id: string) {
  const queryClient = useQueryClient();

  const detailsQuery = useQuery<{ partner: ChannelPartner; stats: ChannelPartnerStats }>({
    queryKey: ["channelPartner", id],
    queryFn: async () => {
      const res = await fetch(`/api/channel-partners/${id}`);
      if (!res.ok) throw new Error("Failed to fetch partner details");
      return res.json();
    },
    enabled: !!id,
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async (data: Partial<ChannelPartner>) => {
      const res = await fetch(`/api/channel-partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update channel partner");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channelPartner", id] });
      queryClient.invalidateQueries({ queryKey: ["channelPartners"] });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/channel-partners/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete channel partner");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channelPartners"] });
    },
  });

  return {
    partner: detailsQuery.data?.partner,
    stats: detailsQuery.data?.stats,
    isLoading: detailsQuery.isLoading,
    error: detailsQuery.error,
    updatePartner: updatePartnerMutation.mutateAsync,
    isUpdating: updatePartnerMutation.isPending,
    deletePartner: deletePartnerMutation.mutateAsync,
    isDeleting: deletePartnerMutation.isPending,
  };
}

export function useChannelPartnerAnalytics(id: string, dateFilters: { startDate?: string; endDate?: string } = {}) {
  return useQuery({
    queryKey: ["partnerAnalytics", id, dateFilters],
    queryFn: async () => {
      const queryStr = new URLSearchParams(dateFilters as any).toString();
      const res = await fetch(`/api/channel-partners/${id}/analytics?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch partner analytics");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useChannelPartnerLeads(id: string, params: any = {}) {
  return useQuery({
    queryKey: ["partnerLeads", id, params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params).toString();
      const res = await fetch(`/api/channel-partners/${id}/leads?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch partner leads");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useChannelPartnerTransactions(id: string) {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery<any[]>({
    queryKey: ["partnerTransactions", id],
    queryFn: async () => {
      const res = await fetch(`/api/channel-partners/${id}/transactions`);
      if (!res.ok) throw new Error("Failed to fetch partner transactions");
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
      const res = await fetch(`/api/channel-partners/${id}/transactions`, {
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
      queryClient.invalidateQueries({ queryKey: ["partnerTransactions", id] });
      queryClient.invalidateQueries({ queryKey: ["channelPartner", id] });
      queryClient.invalidateQueries({ queryKey: ["partnerCommissions", id] });
    },
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    recordPayment: recordPaymentMutation.mutateAsync,
    isRecording: recordPaymentMutation.isPending,
  };
}

export function useChannelPartnerCommissions(id: string, params: any = {}) {
  return useQuery({
    queryKey: ["partnerCommissions", id, params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params).toString();
      const res = await fetch(`/api/channel-partners/${id}/commission?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch partner commissions");
      return res.json();
    },
    enabled: !!id,
  });
}
