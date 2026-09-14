import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CommissionRule {
  loanType: string;
  commissionValue: number;
  commissionType: "Fixed" | "Percentage";
  effectiveFrom: string;
  effectiveTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface Corporate {
  _id: string;
  corporateName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gst?: string;
  pan?: string;
  address?: string;
  state?: string;
  city?: string;
  status: "Active" | "Inactive";
  notes?: string;
  commissionTable?: CommissionRule[];
  createdAt: string;
  updatedAt: string;
}

export interface CorporateStats {
  allTime: {
    totalLeads: number;
    approvedLeads: number;
    rejectedLeads: number;
    pendingLeads: number;
    disbursedLeads: number;
    totalLoanAmount: number;
    disbursedAmount: number;
  };
  currentMonth: {
    leads: number;
    amount: number;
  };
}

export interface CorporateListStats {
  total: number;
  active: number;
  monthLeads: number;
  monthLoanAmount: number;
}

export function useCorporates(params: {
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

  const corporatesQuery = useQuery<{ data: Corporate[]; total: number; stats: CorporateListStats }>({
    queryKey: ["corporates", params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/corporates?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch corporates");
      return res.json();
    },
  });

  const createCorporateMutation = useMutation({
    mutationFn: async (data: Partial<Corporate>) => {
      const res = await fetch("/api/corporates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create corporate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporates"] });
    },
  });

  const updateCorporateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Corporate> }) => {
      const res = await fetch(`/api/corporates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update corporate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporates"] });
    },
  });

  return {
    data: corporatesQuery.data?.data || [],
    total: corporatesQuery.data?.total || 0,
    stats: corporatesQuery.data?.stats,
    isLoading: corporatesQuery.isLoading,
    error: corporatesQuery.error,
    createCorporate: createCorporateMutation.mutateAsync,
    isCreating: createCorporateMutation.isPending,
    updateCorporate: updateCorporateMutation.mutateAsync,
    isUpdating: updateCorporateMutation.isPending,
  };
}

export function useCorporateDetails(id: string) {
  const queryClient = useQueryClient();

  const detailsQuery = useQuery<{ corporate: Corporate; stats: CorporateStats }>({
    queryKey: ["corporate", id],
    queryFn: async () => {
      const res = await fetch(`/api/corporates/${id}`);
      if (!res.ok) throw new Error("Failed to fetch corporate details");
      return res.json();
    },
    enabled: !!id,
  });

  const updateCorporateMutation = useMutation({
    mutationFn: async (data: Partial<Corporate>) => {
      const res = await fetch(`/api/corporates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update corporate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate", id] });
      queryClient.invalidateQueries({ queryKey: ["corporates"] });
    },
  });

  const deleteCorporateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/corporates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete corporate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporates"] });
    },
  });

  return {
    corporate: detailsQuery.data?.corporate,
    stats: detailsQuery.data?.stats,
    isLoading: detailsQuery.isLoading,
    error: detailsQuery.error,
    updateCorporate: updateCorporateMutation.mutateAsync,
    isUpdating: updateCorporateMutation.isPending,
    deleteCorporate: deleteCorporateMutation.mutateAsync,
    isDeleting: deleteCorporateMutation.isPending,
  };
}

export function useCorporateLeads(id: string, params: any = {}) {
  return useQuery({
    queryKey: ["corporateLeads", id, params],
    queryFn: async () => {
      const queryStr = new URLSearchParams(params).toString();
      const res = await fetch(`/api/corporates/${id}/leads?${queryStr}`);
      if (!res.ok) throw new Error("Failed to fetch corporate leads");
      return res.json();
    },
    enabled: !!id,
  });
}
