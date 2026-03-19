import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaskStatus } from "../backend.d";
import { useActor } from "./useActor";

// ─── Bank Details ───────────────────────────────────────────────────────────

export function useGetBankDetails(userId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["bankDetails", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getBankDetails(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useSaveBankDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ifscCode,
      bankName,
      accountNumber,
    }: { ifscCode: string; bankName: string; accountNumber: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveBankDetails(ifscCode, bankName, accountNumber);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      void queryClient.invalidateQueries({ queryKey: ["bankDetails"] });
    },
  });
}

export function useAdminUpdateBankDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      ifscCode,
      bankName,
      accountNumber,
    }: {
      userId: Principal;
      ifscCode: string;
      bankName: string;
      accountNumber: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminUpdateBankDetails(
        userId,
        ifscCode,
        bankName,
        accountNumber,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allUsersAnalytics"] });
      void queryClient.invalidateQueries({ queryKey: ["bankDetails"] });
    },
  });
}

export function useFreezeAccountForCheat() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.freezeAccountForCheat(userId);
    },
  });
}

// ─── Auth / Profile ────────────────────────────────────────────────────────

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      // Race the backend call against a 15-second timeout so the loading
      // screen never hangs forever if the canister is unresponsive.
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Profile load timed out")), 8000),
      );
      const profilePromise = actor.getCallerUserProfile();
      return Promise.race([profilePromise, timeoutPromise]);
    },
    enabled: !!actor && !isFetching,
    // No refetchInterval here — polling causes stale loading state on slow networks
    // Retry up to 2 times with backoff before showing the error screen
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: {
      email: string;
      role: string;
      isBlocked: boolean;
    }) => {
      if (isFetching) throw new Error("Still connecting, please wait…");
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      void queryClient.refetchQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useGetCoinBalance(userId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["coinBalance", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return BigInt(0);
      return actor.getCoinBalance(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
    refetchInterval: 5000, // refresh every 5s
  });
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export function useTasks() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      const tasks = await actor.getTasks();
      return [...tasks].sort((a, b) => Number(a.id - b.id));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      file,
    }: { taskId: bigint; file: Uint8Array }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitTask(taskId, file);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userSubmissions"] });
      void queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      title,
      image,
      reward,
    }: {
      taskId: bigint;
      title: string;
      image: Uint8Array | null;
      reward: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      // Motoko ?Blob is encoded as undefined (None) or Uint8Array (Some) by the ICP SDK
      // Do NOT pass null — it must be either a Uint8Array or undefined
      const imageArg: Uint8Array | undefined =
        image !== null && image !== undefined ? image : undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.updateTask(taskId, title, imageArg as any, reward);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ─── Submissions ───────────────────────────────────────────────────────────

export function useUserSubmissions(userId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userSubmissions", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getUserSubmissions(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
    refetchInterval: 5000,
  });
}

export function useAllSubmissions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allSubmissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSubmissions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
  });
}

export function useReviewSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      submissionId,
      approve,
    }: {
      submissionId: bigint;
      approve: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.reviewSubmission(submissionId, approve);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
      void queryClient.invalidateQueries({ queryKey: ["userSubmissions"] });
    },
  });
}

// ─── Users ─────────────────────────────────────────────────────────────────

export function useGetUserProfile(userId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getUserProfile(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.blockUser(userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
      void queryClient.invalidateQueries({ queryKey: ["allUsersAnalytics"] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.unblockUser(userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
      void queryClient.invalidateQueries({ queryKey: ["allUsersAnalytics"] });
    },
  });
}

// ─── Payments ──────────────────────────────────────────────────────────────

export function useUserPayments(userId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userPayments", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getUserPayments(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
    refetchInterval: 5000,
  });
}

export function useRequestPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.requestPayment(amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userPayments"] });
      void queryClient.invalidateQueries({ queryKey: ["allPayments"] });
    },
  });
}

export function useAllPayments() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allPayments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPayments();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
  });
}

export function useReviewPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      approve,
    }: {
      paymentId: bigint;
      approve: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.reviewPayment(paymentId, approve);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allPayments"] });
      void queryClient.invalidateQueries({ queryKey: ["userPayments"] });
      void queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      newStatus,
    }: { paymentId: bigint; newStatus: string }) => {
      if (!actor) throw new Error("Not connected");
      // newStatus is one of: "approved" | "inPayment" | "transferred" | "declined"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updatePaymentStatus(paymentId, {
        [newStatus]: null,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allPayments"] });
      void queryClient.invalidateQueries({ queryKey: ["userPayments"] });
      void queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

// ─── Analytics ─────────────────────────────────────────────────────────────

export function useAllUsersAnalytics() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allUsersAnalytics"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsersAnalytics();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
  });
}

export function useRecordLastLogin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.recordLastLogin();
    },
  });
}

// ─── Admin User Management ─────────────────────────────────────────────────

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteUser(userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allUsersAnalytics"] });
      void queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
      void queryClient.invalidateQueries({ queryKey: ["allPayments"] });
    },
  });
}

export function useClearAllData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.clearAllData();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
      void queryClient.invalidateQueries({ queryKey: ["allPayments"] });
      void queryClient.invalidateQueries({ queryKey: ["allUsersAnalytics"] });
      void queryClient.invalidateQueries({ queryKey: ["userSubmissions"] });
      void queryClient.invalidateQueries({ queryKey: ["userPayments"] });
      void queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Convert a Uint8Array image to an object URL (remember to revoke). */
export function toObjectUrl(data: Uint8Array | undefined): string | null {
  if (!data || data.length === 0) return null;
  return URL.createObjectURL(new Blob([data.buffer as ArrayBuffer]));
}

/** Get color class based on task status */
export function getStatusClass(status: TaskStatus | string): string {
  switch (status) {
    case "approved":
      return "status-approved";
    case "inPayment":
      return "status-in-payment";
    case "transferred":
      return "status-transferred";
    case "declined":
      return "status-declined";
    default:
      return "status-pending";
  }
}

export function getStatusLabel(status: TaskStatus | string): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "inPayment":
      return "In Payment";
    case "transferred":
      return "Transferred";
    case "declined":
      return "Declined";
    default:
      return "Pending";
  }
}
