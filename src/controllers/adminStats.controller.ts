import { type Request, type Response } from 'express';
import AdminStatsModel from '../models/adminStats.model.js';

/** GET /admin/stats/overview */
export const getOverviewStats = async (_req: Request, res: Response) => {
    const stats = await AdminStatsModel.getOverview();

    res.json({ status: 'success', data: stats });
};
