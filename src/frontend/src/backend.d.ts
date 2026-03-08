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
export interface BankDetails {
    ifscCode: string;
    bankName: string;
    accountNumber: string;
}
export interface Task {
    id: bigint;
    reward: bigint;
    title: string;
    image?: Blob;
}
export interface PaymentRequest {
    id: bigint;
    status: Variant_pending_transferred_approved_declined_inPayment;
    userId: Principal;
    createdAt: bigint;
    orderId: string;
    amount: bigint;
    coinsDeducted: boolean;
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
    bankDetails?: BankDetails;
    coinBalance: bigint;
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
export enum Variant_pending_transferred_approved_declined_inPayment {
    pending = "pending",
    transferred = "transferred",
    approved = "approved",
    declined = "declined",
    inPayment = "inPayment"
}
export enum Variant_transferred_approved_declined_inPayment {
    transferred = "transferred",
    approved = "approved",
    declined = "declined",
    inPayment = "inPayment"
}
export interface backendInterface {
    addCoins(userId: Principal, amount: bigint): Promise<void>;
    adminUpdateBankDetails(userId: Principal, ifscCode: string, bankName: string, accountNumber: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(userId: Principal): Promise<void>;
    clearAllData(): Promise<void>;
    deductCoins(userId: Principal, amount: bigint): Promise<void>;
    deleteUser(userId: Principal): Promise<void>;
    freezeAccountForCheat(userId: Principal): Promise<void>;
    getAllPayments(): Promise<Array<PaymentRequest>>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getAllUsersAnalytics(): Promise<Array<{
        userId: Principal;
        tasksCompleted: bigint;
        email: string;
        totalSubmissions: bigint;
        lastLogin?: bigint;
    }>>;
    getBankDetails(userId: Principal): Promise<BankDetails | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoinBalance(userId: Principal): Promise<bigint>;
    getTasks(): Promise<Array<Task>>;
    getUserAnalytics(userId: Principal): Promise<{
        tasksCompleted: bigint;
        totalSubmissions: bigint;
        lastLogin?: bigint;
    }>;
    getUserPayments(userId: Principal): Promise<Array<PaymentRequest>>;
    getUserProfile(_user: Principal): Promise<UserProfile | null>;
    getUserSubmissions(userId: Principal): Promise<Array<Submission>>;
    isCallerAdmin(): Promise<boolean>;
    isPinAdmin(): Promise<boolean>;
    recordLastLogin(): Promise<void>;
    requestPayment(amount: bigint): Promise<void>;
    reviewPayment(paymentId: bigint, approve: boolean): Promise<void>;
    reviewSubmission(submissionId: bigint, approve: boolean): Promise<void>;
    saveBankDetails(ifscCode: string, bankName: string, accountNumber: string): Promise<void>;
    saveCallerUserProfile(profile: {
        isBlocked: boolean;
        role: string;
        email: string;
    }): Promise<void>;
    submitTask(taskId: bigint, file: Blob): Promise<void>;
    unblockUser(userId: Principal): Promise<void>;
    updatePaymentStatus(paymentId: bigint, newStatus: Variant_transferred_approved_declined_inPayment): Promise<void>;
    updateTask(taskId: bigint, title: string, image: Blob | null, reward: bigint): Promise<void>;
}
