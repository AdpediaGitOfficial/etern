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
