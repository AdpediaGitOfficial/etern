import { generateToken } from '../../authentication/authentication';
import AppError from '../../common/appError';
import { HttpStatus } from '../../common/httpStatus';
import { sendOtp } from '../../services/twilioService';

import {
  IOtpBody,
  IUserBody,
  IUsers,
  ILoginBody,
  IAdminBody,
  IUserProfile,
  IUserCount,
} from '../../types/user/userTypes';
import {
  checkUserExist,
  createUser,
  saveUserToken,
  setUserVerified,
  uploadAvatar,
  verifyOtp,
  checkUserNumberExist,
  updateUserOtp,
  getProfile,
  updateUser,
  getProfileById,
  getAllUsers,
  verifyLogin,
  createAdmin,
  hashPassword,
  verifyPasswordById,
  updatePassword,
  updateParentDob,
  verifyParentDobYear,
  updatecurrentStudent,
  checkUserIdExist,
  checkMobileEmailExist,
  deleteToken,
  deleteAccountByUser,
} from '../repos/registerUserRepo';
import { getCourseMaterialTrack } from '../../coursematerial/repos/courseMaterialRepo';
import { processAndUploadImage } from '../../utils/imageUploader';
import { createStudent, updateStudent } from '../../student/repos/studentRepo';
import { IStudentBody } from '../../types/student/studentType';
import { withAccess } from '../../subscription/accessRules';
import { currentMonth, DateRange, dayKey } from '../../common/dateRange';
import {
  findStudentExists,
  getStudentById,
  getStudentCount,
  getSubscribedStudentCount,
  getPeriodActivities,
} from '../../student/repos/studentRepo';

export const registerUserUseCase = async (
  data: IUserBody,
): Promise<{ _id: string; otp: string }> => {

  const userExist = await checkUserExist(data.email ?? '', data.mobileNumber);

  if (userExist) {
    if (!userExist.mobileNumberVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await sendOtp(data.mobileNumber, otp);

      await updateUser(userExist._id as string, { ...data, otp });
      await updateStudent(userExist.currentStudentId, data);
      return { _id: userExist._id as string, otp };
    } else {
      throw new AppError('User Mobile Number/Email Already Exist', HttpStatus.BAD_REQUEST);
    }
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await sendOtp(data.mobileNumber, otp);

  data.status = 1;
  data.role = 'user';
  const result = await createUser(data, otp);
  const studentData: IStudentBody = {
    ...data,
    userId: result._id,
  };
  // Add the student data to the student collection
  const studentResult = await createStudent(studentData);
  // Update the student id to the user collection
  await updatecurrentStudent(result._id, studentResult._id);
  return result;
};

export const verifyOtpUseCase = async (
  data: IOtpBody,
): Promise<{ token: string } & Omit<IUserBody, keyof Document>> => {
  const { mobileNumber, otp, deviceId, deviceType } = data;
  const otpCheck = await verifyOtp(mobileNumber, otp);
  if (!otpCheck) throw new AppError('Invalid OTP', HttpStatus.BAD_REQUEST);
  await setUserVerified(otpCheck._id);
  const token = generateToken({ role: 'user', userId: otpCheck._id });
  await saveUserToken(otpCheck._id, deviceId, deviceType, token);
  const result = await getProfileById(otpCheck._id);
  if (!result) throw new AppError('User profile not found', HttpStatus.NOT_FOUND);
  const studentDetails = await getStudentById(result.currentStudentId as string);
  if (!studentDetails) {
    throw new AppError('No student found for the given studentId', HttpStatus.NOT_FOUND);
  }
  return {
    token,
    ...result,
    studentDetails: withAccess(studentDetails),
  } as unknown as { token: string } & Omit<IUserBody, keyof Document>;
};

export const uploadAvatarUseCase = async (
  file: Express.Multer.File,
  studentId: string,
): Promise<string> => {
  const imageUrl = await processAndUploadImage(file, 'avatar');
  // upload the avatar url to db using id from the token
  const upload = await uploadAvatar(studentId, imageUrl);
  if (!upload) throw new AppError('Image upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
  return imageUrl;
};

export const sendOtpUseCase = async (data: IOtpBody): Promise<string> => {
  //check exists
  const userExist = await checkUserNumberExist(data.mobileNumber, data.type);
  if (!userExist) throw new AppError('User Not Found', HttpStatus.BAD_REQUEST);

  let otp: string;

  const fixedOtpNumbers = [
    7306548087, 5500111111, 5500111112, 5500111113, 5500111114, 5500111115, 5500111116, 5500111117,
    5500111118, 5500111119, 5500111120, 8089838462, 8157956783, 8921137041, 8281005156, 9495956000,
    9946101989, 9446528172, 5500111121, 5500111122, 5500111123, 5500111124, 5500111125, 5500111126,
    5500111127, 5500111128, 5500111129, 5500111130,
  ];

  if (fixedOtpNumbers.includes(data.mobileNumber)) {
    otp = '112233';
  } else if (data.mobileNumber === 9020493835) {
    otp = '123456';
  } else if (data.mobileNumber === 7907723393) {
    otp = '112114';
  } else if (userExist.fixedOtp) {
    otp = userExist.fixedOtp;
  } else {
    otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOtp(data.mobileNumber, otp);
  }

  await updateUserOtp(data.mobileNumber, otp);
  return otp;
};

export const getProfileUseCase = async (userId: string): Promise<IUserProfile> => {
  const result = await getProfile(userId);
  if (!result) {
    throw new AppError('No User found for the given user ID', HttpStatus.NOT_FOUND);
  }
  const studentDetails = await getStudentById(result.currentStudentId as string);
  if (!studentDetails) {
    throw new AppError('No student found for the given studentId', HttpStatus.NOT_FOUND);
  }
  // Subscription state is worked out from the dates on every call, so the app sees an ended or new plan without logging in again.
  return {
    ...result,
    studentDetails: withAccess(studentDetails),
  } as IUserProfile;
};

export const getCourseMaterialTrackUseCase = async (
  userId: string,
): Promise<{ totalMaterials: number; viewedMaterials: number; percentageViewed: number }> => {
  const result = await getCourseMaterialTrack(userId);
  return result;
};

export const updateUserUseCase = async (userId: string, data: IUserBody): Promise<IUserProfile> => {
  const chkUser = await getProfile(userId);
  if (!chkUser) {
    throw new AppError('No User found for the given user ID', HttpStatus.NOT_FOUND);
  }
  const chkDataExist = await checkMobileEmailExist(data.mobileNumber, userId, data.email as string);
  if (chkDataExist) throw new AppError('User Mobile Number/Email Exist', HttpStatus.BAD_REQUEST);
  const userData = {
    mobileNumber: data.mobileNumber,
    dob: data.dob,
    email: data.email,
    parentDob: data.parentDob,
    parentName: data.parentName,
    interest: data.interest,
  };
  const result = await updateUser(userId, userData);
  const studentData = {
    fullName: data.fullName,
    dob: data.dob,
    gender: data.gender,
  };
  const studentDetails = await updateStudent(result.currentStudentId as string, studentData);
  return {
    ...result,
    studentDetails: withAccess(studentDetails),
  } as unknown as IUserProfile;
};

export const getUsersUseCase = async (
  filters: Partial<IUserBody>,
  limit: number,
  page: number,
): Promise<{ data: IUsers[]; totalCount: number }> => {
  const result = await getAllUsers(filters, limit, page);
  if (!result.data || result.data.length === 0) {
    throw new AppError('No Users found', HttpStatus.NOT_FOUND);
  }
  return result;
};

export const loginUseCase = async (
  data: ILoginBody,
): Promise<{ token: string } & Omit<IUserBody, keyof Document>> => {
  const { email, password } = data;
  const check = await verifyLogin(email, password);
  if (!check) throw new AppError('Invalid Email/Password', HttpStatus.BAD_REQUEST);
  const token = generateToken({ role: 'admin', userId: check._id });
  const result = await getProfileById(check._id);
  if (!result) throw new AppError('User profile not found', HttpStatus.NOT_FOUND);
  return { token, ...result };
};

/**
 * Changes the signed-in administrator's own password.
 *
 * The account comes from the verified token, never from the request body, so one
 * admin cannot set another's password through this route.
 */
export const changePasswordUseCase = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ token: string }> => {
  const matches = await verifyPasswordById(userId, currentPassword);
  if (matches === null) {
    throw new AppError('No user found for the given user ID', HttpStatus.NOT_FOUND);
  }
  if (!matches) {
    throw new AppError('Your current password is incorrect', HttpStatus.BAD_REQUEST);
  }
  if (currentPassword === newPassword) {
    throw new AppError(
      'The new password must be different from the current one',
      HttpStatus.BAD_REQUEST,
    );
  }
  const hashedPassword = await hashPassword(newPassword);
  const updated = await updatePassword(userId, hashedPassword);
  if (!updated) {
    throw new AppError('Failed to update the password', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  // Every token issued before this moment is now refused, including the one the
  // caller is holding. Hand back a fresh one so the admin making the change stays
  // signed in while their other devices are cut off.
  return { token: generateToken({ role: 'admin', userId }) };
};

export const registerAdminUseCase = async (data: IAdminBody): Promise<Pick<IUsers, '_id'>> => {
  //check userAlready exist
  const userExist = await checkUserExist(data.email ?? '', data.mobileNumber);
  if (userExist)
    throw new AppError('User Mobile Number/Email Already Exist', HttpStatus.BAD_REQUEST);
  data.status = 1;
  data.role = 'admin';
  const hashedPassword = await hashPassword(data.password as string);
  data.password = hashedPassword;
  const result = await createAdmin(data);
  return result;
};

export const updateParentDobUseCase = async (
  userId: string,
  parentDob: Date,
  parentName: string,
): Promise<Pick<IUsers, '_id'>> => {
  const chkUser = await checkUserIdExist(userId);
  if (!chkUser) {
    throw new AppError('No User found for the given user ID', HttpStatus.NOT_FOUND);
  }
  const result = await updateParentDob(userId, parentDob, parentName);
  if (!result) {
    throw new AppError('Failed to update parent DOB', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  return { _id: result._id };
};

export const verifyParentDobUseCase = async (
  userId: string,
  parentDobYear: number,
): Promise<boolean> => {
  const result = await verifyParentDobYear(userId, parentDobYear);
  if (!result) {
    throw new AppError('Invalid Secret Key', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  return result;
};

export const switchStudentUseCase = async (
  userId: string,
  studentId: string,
): Promise<Pick<IUsers, '_id'>> => {
  const studentExists = await findStudentExists(studentId, userId);
  if (!studentExists) {
    throw new AppError('No profile found for the given studentId', HttpStatus.NOT_FOUND);
  }

  const result = await updatecurrentStudent(userId, studentId);
  if (!result) {
    throw new AppError('Student profile not found', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  return result;
};

export const logoutUseCase = async (userId: string, deviceType: string): Promise<boolean> => {
  const result = await deleteToken(userId, deviceType);
  if (!result) {
    throw new AppError('Token not found or already invalidated.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  return true;
};

export const getUserCountUseCase = async (range?: DateRange | null): Promise<IUserCount> => {
  const period = range ?? currentMonth();
  const totalUsers = await getStudentCount();
  const totalStudents = await getSubscribedStudentCount();
  const { registeredThisMonth, subscribedThisMonth, freeUsersThisMonth, newStudentsSubscribed } =
    await getPeriodActivities(period);
  return {
    totalUsers,
    totalStudents,
    registeredThisMonth,
    subscribedThisMonth,
    freeUsersThisMonth,
    newStudentsSubscribed,
    range: { from: dayKey(period.from), to: dayKey(period.to) },
  };
};

export const deleteAccountUseCase = async (userId: string): Promise<boolean> => {
  const result = await deleteAccountByUser(userId);
  if (!result) {
    throw new AppError('Unable to delete account.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  return true;
};
