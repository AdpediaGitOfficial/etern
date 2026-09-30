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

export const findStudentExists = async (
  studentId: string,
  userId: string,
): Promise<{ _id: string } | null> => {
  return await studentModel
    .findOne({ _id: studentId, userId, isDeleted: false })
    .select({ _id: 1 })
    .lean();
};

// export const findPackage = async (
//   studentId: string,
// ): Promise<{ packageId: string | null } | null> => {
//   try {
//     const student = await studentModel
//       .findOne({ _id: new Types.ObjectId(studentId), isDeleted: false })
//       .select({ packageId: 1, dob: 1, subscriptionEndDate: 1, subscribed: 1 })
//       .lean();
//     if (!student) return null;

//     const now = new Date();

//     const birthDate = new Date(student.dob);
//     const currentDate = new Date();
//     let age = currentDate.getFullYear() - birthDate.getFullYear();
//     const monthDiff = currentDate.getMonth() - birthDate.getMonth();
//     if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
//       age--;
//     }
//     if (
//       student.packageId &&
//       student.subscribed &&
//       student.subscriptionEndDate &&
//       student.subscriptionEndDate > new Date()
//     ) {
//       return { packageId: student.packageId };
//     }
//     const matchingPackage = await packageModel
//       .findOne({
//         ageFrom: { $lte: age },
//         ageTo: { $gte: age },
//         isDeleted: false,
//         isActive: true,
//       })
//       .select({ _id: 1 })
//       .lean();

//     return matchingPackage ? { packageId: matchingPackage._id.toString() } : null;
//   } catch (error) {
//     console.error('Error in findPackage:', error);
//     throw error;
//   }
// };

// export const findPackage = async (
//   studentId: string,
// ): Promise<{ packageId: string | null } | null> => {
//   try {
//     const student = await studentModel
//       .findOne({ _id: new Types.ObjectId(studentId), isDeleted: false })
//       .select({
//         packageId: 1,
//         dob: 1,
//         subscribed: 1,
//         subscriptionStartDate: 1,
//         subscriptionEndDate: 1,
//       })
//       .lean();

//     if (!student) return null;

//     const now = new Date();

//     // 🔹 Calculate age
//     const birthDate = new Date(student.dob);
//     let age = now.getFullYear() - birthDate.getFullYear();
//     const monthDiff = now.getMonth() - birthDate.getMonth();
//     if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
//       age--;
//     }

//     // Check active subscription (START + END)
//     const hasActiveSubscription =
//       student.subscribed === true &&
//       student.packageId &&
//       student.subscriptionStartDate &&
//       student.subscriptionEndDate &&
//       new Date(student.subscriptionStartDate) <= now &&
//       new Date(student.subscriptionEndDate) >= now;

//     if (hasActiveSubscription) {
//       return { packageId: student.packageId as string };
//     }

//     // Find package based on age
//     const matchingPackage = await packageModel
//       .findOne({
//         ageFrom: { $lte: age },
//         ageTo: { $gte: age },
//         isDeleted: false,
//         isActive: true,
//       })
//       .select({ _id: 1 })
//       .lean();

//     return matchingPackage ? { packageId: matchingPackage._id.toString() } : null;
//   } catch (error) {
//     console.error('Error in findPackage:', error);
//     throw error;
//   }
// };

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
      } else {
        // IMPORTANT: If they were subscribed but it expired, RETURN NULL (No access)
        console.log('Subscription expired. Denying access.');
        return null;
      }
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

  const data = await studentModel.aggregate(aggregatePipeline);

  return {
    data,
    totalCount,
  };
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

export const getCurrentMonthActivities = async (): Promise<{
  registeredThisMonth: number;
  subscribedThisMonth: number;
  freeUsersThisMonth: number;
}> => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    // Count students registered this month
    const registeredThisMonth = await studentModel.countDocuments({
      isDeleted: false,
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
    });

    // Count students subscribed this month
    const subscribedThisMonth = await studentModel.countDocuments({
      isDeleted: false,
      subscribed: true,
      subscriptionStartDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
    });

    const freeUsersThisMonth = registeredThisMonth - subscribedThisMonth;
    return { registeredThisMonth, subscribedThisMonth, freeUsersThisMonth };
  } catch (error) {
    throw new Error('Failed to fetch student counts');
  }
};

/*
export const findStudentsById = async (id: string): Promise<IStudent[] | null> => {
  return await studentModel
    .findOne({ _id: id, isDeleted: false })
    .populate({
      path: 'userId',
      select: 'fullName mobileNumber email',
    })
    
    .lean();
};
*/

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

export const getStudentSubscriptions = async (): Promise<
  { subscription_date: string; total_subscriptions: number }[]
> => {
  try {
    const formatDate = (date: Date): string => {
      const day = date.getDate();
      const suffix =
        day === 1 || day === 21 || day === 31
          ? 'st'
          : day === 2 || day === 22
            ? 'nd'
            : day === 3 || day === 23
              ? 'rd'
              : 'th';
      return `${day}${suffix}`;
    };

    // Generate last 10 days
    const last10Days: { subscription_date: string; total_subscriptions: number }[] = Array.from(
      { length: 10 },
      (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 9 + i);
        return { subscription_date: formatDate(date), total_subscriptions: 0 };
      },
    );

    const result: { _id: string; total_subscriptions: number }[] = await studentModel.aggregate([
      {
        $match: {
          subscriptionStartDate: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 10)), // Last 10 days
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$subscriptionStartDate' } },
          total_subscriptions: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Convert database result into a lookup object
    const subscriptionData: Record<string, number> = result.reduce(
      (acc, item) => {
        const date = new Date(item._id);
        acc[formatDate(date)] = item.total_subscriptions;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Merge database result with last 10 days data
    return last10Days.map((day) => ({
      subscription_date: day.subscription_date,
      total_subscriptions: subscriptionData[day.subscription_date] || 0,
    }));
  } catch (error) {
    console.error('Error fetching student subscriptions:', error);
    throw new Error('Database query failed');
  }
};

/*
export const deleteStudent = async (id: string): Promise<{ _id: string }> => {
  const result: any = await studentModel.findOneAndUpdate(
    { _id: ObjectID(id) },
    { isDeleted: true, modifiedOn: new Date().toISOString() },
    { new: true },
  );
  if (!result) {
    throw new AppError('No document found with the Id', HttpStatus.NOT_FOUND);
  }
  
  return result;
};
*/

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
