import { Router } from 'express';
import {
  getStudentsByUserId,
  addStudent,
  updateStudent,
  getStudents,
  getStudentByIdAdmin,
  getStudentSegments,
  getStudentJourneyAdmin,
  exportStudent,
  studentSubscriptions,
  deleteStudent,
  unSubscribeStudent,
  fixedOtpStudent,
} from '../controllers/studentController';
import { authenticateUser, authenticateAdmin } from '../../middleware/authentication';
import {
  studentAddValidation,
  studentUpdateValidation,
  idValidation,
} from '../requests/studentRequest';

const router = Router();
router.get('/all', authenticateUser, getStudentsByUserId);
router.post('/addStudent', authenticateUser, studentAddValidation, addStudent);
router.put('/updateStudent/:studentId', authenticateUser, studentUpdateValidation, updateStudent);
//Admin panel Apis
router.get('/allAdmin', authenticateAdmin, getStudents);
router.get('/export-students', authenticateAdmin, exportStudent);
router.get('/segments', authenticateAdmin, getStudentSegments);
router.get('/:id/journey', authenticateAdmin, idValidation, getStudentJourneyAdmin);
router.get('/dashboard/subscriptions', authenticateAdmin, studentSubscriptions);
router.get('/:id', authenticateAdmin, getStudentByIdAdmin);
router.delete('/:id', authenticateAdmin, idValidation, deleteStudent);
router.get('/unsubscribe/:studentId', authenticateAdmin, unSubscribeStudent);

router.get('/fixedOtp/:userId', authenticateAdmin, fixedOtpStudent);

export default router;
