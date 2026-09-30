import courseMaterialModel from '../models/courseMaterialModel';
import courseMaterialViewModel from '../models/courseMaterialViewModel';
import {
  ICourseMaterial,
  ITrackCourseMaterialView,
  ICourseMaterialWithStatus,
  ICourseMaterialBody,
  ICourseMaterialWatchHistoryBody,
  IWatchHistory,
} from '../../types/coursematerial/courseMaterialModel';
import subCategoryModel from '../../subcategory/models/subCategoryModel';
import { objectIdToString } from '../../utils/objectIdParser';
import { ObjectId } from 'mongodb';
import studentModel from '../../student/models/studentModel';
import { freeMaterialIds, freeVersionSettings, hasActivePlan } from '../../subscription/accessRules';
import AppError from '../../common/appError';
import { HttpStatus } from '../../common/httpStatus';
import courseMaterialWatchHistoryModel from '../models/courseMaterialWatchHistoryModel';
import { ObjectID } from '../../utils/objectIdParser';

export class CourseMaterialRepo {
  async findAllCourseMaterials(
    filters: Partial<ICourseMaterial>,
    limit = 10,
    page = 1,
  ): Promise<{ data: ICourseMaterial[]; totalCount: number }> {
    const query: any = {};
    if (filters.courseMaterialName && typeof filters.courseMaterialName === 'string') {
      // Match on the material's own name, and treat the search word as plain text, not a pattern.
      const term = filters.courseMaterialName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.courseMaterialName = { $regex: term, $options: 'i' };
    }
    if (filters.type === 'kid' || filters.type === 'parent') {
      query.type = filters.type;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    query.isDeleted = false;
    const skip = (page - 1) * limit;
    const data = await courseMaterialModel
      .find(query)
      .populate({
        path: 'subCategoryId',
        match: { isDeleted: false },
        select: 'subCategoryName categoryId',
        populate: {
          path: 'categoryId',
          match: { isDeleted: false },
          select: 'categoryName',
        },
      })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean();
    const totalCount = await courseMaterialModel.countDocuments(query);
    return {
      data,
      totalCount,
    };
  }

  async findCourseMaterialBySubCategoryId(
    subCategoryId: string,
    userId: string,
    type: string,
    studentId: string,
  ): Promise<ICourseMaterialWithStatus[]> {
    const student = await studentModel.findOne({ _id: studentId, isDeleted: false }).lean();
    if (!student) throw new AppError('Student Not Found', HttpStatus.BAD_REQUEST);
    // Worked out from the dates on every request, so a plan that ends or starts is reflected without logging in again.
    const free = freeVersionSettings();
    const lockingOn = free.enabled && !hasActivePlan(student);

    const courseMaterials = (await courseMaterialModel
      .find({ subCategoryId, type, isActive: true, isDeleted: false })
      .sort({ sorting: 1, _id: 1 })
      .lean()) as unknown as ICourseMaterial[];

    // Free version: only the first videos of the sub category stay open. The rest are returned locked and without a link.
    const openIds = lockingOn ? freeMaterialIds(courseMaterials, free.perSubCategory) : null;
    let openStatusIndex = 0;
    const viewedMaterialIds = new Set<string>();
    if (userId) {
      const viewedMaterials = await courseMaterialViewModel
        .find({ studentId, isActive: true })
        .lean();
      viewedMaterials.forEach((view) => {
        viewedMaterialIds.add(view.courseMaterialId.toString());
      });
      courseMaterials.forEach((material, index) => {
        const materialId = objectIdToString(material._id as ObjectId);
        if (viewedMaterialIds.has(materialId)) {
          openStatusIndex = index + 1;
        }
      });
    }

    const isLocked = (m: ICourseMaterial): boolean =>
      openIds !== null && !openIds.has(objectIdToString(m._id as ObjectId));

    const courseMaterialsWithStatus: ICourseMaterialWithStatus[] = courseMaterials.map(
      (material, index) => ({
        _id: objectIdToString(material._id as ObjectId),
        courseMaterialName: material.courseMaterialName,
        subCategoryId: material.subCategoryId,
        courseMaterialUrl: isLocked(material) ? '' : material.courseMaterialUrl,
        sorting: material.sorting,
        description: material.description,
        isActive: material.isActive,
        isDeleted: material.isDeleted,
        type: material.type,
        viewedStatus: viewedMaterialIds.has(objectIdToString(material._id as ObjectId)),
        openStatus: index === openStatusIndex && !isLocked(material),
        imageUrl: material.imageUrl,
        locked: isLocked(material),
      }),
    );

    return courseMaterialsWithStatus;
  }

  async findCourseMaterialsById(id: string): Promise<ICourseMaterial[] | null> {
    return await courseMaterialModel
      .findOne({ _id: id, isDeleted: false })
      /*
      .populate({
        path: 'subCategoryId',
        select: 'categoryId',
        model: 'subcategory',
      })*/
      .populate({
        path: 'subCategoryId',
        select: 'categoryId subCategoryName',
        populate: {
          path: 'categoryId',
          select: 'categoryName',
        },
      })
      .lean();
  }
}

export const checkUserCourseIdExist = async (
  studentId: string,
  courseMaterialId: string,
): Promise<{ _id: string } | null> => {
  return await courseMaterialViewModel
    .findOne({ studentId, courseMaterialId })
    .select({ _id: 1 })
    .lean();
};

export const trackCourseMaterial = async (data: ITrackCourseMaterialView): Promise<boolean> => {
  await courseMaterialViewModel.create({ ...data });
  return true;
};

/** False only when the free version is on, the student has no running plan and the video is past the free ones. */
export const isMaterialOpenForStudent = async (
  studentId: string,
  courseMaterialId: string,
): Promise<boolean> => {
  const free = freeVersionSettings();
  if (!free.enabled) return true;
  const student = await studentModel.findOne({ _id: studentId, isDeleted: false }).lean();
  if (!student || hasActivePlan(student)) return true;
  const material = await courseMaterialModel.findOne({ _id: courseMaterialId, isDeleted: false }).lean();
  if (!material) return true;
  const siblings = await courseMaterialModel
    .find({ subCategoryId: material.subCategoryId, type: material.type, isActive: true, isDeleted: false })
    .sort({ sorting: 1, _id: 1 })
    .select('_id subCategoryId sorting')
    .lean();
  return freeMaterialIds(siblings, free.perSubCategory).has(String(material._id));
};

export const checkCourseMaterialExist = async (
  courseMaterialId: string,
  subCategoryId?: string,
): Promise<{ _id: string } | null> => {
  const query: Record<string, any> = { _id: courseMaterialId, isDeleted: false };
  if (subCategoryId) {
    query.subCategoryId = subCategoryId;
  }
  return await courseMaterialModel.findOne(query).select({ _id: 1 }).lean();
};

export const getCourseMaterialTrack = async (
  userId: string,
): Promise<{ totalMaterials: number; viewedMaterials: number; percentageViewed: number }> => {
  const totalMaterials = await courseMaterialModel.countDocuments({
    isActive: true,
    isDeleted: false,
  });
  const viewedMaterials = await courseMaterialViewModel.countDocuments({
    userId: userId,
    isActive: true,
  });
  const percentageViewed =
    totalMaterials > 0 ? Math.round((viewedMaterials / totalMaterials) * 100) : 0;
  return { totalMaterials, viewedMaterials, percentageViewed };
};

export const getCourseMaterialTrackBySubCategory = async (
  userId: string,
  subCategoryId: string,
): Promise<{ totalMaterials: number; viewedMaterials: number; percentageViewed: number }> => {
  const courseMaterials = await courseMaterialModel
    .find({
      subCategoryId,
      isActive: true,
      isDeleted: false,
    })
    .select('_id');
  const courseMaterialIds = courseMaterials.map((material) => material._id);
  const viewedMaterials = await courseMaterialViewModel.countDocuments({
    userId,
    courseMaterialId: { $in: courseMaterialIds },
  });
  const totalMaterials = courseMaterials.length;
  const percentageViewed = totalMaterials > 0 ? (viewedMaterials / totalMaterials) * 100 : 0;
  return { totalMaterials, viewedMaterials, percentageViewed };
};

export const getCourseMaterialTrackByCategory = async (
  studentId: string,
  categoryId: string,
): Promise<{ totalMaterials: number; viewedMaterials: number; percentageViewed: number }> => {
  const subCategories = await subCategoryModel
    .find({ categoryId, isActive: true, isDeleted: false })
    .select('_id');
  const subCategoryIds = subCategories.map((subCategory) => subCategory._id);

  const courseMaterials = await courseMaterialModel
    .find({
      subCategoryId: { $in: subCategoryIds },
      isActive: true,
      isDeleted: false,
    })
    .select('_id');

  const courseMaterialIds = courseMaterials.map((material) => material._id);
  const viewedMaterials = await courseMaterialViewModel.countDocuments({
    studentId,
    courseMaterialId: { $in: courseMaterialIds },
  });

  const totalMaterials = courseMaterials.length;
  const percentageViewed = totalMaterials > 0 ? (viewedMaterials / totalMaterials) * 100 : 0;

  return { totalMaterials, viewedMaterials, percentageViewed };
};

export const saveCourseMaterial = async (data: ICourseMaterialBody): Promise<{ _id: string }> => {
  const result = await courseMaterialModel.create(data);
  return { _id: result._id as string };
};

export const updateCourseMaterial = async (
  id: string,
  data: ICourseMaterialBody,
): Promise<{ _id: string }> => {
  const updatedRes = await courseMaterialModel.findByIdAndUpdate(id, data, { new: true });
  if (!updatedRes) {
    throw new AppError('No data found', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  return { _id: updatedRes._id as string };
};

export const saveCourseMaterialWatchHistory = async (
  data: ICourseMaterialWatchHistoryBody,
): Promise<boolean> => {
  await courseMaterialWatchHistoryModel.create({ ...data });
  return true;
};

export const deleteCourseMaterial = async (id: string): Promise<{ _id: string }> => {
  const result: any = await courseMaterialModel.findOneAndUpdate(
    { _id: ObjectID(id) },
    { isDeleted: true, modifiedOn: new Date().toISOString() },
    { new: true },
  );
  if (!result) {
    throw new AppError('No document found with the Id', HttpStatus.NOT_FOUND);
  }
  return result;
};

export const checkSubCategoryIsChoosed = async (
  subCategoryId: string,
): Promise<{ _id: string } | null> => {
  return await courseMaterialModel
    .findOne({ subCategoryId, isDeleted: false })
    .select({ _id: 1 })
    .lean();
};

export const getCourseMaterialsBySubCategories = async (
  subCategoryIds: string[],
): Promise<ICourseMaterial[]> => {
  return await courseMaterialModel
    .find({ subCategoryId: { $in: subCategoryIds }, isActive: true, isDeleted: false })
    .lean();
};

export const getWatchHistoriesBySubCategories = async (
  subCategoryIds: string[],
): Promise<IWatchHistory[]> => {
  return await courseMaterialWatchHistoryModel
    .find({ subCategoryId: { $in: subCategoryIds } })
    .lean();
};

export const getTrendingVideos = async () => {
  return await courseMaterialWatchHistoryModel.aggregate([
    {
      $addFields: {
        courseMaterialId: { $toObjectId: '$courseMaterialId' },
        subCategoryId: { $toObjectId: '$subCategoryId' },
      },
    },
    {
      $group: {
        _id: {
          courseMaterialId: '$courseMaterialId',
          subCategoryId: '$subCategoryId',
        },
        repeatedViews: { $sum: 1 },
        distinctStudents: { $addToSet: '$studentId' },
      },
    },
    {
      $lookup: {
        from: 'coursematerials',
        localField: '_id.courseMaterialId',
        foreignField: '_id',
        as: 'courseMaterial',
      },
    },
    { $unwind: '$courseMaterial' },
    {
      $lookup: {
        from: 'subcategories',
        localField: '_id.subCategoryId',
        foreignField: '_id',
        as: 'subCategory',
      },
    },
    { $unwind: '$subCategory' },
    {
      $project: {
        courseMaterialName: '$courseMaterial.courseMaterialName',
        subCategoryName: '$subCategory.subCategoryName',
        repeatedViews: 1,
        distinctStudents: { $size: '$distinctStudents' },
      },
    },
    { $sort: { repeatedViews: -1 } },
  ]);
};
