import { Document } from 'mongoose';

export interface ICourseMaterial extends Document {
  courseMaterialName: string;
  subCategoryId: string;
  courseMaterialUrl: string;
  sorting: number;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  type: string;
  duration?: number;
}

export interface ICourseMaterialBody {
  courseMaterialName: string;
  subCategoryId: string;
  courseMaterialUrl: string;
  description?: string;
  imageUrl?: string;
  sorting: number;
  type: string;
  duration?: number;
}

export interface ITrackCourseMaterialView extends Document {
  studentId: string;
  courseMaterialId: string;
  viewedPercentage?: number;
  isActive: boolean;
}

export interface ICourseMaterialWithStatus extends ICourseMaterialBody {
  _id: string;
  viewedStatus: boolean;
  openStatus: boolean;
  /** True on the free version for videos past the free ones. The link is then empty. */
  locked: boolean;
}

export interface ICourseMaterialWatchHistoryBody extends Document {
  studentId: string;
  categoryId: string;
  subCategoryId: string;
  courseMaterialId: string;
  watchedDuration: number;
}

export interface IWatchHistory {
  _id: string;
  studentId: string;
  categoryId: string;
  subCategoryId: string;
  courseMaterialId: string;
  watchedDuration: number;
}
