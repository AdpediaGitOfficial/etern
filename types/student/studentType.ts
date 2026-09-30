import { Document } from 'mongoose';

export interface IStudent extends Document {
  fullName: string;
  dob: Date;
  gender?: string;
  avatar?: string;
  packageId?: string;
  userId: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  subscribed?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  status?: number;
}

export interface IStudentBody {
  fullName?: string;
  dob: Date;
  gender?: string;
  avatar?: string;
  packageId?: string;
  userId?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  subscribed?: boolean;
}

export interface IStudentSubscription {
  packageId: string;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  subscribed: boolean;
}

export interface IStudentFilters {
  fullName?: string;
  subscribed?: boolean;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  isExpired?: boolean;
  expiresIn7Days?: boolean;
}

export interface IEnrichedStudent extends IStudent {
  mobileNumber?: string;
  email?: string;
  parentName?: string;
  mobileNumberVerified?: boolean;
  createdAt?: Date;
}

export interface PaymentInfo {
  amount: number;
  paymentDate: Date;
}

export interface StudentWithPayments extends IStudent {
  payments?: PaymentInfo[];
}
