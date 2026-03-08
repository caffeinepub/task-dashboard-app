import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaskStatus } from "../backend.d";
import { useActor } from "./useActor";

// ─── Auth / Profile ────────────────────────────────────────────────────────

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
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
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: {
      email: string;
      role: string;
      isBlocked: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
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
    refetchInterval: 30000, // refresh every 30s
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
    }: {
      taskId: bigint;
      title: string;
      image: Uint8Array | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      // Motoko ?Blob is encoded as undefined (None) or Uint8Array (Some) by the ICP SDK
      // Do NOT pass null — it must be either a Uint8Array or undefined
      const imageArg: Uint8Array | undefined =
        image !== null && image !== undefined ? image : undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.updateTask(taskId, title, imageArg as any);
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
    case "declined":
      return "Declined";
    default:
      return "Pending";
  }
}
