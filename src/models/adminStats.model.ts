import { supabase } from '../config/supabase.config.js';
import { toDatabaseError } from '../utils/supabase-error.utils.js';
import type { AdminOverviewStats } from '../types/adminStats.types.js';

const AdminStatsModel = {
    /**
     * Toàn bộ tổng hợp (doanh thu, đơn hàng, khách hàng, xu hướng 12 tháng)
     * chạy trong một hàm PostgreSQL duy nhất — xem
     * database/migrations/003_admin_overview_stats.sql.
     */
    async getOverview(): Promise<AdminOverviewStats> {
        const { data, error } = await supabase.rpc('get_admin_overview_stats');

        if (error) throw toDatabaseError(error);
        return data as AdminOverviewStats;
    }
};

export default AdminStatsModel;
