import AppError from '../../common/appError';
import { HttpStatus } from '../../common/httpStatus';
import {
  createStudent,
  findStudentsByUserId,
  updateStudent,
  getAllStudents,
  findStudentsById,
  getStudentSubscriptions,
  deleteStudent,
  unSubscribeStudent,
  fixedOtpStudent,
} from '../repos/studentRepo';
import { IStudent, IStudentBody, StudentWithPayments } from '../../types/student/studentType';
import { withAccess } from '../../subscription/accessRules';
import { DateRange } from '../../common/dateRange';

export const getStudentsByUserIdUseCase = async (userId: string): Promise<IStudent[]> => {
  const result = await findStudentsByUserId(userId);
  if (!result || result.length === 0) {
    throw new AppError('No students found for the given user', HttpStatus.NOT_FOUND);
  }
  return result.map((student) => withAccess(student)) as IStudent[];
};

export const addStudentUseCase = async (data: IStudentBody): Promise<Pick<IStudent, '_id'>> => {
  const result = await createStudent(data);
  return result;
};

export const updateStudentUseCase = async (
  studentId: string,
  data: IStudentBody,
): Promise<IStudentBody> => {
  const result = await updateStudent(studentId, data);
  return result;
};

export const getStudentsUseCase = async (
  filters: Partial<IStudent>,
  limit: number,
  page: number,
): Promise<{ data: IStudent[]; totalCount: number }> => {
  // An empty list is a normal answer for a search or a filter, so it is returned as such and not as a 404.
  return getAllStudents(filters, limit, page);
};

/*
export const getStudentByIdAdminUseCase = async (id: string): Promise<IStudent[]> => {
  const result = await findStudentsById(id);
  if (!result || result.length === 0) {
    throw new AppError('No students found for the given id', HttpStatus.NOT_FOUND);
  }
  return result;
};
*/
export const getStudentByIdAdminUseCase = async (id: string): Promise<StudentWithPayments> => {
  const result = await findStudentsById(id);

  if (!result) {
    throw new AppError('No student found for the given id', HttpStatus.NOT_FOUND);
  }

  return result; // ✅ return the student object directly
};

export const getStudentSubscriptionsUseCase = async (range?: DateRange | null) => {
  const result = await getStudentSubscriptions(range);
  if (!result || result.length === 0) {
    throw new AppError('No chart data found', HttpStatus.NOT_FOUND);
  }
  return result;
};

export const deleteStudentUseCase = async (id: string): Promise<boolean> => {
  const deleteResult = await deleteStudent(id);
  if (!deleteResult) {
    throw new AppError('Failed to delete Student', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  return true;
};

export const unSubscribeStudentUseCase = async (studentId: string): Promise<IStudentBody> => {
  const result = await unSubscribeStudent(studentId);
  return result;
};

export const fixedOtpStudentUseCase = async (userId: string): Promise<IStudentBody> => {
  const result = await fixedOtpStudent(userId);
  return result;
};
