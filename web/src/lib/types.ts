export interface Stats {
  totalUsers: number;
  totalStudents: number;
  registeredThisMonth: number;
  subscribedThisMonth: number;
  freeUsersThisMonth: number;
  /** Of the students who joined in the period, how many have a plan now. Older backends omit it. */
  newStudentsSubscribed?: number;
  range?: { from: string; to: string };
}
export interface Revenue {
  currentMonthRevenue: number;
  growthPercentage: number | null;
  previousRevenue?: number;
}
export interface SubscriptionPoint {
  subscription_date: string;
  /** YYYY-MM-DD. Sent by newer backends. */
  date?: string;
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
  /** MongoDB keeps the grouping key as _id; the ids are present on real responses but not guaranteed. */
  _id?: { courseMaterialId?: string; subCategoryId?: string };
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
  /** Worked out by the backend from the dates. Older backends omit these; see lib/access.ts. */
  accessStatus?: 'subscribed' | 'expiring' | 'lapsed' | 'free';
  daysLeft?: number | null;
  parentName?: string;
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

export type Kind = 'kid' | 'parent';
export interface PackageRow {
  _id: string;
  packageName: string;
  ageFrom: number;
  ageTo: number;
  description?: string;
  isActive: boolean;
  packageCosts?: { _id?: string; price: number; validity: number; from: string; to: string }[];
}
export interface CategoryRow {
  _id: string;
  categoryName: string;
  sorting: number;
  type: Kind;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  packageId: { _id: string; packageName: string };
}
export interface SubCategoryRow {
  _id: string;
  subCategoryName: string;
  sorting: number;
  type: Kind;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  categoryId: { _id: string; categoryName: string; packageId?: { packageName?: string } };
}
export interface CourseMaterialRow {
  _id: string;
  courseMaterialName: string;
  courseMaterialUrl: string;
  sorting: number;
  type: Kind;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  subCategoryId: { _id: string; subCategoryName: string; categoryId: { _id: string; categoryName: string } };
}

export interface Journey {
  student: { _id: string; fullName: string; dob?: string; gender: string; avatar: string; isActive: boolean; createdAt: string;
    parent: { name: string; mobileNumber: number | string | null; email: string } };
  access: { subscribed: boolean; accessStatus: 'subscribed' | 'expiring' | 'lapsed' | 'free'; isFreeVersion: boolean; daysLeft: number | null;
    packageId: string; packageName: string; subscriptionStartDate: string | null; subscriptionEndDate: string | null;
    freeVersion: { enabled: boolean; perSubCategory: number }; totalVideos: number; openVideos: number };
  metrics: { videosViewed: number; videosViewedAllTime: number; completionPercent: number; activeDaysLast30: number; firstActivityAt: string | null; lastActivityAt: string | null };
  learning: { categories: { categoryId: string; name: string; total: number; viewed: number; locked: number }[];
    recent: { name: string; category: string; viewedAt: string; viewedPercentage: number | null; locked: boolean }[] };
  subscriptions: { _id: string; packageName: string; start: string; end: string; boughtAt: string; amount: number; mode: string; recordedBy: string; state: 'running' | 'ended' | 'upcoming' }[];
  timeline: { at: string; kind: 'joined' | 'learn' | 'paid' | 'ended' | 'warn' | 'now'; title: string; detail: string }[];
}
export interface SegmentCounts { all: number; active: number; expiring: number; lapsed: number; never: number }
