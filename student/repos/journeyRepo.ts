import studentModel from '../models/studentModel';
import usersModel from '../../user/models/userModel';
import packageModel from '../../package/models/packageModel';
import categoryModel from '../../category/models/categoryModel';
import subCategoryModel from '../../subcategory/models/subCategoryModel';
import courseMaterialModel from '../../coursematerial/models/courseMaterialModel';
import courseMaterialViewModel from '../../coursematerial/models/courseMaterialViewModel';
import courseMaterialWatchHistoryModel from '../../coursematerial/models/courseMaterialWatchHistoryModel';
import subscriptionModel from '../../subscription/models/subscriptionModel';
import paymentModel from '../../subscription/models/paymentModel';
import paymentgatewayModel from '../../paymentgateway/models/paymentgatewayModel';
import AppError from '../../common/appError';
import { HttpStatus } from '../../common/httpStatus';
import { accessInfo, freeMaterialIds, freeVersionSettings } from '../../subscription/accessRules';
import { buildTimeline } from '../journey';

const DAY = 86400000;
const ids = (rows: { _id: unknown }[]): string[] => rows.map((r) => String(r._id));

/** Everything an admin needs about one student: who, plan, what they can open, how they are learning, and their history. */
export const getStudentJourney = async (studentId: string) => {
  const student = await studentModel.findOne({ _id: studentId, isDeleted: false }).lean();
  if (!student) throw new AppError('No student found for the given id', HttpStatus.NOT_FOUND);
  const now = new Date();
  const access = accessInfo(student, now);
  const parent = await usersModel.findOne({ _id: student.userId }).select('fullName parentName mobileNumber email createdAt').lean();

  // Plans and payments
  const subs = await subscriptionModel.find({ studentId, isDeleted: { $ne: true } }).sort({ createdAt: 1 }).lean();
  const payments = await paymentModel.find({ _id: { $in: subs.map((s) => s.paymentId) } }).lean();
  const gateways = await paymentgatewayModel.find({ _id: { $in: payments.map((p) => p.paymentGatewayId) } }).lean();
  const packages = await packageModel.find({ _id: { $in: subs.map((s) => s.packageId) } }).select('packageName').lean();
  const admins = await usersModel.find({ _id: { $in: subs.map((s) => s.createdBy) } }).select('fullName').lean();
  const byId = <T extends { _id: unknown }>(rows: T[]) => new Map(rows.map((r) => [String(r._id), r]));
  const payMap = byId(payments), gwMap = byId(gateways), pkgMap = byId(packages), adminMap = byId(admins);
  const subscriptions = subs.map((s) => {
    const pay = payMap.get(String(s.paymentId));
    const gw = pay ? gwMap.get(String(pay.paymentGatewayId)) : undefined;
    const mode = gw?.paymentGatewayName ?? 'unknown';
    const start = new Date(s.subscriptionStartDate).getTime(), end = new Date(s.subscriptionEndDate).getTime();
    return {
      _id: String(s._id),
      packageName: pkgMap.get(String(s.packageId))?.packageName ?? 'Package',
      start: s.subscriptionStartDate, end: s.subscriptionEndDate, boughtAt: (s as unknown as { createdAt: Date }).createdAt,
      amount: pay?.amount ?? 0, mode,
      recordedBy: mode.toLowerCase() === 'offline' ? adminMap.get(String(s.createdBy))?.fullName ?? 'Admin' : 'Parent, in the app',
      state: end <= now.getTime() ? 'ended' : start > now.getTime() ? 'upcoming' : 'running',
    };
  });

  // Content in the student's package
  const packageId = student.packageId || (await agePackageId(student.dob, now));
  const categories = packageId ? await categoryModel.find({ packageId, isActive: true, isDeleted: false }).select('categoryName').lean() : [];
  const subCats = await subCategoryModel.find({ categoryId: { $in: ids(categories) }, isActive: true, isDeleted: false }).select('categoryId').lean();
  const materials = await courseMaterialModel
    .find({ subCategoryId: { $in: ids(subCats) }, isActive: true, isDeleted: false })
    .select('courseMaterialName subCategoryId sorting').sort({ sorting: 1, _id: 1 }).lean();
  const catOfSub = new Map(subCats.map((s) => [String(s._id), String(s.categoryId)]));
  const free = freeVersionSettings();
  const freeIds = freeMaterialIds(materials, free.perSubCategory);
  const lockingOn = free.enabled && !access.subscribed;

  // Learning activity
  const views = await courseMaterialViewModel.find({ studentId }).sort({ createdAt: 1 }).lean();
  const viewedIds = new Set(views.map((v) => String(v.courseMaterialId)));
  const history = await courseMaterialWatchHistoryModel.find({ studentId }).select('createdAt').lean();
  const since = now.getTime() - 30 * DAY;
  const activeDays = new Set<string>();
  [...history, ...views].forEach((r) => {
    const at = (r as unknown as { createdAt?: Date }).createdAt;
    if (at && new Date(at).getTime() >= since) activeDays.add(new Date(at).toISOString().slice(0, 10));
  });
  const openTotal = lockingOn ? materials.filter((m) => freeIds.has(String(m._id))).length : materials.length;
  const viewedOpen = materials.filter((m) => viewedIds.has(String(m._id)) && (!lockingOn || freeIds.has(String(m._id)))).length;
  const lastView = views.length ? (views[views.length - 1] as unknown as { createdAt: Date }).createdAt : null;
  const firstView = views.length ? (views[0] as unknown as { createdAt: Date }).createdAt : null;

  const learning = categories.map((c) => {
    const mats = materials.filter((m) => catOfSub.get(String(m.subCategoryId)) === String(c._id));
    return {
      categoryId: String(c._id), name: c.categoryName, total: mats.length,
      viewed: mats.filter((m) => viewedIds.has(String(m._id))).length,
      locked: lockingOn ? mats.filter((m) => !freeIds.has(String(m._id))).length : 0,
    };
  });
  const matById = new Map(materials.map((m) => [String(m._id), m]));
  const catName = new Map(categories.map((c) => [String(c._id), c.categoryName]));
  const recent = [...views].reverse().slice(0, 8).map((v) => {
    const m = matById.get(String(v.courseMaterialId));
    return {
      name: m?.courseMaterialName ?? 'Video', category: m ? catName.get(catOfSub.get(String(m.subCategoryId)) ?? '') ?? '' : '',
      viewedAt: (v as unknown as { createdAt: Date }).createdAt, viewedPercentage: v.viewedPercentage ?? null,
      locked: m ? lockingOn && !freeIds.has(String(m._id)) : false,
    };
  });

  return {
    student: {
      _id: String(student._id), fullName: student.fullName, dob: student.dob, gender: student.gender ?? '', avatar: student.avatar ?? '',
      isActive: student.isActive !== false, createdAt: (student as unknown as { createdAt: Date }).createdAt,
      parent: { name: parent?.parentName || parent?.fullName || '', mobileNumber: parent?.mobileNumber ?? null, email: parent?.email ?? '' },
    },
    access: {
      ...access, packageId: student.packageId ?? '', packageName: subscriptions.length ? subscriptions[subscriptions.length - 1].packageName : '',
      subscriptionStartDate: student.subscriptionStartDate ?? null, subscriptionEndDate: student.subscriptionEndDate ?? null,
      freeVersion: { enabled: free.enabled, perSubCategory: free.perSubCategory },
      totalVideos: materials.length, openVideos: openTotal,
    },
    metrics: {
      videosViewed: viewedOpen, videosViewedAllTime: views.length, completionPercent: openTotal ? Math.round((viewedOpen / openTotal) * 100) : 0,
      activeDaysLast30: activeDays.size, firstActivityAt: firstView, lastActivityAt: lastView,
    },
    learning: { categories: learning, recent },
    subscriptions,
    timeline: buildTimeline({
      joinedAt: (student as unknown as { createdAt: Date }).createdAt, firstViewAt: firstView, lastViewAt: lastView, viewCount: views.length,
      purchases: subscriptions.map((s) => ({ boughtAt: s.boughtAt, start: s.start, end: s.end, packageName: s.packageName, amount: s.amount, mode: s.mode })),
      status: access.accessStatus, daysLeft: access.daysLeft, now,
    }),
  };
};

async function agePackageId(dob: Date, now: Date): Promise<string> {
  const born = new Date(dob);
  let age = now.getFullYear() - born.getFullYear();
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age--;
  const p = await packageModel.findOne({ ageFrom: { $lte: age }, ageTo: { $gte: age }, isDeleted: false, isActive: true }).select('_id').lean();
  return p ? String(p._id) : '';
}
