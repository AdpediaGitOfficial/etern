import studentModel from '../models/studentModel';
import packageModel from '../../package/models/packageModel';
import { Types } from 'mongoose';
import {
  IStudent,
  IStudentBody,
  IStudentSubscription,
  IStudentFilters,
  StudentWithPayments,
  PaymentInfo,
} from '../../types/student/studentType';
import AppError from '../../common/appError';
import { HttpStatus } from '../../common/httpStatus';
import { ObjectID } from '../../utils/objectIdParser';
import usersModel from '../../user/models/userModel';
import mongoose from 'mongoose';
import { EXPIRING_DAYS, freeVersionSettings, withAccess } from '../../subscription/accessRules';
import { countPurchasesByDay, findBuyerIds } from '../../subscription/repos/subscriptionRepo';
import { DateRange, dayKeys, lastDays, ordinalDay } from '../../common/dateRange';

export const findStudentExists = async (
  studentId: string,
  userId: string,
): Promise<{ _id: string } | null> => {
  return await studentModel
    .findOne({ _id: studentId, userId, isDeleted: false })
    .select({ _id: 1 })
    .lean();
};

export const findPackage = async (
  studentId: string,
): Promise<{ packageId: string | null } | null> => {
  try {
    const student = await studentModel
      .findOne({ _id: new Types.ObjectId(studentId), isDeleted: false })
      .select('packageId dob subscriptionEndDate subscribed')
      .lean();

    if (!student) return null;

    const now = new Date();

    // 1. If the student HAS a packageId and IS subscribed, check ONLY that subscription
    if (student.packageId && student.subscribed) {
      const expiry = student.subscriptionEndDate ? new Date(student.subscriptionEndDate) : null;

      if (expiry && expiry > now) {
        return { packageId: student.packageId.toString() };
      }
      if (!freeVersionSettings().enabled) {
        // Free version switched off: an expired plan means no access, as before.
        console.log('Subscription expired. Denying access.');
        return null;
      }
      // Free version: fall through to the package for the student's age. Locked videos are handled per video.
    }

    // 2. If they never subscribed, find the default package for their age
    const birthDate = new Date(student.dob);
    let age = now.getFullYear() - birthDate.getFullYear();
    if (now < new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate())) {
      age--;
    }

    const matchingPackage = await packageModel
      .findOne({
        ageFrom: { $lte: age },
        ageTo: { $gte: age },
        isDeleted: false,
        isActive: true,
      })
      .select('_id')
      .lean();

    return matchingPackage ? { packageId: matchingPackage._id.toString() } : null;
  } catch (error) {
    console.error('Error in findPackage:', error);
    throw error;
  }
};

export const findStudentsByUserId = async (userId: string): Promise<IStudent[] | null> => {
  return await studentModel.find({ userId, isDeleted: false }).sort({ _id: 1 }).lean();
};

export const createStudent = async (data: IStudentBody): Promise<{ _id: string }> => {
  const student = await studentModel.create(data);
  return { _id: student._id as string };
};

export const updateStudent = async (id: string, data: IStudentBody): Promise<IStudentBody> => {
  const _id = ObjectID(id);
  const obj = { modifiedOn: new Date().toISOString(), ...data };
  const updatedData = await studentModel.findOneAndUpdate({ _id }, obj, { new: true }).lean();
  if (!updatedData) {
    throw new AppError('Something went wrong', HttpStatus.BAD_REQUEST);
  }
  return updatedData;
};

export const checkStudentIdExist = async (
  studentId: string,
  userId: string,
): Promise<{ _id: string } | null> => {
  const _id = ObjectID(studentId);
  return await studentModel.findOne({ _id, userId, isDeleted: false }).select({ _id: 1 }).lean();
};

export const getStudentById = async (studentId: string): Promise<IStudent | null> => {
  const _id = ObjectID(studentId);
  return await studentModel.findOne({ _id, isDeleted: false }).lean();
};

export const packageIsSubscribed = async (packageId: string): Promise<{ _id: string } | null> => {
  return await studentModel.findOne({ packageId, isDeleted: false }).select({ _id: 1 }).lean();
};

export const updateStudentSubscription = async (
  id: string,
  data: IStudentSubscription,
): Promise<IStudentBody> => {
  const _id = ObjectID(id);
  const obj = { modifiedOn: new Date().toISOString(), ...data };
  const updatedData = await studentModel.findOneAndUpdate({ _id }, obj, { new: true }).lean();
  if (!updatedData) {
    throw new AppError('Something went wrong', HttpStatus.BAD_REQUEST);
  }
  return updatedData;
};

export const getAllStudents = async (
  filters: IStudentFilters,
  limit: number,
  page: number,
): Promise<{ data: IStudent[]; totalCount: number }> => {
  const matchStage: any = { isDeleted: false };

  if (filters.subscribed !== undefined) {
    matchStage.subscribed = filters.subscribed;
  }

  if (filters.isActive !== undefined) {
    matchStage.isActive = filters.isActive;
  }

  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) {
      matchStage.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt.$lte = end;
    }
  }

  const now = new Date();
  if (filters.expiresIn7Days) {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    matchStage.subscriptionEndDate = {
      $gte: now,
      $lte: sevenDaysLater,
    };
  }

  if (filters.isExpired) {
    matchStage.subscriptionEndDate = { $lt: now };
  }

  // Students who bought or renewed a plan in a period (used by the dashboard's "subscribed" drill-down).
  if (filters.subscribedRange) {
    const buyers = await findBuyerIds(filters.subscribedRange);
    matchStage._id = { $in: buyers.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)) };
  }

  // Groups are worked out from the end date and never from the stored flag alone.
  if (filters.segment === 'active') {
    matchStage.subscribed = true;
    matchStage.subscriptionEndDate = { $gt: now };
  } else if (filters.segment === 'expiring') {
    matchStage.subscribed = true;
    matchStage.subscriptionEndDate = { $gt: now, $lte: new Date(now.getTime() + EXPIRING_DAYS * 86400000) };
  } else if (filters.segment === 'lapsed') {
    matchStage.subscriptionEndDate = { $ne: null, $exists: true };
    matchStage.$nor = [{ subscribed: true, subscriptionEndDate: { $gt: now } }];
  } else if (filters.segment === 'free') {
    // Everyone without a running plan: never subscribed plus lapsed.
    matchStage.$nor = [{ subscribed: true, subscriptionEndDate: { $gt: now } }];
  } else if (filters.segment === 'never') {
    matchStage.subscriptionEndDate = { $in: [null] };
  }

  const aggregatePipeline: any[] = [
    { $match: matchStage },
    {
      $addFields: {
        userIdObj: { $toObjectId: '$userId' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userIdObj',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

    {
      $match: {
        'user.mobileNumberVerified': true,
      },
    },
  ];

  // Filtering by fullName or mobileNumber (case-insensitive)
  if (filters.fullName) {
    const isNumeric = /^\d+$/.test(filters.fullName);
    const regexStr = filters.fullName;

    if (isNumeric) {
      aggregatePipeline.push({
        $match: {
          $expr: {
            $regexMatch: {
              input: { $toString: '$user.mobileNumber' },
              regex: regexStr,
              options: 'i',
            },
          },
        },
      });
    } else {
      aggregatePipeline.push({
        $match: {
          fullName: { $regex: regexStr, $options: 'i' },
        },
      });
    }
  }

  const countPipeline = [...aggregatePipeline, { $count: 'total' }];
  const countResult = await studentModel.aggregate(countPipeline);
  const totalCount = countResult[0]?.total || 0;

  aggregatePipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        fullName: 1,
        subscribed: 1,
        isActive: 1,
        createdAt: 1,
        userId: 1,
        avatar: 1,
        mobileNumber: '$user.mobileNumber',
        email: '$user.email',
        parentName: '$user.parentName',
        mobileNumberVerified: '$user.mobileNumberVerified',
        subscriptionStartDate: 1,
        subscriptionEndDate: 1,
        packageName: '$package.packageName',
        fixedOtp: '$user.fixedOtp',
        //paymentAmount: '$payment.amount',
      },
    },
  );

  const rows = await studentModel.aggregate(aggregatePipeline);
  // The stored flag can be stale, so every row carries the state worked out from its dates.
  const data = rows.map((row) => withAccess(row));

  return {
    data,
    totalCount,
  };
};

/** How many students are in each group. Counts only verified users, the same as the list. */
export const getStudentSegmentCounts = async (): Promise<{ all: number; active: number; expiring: number; lapsed: number; never: number }> => {
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRING_DAYS * 86400000);
  const rows: { _id: string; n: number }[] = await studentModel.aggregate([
    { $match: { isDeleted: false } },
    { $addFields: { userIdObj: { $toObjectId: '$userId' } } },
    { $lookup: { from: 'users', localField: 'userIdObj', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $match: { 'user.mobileNumberVerified': true } },
    {
      $addFields: {
        seg: {
          $switch: {
            branches: [
              {
                case: { $and: [{ $eq: ['$subscribed', true] }, { $gt: ['$subscriptionEndDate', now] }] },
                then: { $cond: [{ $lte: ['$subscriptionEndDate', soon] }, 'expiring', 'active'] },
              },
              { case: { $ne: [{ $ifNull: ['$subscriptionEndDate', null] }, null] }, then: 'lapsed' },
            ],
            default: 'never',
          },
        },
      },
    },
    { $group: { _id: '$seg', n: { $sum: 1 } } },
  ]);
  const n = (k: string): number => rows.find((r) => r._id === k)?.n ?? 0;
  const expiring = n('expiring');
  const active = n('active') + expiring; // "Subscribed" includes the ones about to expire
  const lapsed = n('lapsed');
  const never = n('never');
  return { all: active + lapsed + never, active, expiring, lapsed, never };
};

export const getSubscribedStudentCount = async (): Promise<number> => {
  const currentDate = new Date();
  try {
    const result = await studentModel.countDocuments({
      isDeleted: false,
      subscribed: true,
      subscriptionStartDate: { $lte: currentDate },
      subscriptionEndDate: { $gte: currentDate },
    });
    return result;
  } catch (error) {
    throw new Error('Failed to fetch student count');
  }
};

export const getStudentCount = async (): Promise<number> => {
  try {
    const result = await studentModel.countDocuments({
      isDeleted: false,
    });
    return result;
  } catch (error) {
    throw new Error('Failed to fetch student count');
  }
};

/** New students, students who bought a plan, and new students still on the free version, for a period. */
export const getPeriodActivities = async (
  range: DateRange,
): Promise<{
  registeredThisMonth: number;
  subscribedThisMonth: number;
  freeUsersThisMonth: number;
  newStudentsSubscribed: number;
}> => {
  try {
    const running = { subscribed: true, subscriptionEndDate: { $gt: new Date() } };
    const joined = { isDeleted: false, createdAt: { $gte: range.from, $lte: range.to } };
    const registeredThisMonth = await studentModel.countDocuments(joined);
    // Activity: everyone who bought or renewed a plan in the period, renewals included.
    const subscribedThisMonth = (await findBuyerIds(range)).length;
    // Conversion: of the students who joined in the period, how many have a plan running now.
    // This pair shares one population, so the two numbers always add up to the registrations.
    const newStudentsSubscribed = await studentModel.countDocuments({ ...joined, ...running });
    const freeUsersThisMonth = registeredThisMonth - newStudentsSubscribed;
    return { registeredThisMonth, subscribedThisMonth, freeUsersThisMonth, newStudentsSubscribed };
  } catch (error) {
    throw new Error('Failed to fetch student counts');
  }
};

export const findStudentsById = async (id: string): Promise<StudentWithPayments | null> => {
  const student = (await studentModel
    .findOne({ _id: id, isDeleted: false })
    .populate({
      path: 'userId',
      select: 'fullName mobileNumber email',
    })
    .lean()) as StudentWithPayments; // ✅ cast here

  if (!student) return null;

  const payments = (await mongoose.connection.db
    .collection('payments')
    .find({ studentId: id })
    .project({ amount: 1, paymentDate: 1, _id: 0 })
    .toArray()) as PaymentInfo[];

  student.payments = payments;

  return student;
};

export const checkStudentExist = async (studentId: string): Promise<{ _id: string } | null> => {
  const _id = ObjectID(studentId);
  return await studentModel.findOne({ _id, isDeleted: false }).select({ _id: 1 }).lean();
};

/** Plans bought per day. The last 10 days unless a range is given. Counted from the subscription records, so renewals count too. */
export const getStudentSubscriptions = async (
  range?: DateRange | null,
): Promise<{ subscription_date: string; date: string; total_subscriptions: number }[]> => {
  try {
    const period = range ?? lastDays(10);
    const rows = await countPurchasesByDay(period);
    const byDay = new Map(rows.map((row) => [row._id, row.total]));
    return dayKeys(period).map((key) => ({
      subscription_date: ordinalDay(key),
      date: key,
      total_subscriptions: byDay.get(key) ?? 0,
    }));
  } catch (error) {
    console.error('Error fetching student subscriptions:', error);
    throw new Error('Database query failed');
  }
};

export const deleteStudent = async (id: string): Promise<{ _id: string }> => {
  const student = await studentModel.findOne({ _id: new Types.ObjectId(id) });
  if (!student) {
    throw new AppError('No student found with the provided ID', HttpStatus.NOT_FOUND);
  }

  const deletedStudent = await studentModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id) },
    {
      isDeleted: true,
      modifiedOn: new Date().toISOString(),
    },
    { new: true },
  );

  if (!deletedStudent) {
    throw new AppError('Failed to delete student', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  if (student.userId) {
    await usersModel.findOneAndUpdate(
      { _id: new Types.ObjectId(student.userId) },
      {
        isDeleted: true,
        modifiedOn: new Date().toISOString(),
      },
    );
  }
  return { _id: (deletedStudent._id as Types.ObjectId).toString() };
};

export const unSubscribeStudent = async (id: string): Promise<IStudentBody> => {
  const _id = new Types.ObjectId(id);
  const obj = {
    subscriptionEndDate: new Date(),
    subscribed: false,
    modifiedOn: new Date().toISOString(),
  };
  const updatedData = await studentModel.findOneAndUpdate({ _id }, obj, { new: true }).lean();

  if (!updatedData) {
    throw new AppError('Something went wrong', HttpStatus.BAD_REQUEST);
  }

  return updatedData;
};

export const fixedOtpStudent = async (id: string): Promise<IStudentBody> => {
  const _id = new Types.ObjectId(id);
  const obj = {
    fixedOtp: '112233',
  };
  const updatedData = await usersModel.findOneAndUpdate({ _id }, obj, { new: true }).lean();

  if (!updatedData) {
    throw new AppError('Something went wrong', HttpStatus.BAD_REQUEST);
  }

  return updatedData;
};
