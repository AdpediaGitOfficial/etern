import { Document } from 'mongoose';
import { IStudentBody } from '../student/studentType';

export interface IUsers extends Document {
  fullName: string;
  mobileNumber: number;
  dob: Date;
  userType?: 'child' | 'teenager' | 'adult';
  email?: string;
  parentName?: string;
  parentDob?: Date;
  avatar?: string;
  otp?: string;
  mobileNumberVerified?: boolean;
  isDeleted?: boolean;
  gender?: string;
  interest?: string;
  status?: number;
  password?: string;
  role?: string;
  currentStudentId?: string;
  fixedOtp?: string;
}

export interface IUserAuth extends Document {
  userId: string;
  deviceId: string;
  deviceType: string;
  authToken: string;
  isActive: boolean;
}

export interface IUserBody {
  fullName?: string;
  mobileNumber: number;
  dob: Date;
  userType?: 'child' | 'teenager' | 'adult';
  email?: string;
  parentName?: string;
  parentDob?: Date;
  gender?: string;
  status?: number;
  role?: string;
  interest?: string;
  currentStudentId?: string;
  otp?: string;
}

export interface IOtpBody {
  mobileNumber: number;
  otp: string;
  deviceId: string;
  deviceType: 'web' | 'mobile';
  type?: string;
  fixedOtp?: string;
}

export interface ILoginBody {
  email: string;
  password: string;
}

export interface IAdminBody {
  fullName?: string;
  mobileNumber: number;
  email?: string;
  gender?: string;
  status?: number;
  role?: string;
  password?: string;
}

export interface IUserDobBody {
  userId: string;
  parentDobYear: number;
  parentName: string;
}

export interface IDobBody {
  userId: string;
  parentDob: Date;
  parentName: string;
}

export interface IUserProfile extends IUserBody {
  studentDetails?: IStudentBody;
}

export interface IUserCount {
  totalUsers: number;
  totalStudents: number;
  registeredThisMonth: number;
  /** Students who bought or renewed a plan in the period (renewals included). */
  subscribedThisMonth: number;
  /** Of the students who joined in the period: how many have no plan running now. */
  freeUsersThisMonth: number;
  /** Of the students who joined in the period: how many have a plan running now. Use this for conversion. */
  newStudentsSubscribed: number;
  /** The period the three "ThisMonth" numbers cover. The current month when no range is sent. */
  range: { from: string; to: string };
}
