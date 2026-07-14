import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface LoanType {
  _id: string;
  name: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export function useLoanTypes(status?: string) {
  const queryClient = useQueryClient();

  const loanTypesQuery = useQuery<LoanType[]>({
    queryKey: ["loanTypes", status],
    queryFn: async () => {
      const url = status ? `/api/loan-types?status=${status}` : "/api/loan-types";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch loan types");
      return res.json();
    },
  });

  const createLoanTypeMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/loan-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create loan type");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanTypes"] });
    },
  });

  const updateLoanTypeMutation = useMutation({
    mutationFn: async ({ id, status, name }: { id: string; status?: "Active" | "Inactive"; name?: string }) => {
      const res = await fetch(`/api/loan-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, name }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update loan type");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanTypes"] });
    },
  });

  return {
    loanTypes: loanTypesQuery.data || [],
    isLoading: loanTypesQuery.isLoading,
    error: loanTypesQuery.error,
    createLoanType: createLoanTypeMutation.mutateAsync,
    isCreating: createLoanTypeMutation.isPending,
    updateLoanType: updateLoanTypeMutation.mutateAsync,
    isUpdating: updateLoanTypeMutation.isPending,
  };
}
