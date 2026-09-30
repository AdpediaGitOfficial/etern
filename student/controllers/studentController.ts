import { Request, Response } from 'express';
import {
  getStudentsByUserIdUseCase,
  addStudentUseCase,
  updateStudentUseCase,
  getStudentsUseCase,
  getStudentByIdAdminUseCase,
  getStudentSubscriptionsUseCase,
  deleteStudentUseCase,
  unSubscribeStudentUseCase,
  fixedOtpStudentUseCase,
} from '../useCases/studentUseCase';
import { responseMessages } from '../../config/localization';
import AppError from '../../common/appError';
import { HttpStatus } from '../../common/httpStatus';
import { validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { IStudentBody, IEnrichedStudent } from '../../types/student/studentType';
import ExcelJS from 'exceljs';
import { getStudentSegmentCounts } from '../repos/studentRepo';
import { getStudentJourney } from '../repos/journeyRepo';

export const getStudentsByUserId = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  try {
    const userId = res.locals.userId as string;
    const result = await getStudentsByUserIdUseCase(userId);
    return res.status(200).json({
      success: true,
      message: responseMessages.response_success_get,
      result: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: responseMessages.unexpected_error,
    });
  }
};

export const addStudent = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  const data = req.body as IStudentBody;

  const result = await addStudentUseCase(data);
  res.status(200).json({
    success: true,
    message: responseMessages.response_success_post,
    result: result,
  });
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  const { studentId } = req.params as { studentId: string };
  const data = req.body as IStudentBody;
  const result = await updateStudentUseCase(studentId, data);
  res.status(200).json({
    success: true,
    message: responseMessages.response_success_put,
    result: result,
  });
});

export const getStudents = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const filters = {
      fullName: req.query.fullName as string,
      subscribed:
        req.query.subscribed === 'true'
          ? true
          : req.query.subscribed === 'false'
            ? false
            : undefined,
      isActive:
        req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,

      expiresIn7Days: req.query.expiresIn7Days === 'true',
      isExpired: req.query.isExpired === 'true',
      segment: ['active', 'expiring', 'lapsed', 'never', 'free'].includes(req.query.segment as string)
        ? (req.query.segment as 'active' | 'expiring' | 'lapsed' | 'never' | 'free')
        : undefined,
    };
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    const result = await getStudentsUseCase(filters, limit, page);
    return res.status(200).json({
      success: true,
      message: 'Fetch users successfully',
      result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
};

export const getStudentSegments = asyncHandler(async (_req: Request, res: Response) => {
  const result = await getStudentSegmentCounts();
  res.status(200).json({ success: true, message: responseMessages.response_success_get, result });
});

export const getStudentJourneyAdmin = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({ success: false, errors: errors.array() });
    return;
  }
  const result = await getStudentJourney(req.params.id);
  res.status(200).json({ success: true, message: responseMessages.response_success_get, result });
});

export const getStudentByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  const id = req.params.id;
  const result = await getStudentByIdAdminUseCase(id);
  res.status(200).json({
    success: true,
    message: responseMessages.response_success_get,
    result: result,
  });
});

const formatDateUTC = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
};

export const exportStudent = async (req: Request, res: Response) => {
  try {
    const filters = {
      fullName: req.query.fullName as string,
      subscribed:
        req.query.subscribed === 'true'
          ? true
          : req.query.subscribed === 'false'
            ? false
            : undefined,
      isActive:
        req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };
    const usersData = await getStudentsUseCase(filters, 100000, 1);

    if (!usersData || usersData.data.length === 0) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'No users found for export',
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users List');

    // Define columns
    worksheet.columns = [
      { header: 'Joining Date', key: 'joinedAt', width: 20 },
      { header: 'Student Name', key: 'fullName', width: 20 },
      { header: 'Mobile Number', key: 'mobileNumber', width: 15 },
      { header: 'User Type', key: 'subscription', width: 15 },
      { header: 'Subscription Expiry Date', key: 'subscriptionEndDate', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
    ];

    // Add rows
    usersData.data.forEach((user) => {
      const userDetails = user as IEnrichedStudent;
      worksheet.addRow({
        joinedAt: userDetails.createdAt ? formatDateUTC(userDetails.createdAt) : 'N/A',
        fullName: user.fullName,
        mobileNumber: userDetails.mobileNumber || 'N/A',
        subscription: user.subscribed ? 'Subscribed' : 'Free user',
        subscriptionEndDate: user.subscriptionEndDate
          ? formatDateUTC(user.subscriptionEndDate)
          : 'N/A',
        status: user.isActive ? 'Active' : 'Inactive',
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

    // Write to response stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error exporting users',
    });
  }
};

export const studentSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  const result = await getStudentSubscriptionsUseCase();
  res.status(200).json({
    success: true,
    message: responseMessages.response_success_get,
    result: result,
  });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  const id = req.params.id;
  const result = await deleteStudentUseCase(id);
  res.status(200).json({
    success: true,
    message: responseMessages.response_success_delete,
    result: result,
  });
});

export const unSubscribeStudent = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  const { studentId } = req.params as { studentId: string };
  const result = await unSubscribeStudentUseCase(studentId);
  res.status(200).json({
    success: true,
    message: responseMessages.response_success_put,
    result: result,
  });
});

export const fixedOtpStudent = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  const { userId } = req.params as { userId: string };
  const result = await fixedOtpStudentUseCase(userId);
  res.status(200).json({
    success: true,
    message: responseMessages.response_success_put,
    result: result,
  });
});
