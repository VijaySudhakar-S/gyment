import { NextFunction, Request, Response } from 'express';
import { Logger } from 'winston';
import Container from 'typedi';
import PlanService from '@services/superadmin/planService';
import { PLAN } from '@responseMessages/superadmin';
import { CreatePlanDTO, UpdatePlanDTO } from '@interface/plan';

export const getAllPlansController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger: Logger = Container.get('logger');
  try {
    const planServiceInstance = Container.get(PlanService);
    const data = await planServiceInstance.getAllPlans();

    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.LISTED,
      data,
    });
  } catch (e: any) {
    logger.error('Get all plans controller error: %o', e.message);
    return next(e);
  }
};

export const getPlanByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger: Logger = Container.get('logger');
  try {
    const id = String(req.params.id);
    const planServiceInstance = Container.get(PlanService);
    const data = await planServiceInstance.getPlanById(id);

    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.FETCHED,
      data,
    });
  } catch (e: any) {
    logger.error('Get plan by id controller error: %o', e.message);
    return next(e);
  }
};

export const createPlanController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger: Logger = Container.get('logger');
  try {
    const body: CreatePlanDTO = req.body;
    const planServiceInstance = Container.get(PlanService);
    const data = await planServiceInstance.createPlan(body);

    return res.status(201).json({
      status: true,
      message: PLAN.SUCCESS.CREATED,
      data,
    });
  } catch (e: any) {
    logger.error('Create plan controller error: %o', e.message);
    return next(e);
  }
};

export const updatePlanController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger: Logger = Container.get('logger');
  try {
    const id = String(req.params.id);
    const body: UpdatePlanDTO = req.body;
    const planServiceInstance = Container.get(PlanService);
    const data = await planServiceInstance.updatePlan(id, body);

    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.UPDATED,
      data,
    });
  } catch (e: any) {
    logger.error('Update plan controller error: %o', e.message);
    return next(e);
  }
};

export const deletePlanController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger: Logger = Container.get('logger');
  try {
    const id = String(req.params.id);
    const planServiceInstance = Container.get(PlanService);
    const data = await planServiceInstance.deletePlan(id);

    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.DELETED,
      data,
    });
  } catch (e: any) {
    logger.error('Delete plan controller error: %o', e.message);
    return next(e);
  }
};

export const updatePlanFeaturesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger: Logger = Container.get('logger');
  try {
    const { planKey, features, limits } = req.body;
    const planServiceInstance = Container.get(PlanService);
    const data = await planServiceInstance.updatePlanFeatures(planKey, features, limits);

    return res.status(200).json({
      status: true,
      message: PLAN.SUCCESS.FEATURES_UPDATED,
      data,
    });
  } catch (e: any) {
    logger.error('Update plan features controller error: %o', e.message);
    return next(e);
  }
};
