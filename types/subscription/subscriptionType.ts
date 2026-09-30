import { Document } from 'mongoose';

export interface ISubscription extends Document {
  packageId: string;
  studentId: string;
  paymentId: string;
  createdBy: string;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  isActive?: boolean;
  isDeleted?: boolean;
  imageUrl?: string;
}

export interface ISubscriptionPaymentBody {
  packageId: string;
  studentId: string;
  paymentId: string;
  createdBy: string;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  paymentGatewayId: string;
  paymentRef: string;
  comment: string;
  status: string;
  deviceId: string;
  userIP: string;
  packageCostId: string;
  paymentGateway: string;
}

export interface ISubscriptionBody {
  packageId: string;
  studentId: string;
  paymentId: string;
  createdBy: string;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
}

export interface IOfflinePaymentBody {
  packageId: string;
  studentId: string;
  paymentId: string;
  createdBy: string;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  paymentGatewayId: string;
  paymentRef: string;
  comment: string;
  status: string;
  deviceId: string;
  userIP: string;
  packageCostId: string;
  paymentGateway: string;
  amount: number;
  imageUrl?: string;
  paymentDate: Date;
}

export interface ISubscriptionWithStudent extends ISubscription {
  studentName?: string;
}

export interface IRevenueDetails {
  /** Revenue for the period asked for. The current month when no range is sent. */
  currentMonthRevenue: number;
  /** Change against the previous period of the same length (the previous month when no range is sent). */
  growthPercentage: number;
  previousRevenue: number;
  range: { from: string; to: string };
}
