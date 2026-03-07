import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Blob = Uint8Array;
export interface Task {
    id: bigint;
    title: string;
    image?: Blob;
}
export interface Submission {
    id: bigint;
    status: TaskStatus;
    userId: Principal;
    file: Blob;
    createdAt: bigint;
    taskId: bigint;
}
export interface UserProfile {
    isBlocked: boolean;
    role: string;
    email: string;
}
export enum TaskStatus {
    pending = "pending",
    approved = "approved",
    declined = "declined"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(userId: Principal): Promise<void>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTasks(): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSubmissions(userId: Principal): Promise<Array<Submission>>;
    isCallerAdmin(): Promise<boolean>;
    reviewSubmission(submissionId: bigint, approve: boolean): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitTask(taskId: bigint, file: Blob): Promise<void>;
    unblockUser(userId: Principal): Promise<void>;
    updateTask(taskId: bigint, title: string, image: Blob | null): Promise<void>;
}
