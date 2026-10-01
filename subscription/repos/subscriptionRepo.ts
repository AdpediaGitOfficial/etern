import subscriptionModel from '../models/subscriptionModel';
import {
  ISubscriptionBody,
  ISubscriptionWithStudent,
} from '../../types/subscription/subscriptionType';
import paymentModel from '../models/paymentModel';
import { IPaymentBody } from '../../types/subscription/paymentType';
import { PaymentgatewayRepo } from '../../paymentgateway/repos/paymentgatewayRepo';
import { currentMonth, DateRange, growthPercent, lastMonth } from '../../common/dateRange';

export const subscribe = async (data: ISubscriptionBody): Promise<{ _id: string }> => {
  const subscription = await subscriptionModel.create(data);
  return { _id: subscription._id as string };
};

export const savePayment = async (data: IPaymentBody): Promise<{ _id: string }> => {
  const result = await paymentModel.create(data);
  return { _id: result._id as string };
};

export const findAllOfflinePayments = async (
  filters: Partial<ISubscriptionWithStudent>,
  limit?: number,
  page?: number,
  mode?: string,
): Promise<{ data: ISubscriptionWithStudent[]; totalCount: number }> => {
  const query: any = { isDeleted: false };
  if (filters.studentName) {
    query.fullName = { $regex: filters.studentName, $options: 'i' };
  }
  const paymentgatewayRepo = new PaymentgatewayRepo();
  const paymentgatewayDetail = await paymentgatewayRepo.findPaymentgatewayByName('offline');

  if (!paymentgatewayDetail) {
    if (mode === 'offline') {
      throw new Error('Offline payment gateway not found');
    }
  }

  const paymentQuery: any = { isDeleted: false };
  if (mode === 'offline') {
    paymentQuery.paymentGatewayId = paymentgatewayDetail?._id ?? undefined; // Use optional chaining with fallback
  } else {
    paymentQuery.paymentGatewayId = { $ne: paymentgatewayDetail?._id ?? undefined };
  }

  const paymentIds = (await paymentModel.find(paymentQuery).select('_id').lean()).map(
    (payment) => payment._id,
  );
  query.paymentId = { $in: paymentIds };

  // Fetch subscriptions with filtered payments
  if (limit !== undefined && page !== undefined) {
    const skip = (page - 1) * limit;
    const data = await subscriptionModel
      .find(query)
      .populate('packageId', 'packageName packageId')
      .populate('paymentId', 'amount paymentDate paymentGatewayId')
      .populate('studentId', 'fullName studentId')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean();
    const totalCount = await subscriptionModel.countDocuments(query);
    return { data, totalCount };
  }

  return await subscriptionModel
    .find(query)
    .populate('packageId', 'packageName packageId')
    .populate('paymentId', 'amount paymentDate paymentGatewayId')
    .populate('studentId', 'fullName studentId')
    .sort({ createdAt: -1 })
    .lean();
};

export const findSubscriptionById = async (
  id: string,
): Promise<ISubscriptionWithStudent[] | null> => {
  return await subscriptionModel
    .find({ _id: id, isDeleted: false })
    .populate('packageId', 'packageName packageId')
    .populate(
      'paymentId',
      'amount paymentDate paymentGatewayId comment paymentRef status paymentGatewayId',
    )
    .populate('studentId', 'fullName studentId')
    .sort({ createdAt: -1 })
    .lean();
};

/** Money received in a period: paid, not deleted, by payment date. */
export const sumRevenue = async (from: Date, to: Date): Promise<number> => {
  const result = await paymentModel.aggregate([
    { $match: { isDeleted: false, status: 'paid', paymentDate: { $gte: from, $lte: to } } },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
  ]);
  return result.length > 0 ? result[0].totalRevenue : 0;
};

export const getCurrentMonthRevenue = async (): Promise<number> => {
  const { from, to } = currentMonth();
  return sumRevenue(from, to);
};

export const getGrowthPercentage = async (): Promise<number> => {
  const current = await sumRevenue(currentMonth().from, currentMonth().to);
  const before = lastMonth();
  return growthPercent(current, await sumRevenue(before.from, before.to));
};

/** Plans bought per day in a period, counted from the subscription records (renewals included). */
export const countPurchasesByDay = async (range: DateRange): Promise<{ _id: string; total: number }[]> =>
  subscriptionModel.aggregate([
    { $match: { isDeleted: { $ne: true }, createdAt: { $gte: range.from, $lte: range.to } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

/** Students who bought a plan (or renewed) in a period. */
export const findBuyerIds = async (range: DateRange): Promise<string[]> =>
  (await subscriptionModel.distinct('studentId', { isDeleted: { $ne: true }, createdAt: { $gte: range.from, $lte: range.to } })).map(String);

/** An earlier payment with the same gateway reference, so a retried request is not counted twice. */
export const findPaymentByRef = async (paymentGatewayId: string, paymentRef: string): Promise<{ _id: string } | null> =>
  (await paymentModel.findOne({ paymentGatewayId, paymentRef, isDeleted: false }).select({ _id: 1 }).lean()) as { _id: string } | null;

export const findSubscriptionByPaymentId = async (paymentId: string): Promise<{ _id: string } | null> =>
  (await subscriptionModel.findOne({ paymentId: String(paymentId), isDeleted: { $ne: true } }).select({ _id: 1 }).lean()) as { _id: string } | null;

/** The same offline payment entered twice: same student, reference, amount and date. */
export const findSameOfflinePayment = async (
  studentId: string,
  paymentRef: string,
  amount: number,
  paymentDate: Date,
): Promise<{ _id: string } | null> =>
  (await paymentModel.findOne({ studentId, paymentRef, amount, paymentDate, isDeleted: false }).select({ _id: 1 }).lean()) as { _id: string } | null;
