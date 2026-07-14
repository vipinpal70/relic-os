import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Case {
  _id: string;
  applicationNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanType: string;
  bankId: { _id: string; bankName: string; branch: string } | string;
  channelPartnerId?: { _id: string; name: string; companyName: string } | string;
  assignedUserId?: { _id: string; name: string; email: string } | string;
  status: "New" | "Pending" | "Approved" | "Rejected" | "Disbursed";
  disbursedAmount: number;
  approvedDate?: string;
  disbursedDate?: string;
  bankExpectedCommission: number;
  bankPaidCommission: number;
  bankPendingCommission: number;
  partnerExpectedCommission: number;
  partnerPaidCommission: number;
  partnerPendingCommission: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export function useCases(params: {
  search?: string;
  status?: string;
  bankId?: string;
  channelPartnerId?: string;
  loanType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
} = {}) {
  const queryClient = useQueryClient();

  const casesQuery = useQuery<{ data: Case[]; total: number }>({
    queryKey: ["cases", params],
    queryFn: async () => {
      const cleanParams: any = {};
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== "") cleanParams[key] = val;
      });
      const queryStr = new URLSearchParams(cleanParams).toString();
      const res = await fetch(`/api/cases?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch cases");
      return res.json();
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: Partial<Case>) => {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create case");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      // Invalidate related bank and partner queries so their stats refresh!
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      queryClient.invalidateQueries({ queryKey: ["channelPartners"] });
      queryClient.invalidateQueries({ queryKey: ["bank"] });
      queryClient.invalidateQueries({ queryKey: ["channelPartner"] });
    },
  });

  return {
    data: casesQuery.data?.data || [],
    total: casesQuery.data?.total || 0,
    isLoading: casesQuery.isLoading,
    error: casesQuery.error,
    createCase: createCaseMutation.mutateAsync,
    isCreating: createCaseMutation.isPending,
  };
}

export function useCaseDetails(id: string) {
  const queryClient = useQueryClient();

  const detailsQuery = useQuery<Case>({
    queryKey: ["case", id],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${id}`);
      if (!res.ok) throw new Error("Failed to fetch case details");
      return res.json();
    },
    enabled: !!id,
  });

  const updateCaseMutation = useMutation({
    mutationFn: async (data: Partial<Case>) => {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update case");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["bank"] });
      queryClient.invalidateQueries({ queryKey: ["channelPartner"] });
    },
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cases/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete case");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["bank"] });
      queryClient.invalidateQueries({ queryKey: ["channelPartner"] });
    },
  });

  return {
    caseData: detailsQuery.data,
    isLoading: detailsQuery.isLoading,
    error: detailsQuery.error,
    updateCase: updateCaseMutation.mutateAsync,
    isUpdating: updateCaseMutation.isPending,
    deleteCase: deleteCaseMutation.mutateAsync,
    isDeleting: deleteCaseMutation.isPending,
  };
}
