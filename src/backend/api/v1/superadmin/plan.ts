import { Router } from 'express';
import { AuthMiddleware } from '@middlewares/auth';
import {
  getAllPlansController,
  getPlanByIdController,
  createPlanController,
  updatePlanController,
  deletePlanController,
  updatePlanFeaturesController,
} from '@controller/superadmin/plan';

export default (app: Router) => {
  const route = Router();
  app.use('/plans', route);

  route.get('/', AuthMiddleware(['SUPER_ADMIN']), getAllPlansController);
  route.post('/', AuthMiddleware(['SUPER_ADMIN']), createPlanController);
  route.put('/features', AuthMiddleware(['SUPER_ADMIN']), updatePlanFeaturesController);
  route.get('/:id', AuthMiddleware(['SUPER_ADMIN']), getPlanByIdController);
  route.put('/:id', AuthMiddleware(['SUPER_ADMIN']), updatePlanController);
  route.delete('/:id', AuthMiddleware(['SUPER_ADMIN']), deletePlanController);
};
