export interface Stats {
  totalUsers: number;
  totalStudents: number;
  registeredThisMonth: number;
  subscribedThisMonth: number;
  freeUsersThisMonth: number;
}
export interface Revenue {
  currentMonthRevenue: number;
  growthPercentage: number | null;
}
export interface SubscriptionPoint {
  subscription_date: string;
  total_subscriptions: number | string;
}
export interface VideoRow {
  subCategoryName: string;
  categoryName: string;
  subCategoryImageUrl?: string;
  totalCourseMaterials: number;
  totalDuration: string;
  studentsCompletedPercentage: number;
}
export interface TrendingRow {
  courseMaterialName: string;
  subCategoryName: string;
  repeatedViews: number;
  distinctStudents: number;
}

export interface Paged<T> {
  data: T[];
  totalCount: number;
}
export interface Student {
  _id: string;
  fullName: string;
  mobileNumber?: string;
  createdAt: string;
  avatar?: string;
  subscribed: boolean;
  subscriptionEndDate?: string | null;
  isActive: boolean;
}
export interface StudentDetail extends Omit<Student, 'mobileNumber'> {
  dob?: string;
  subscriptionStartDate?: string | null;
  userId?: { mobileNumber?: string; email?: string; fullName?: string };
  payments?: { amount: number; paymentDate: string }[];
}
export interface Payment {
  _id: string;
  createdAt: string;
  studentId?: { fullName?: string };
  packageId?: { packageName?: string };
  paymentId?: { amount?: number; paymentRef?: string; paymentDate?: string; status?: string };
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  comment?: string;
  imageUrl?: string;
}
export interface PackageCost {
  _id: string;
  price: number;
  validity?: number;
}
export interface PackageWithCosts {
  _id: string;
  packageName: string;
  description?: string;
  packageCosts?: PackageCost[];
}
