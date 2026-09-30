import { Router } from 'express';
import { getPackageCosts, getPackageCostsByPackageId } from '../controllers/packageCostController';
import { getPackageCostByPackageIdValidation } from '../requests/packageCostRequest';

const router = Router();

router.get('/all', getPackageCosts);
router.get(
  '/by-package/:packageId',
  getPackageCostByPackageIdValidation,
  getPackageCostsByPackageId,
);

export default router;
