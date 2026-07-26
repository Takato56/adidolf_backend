/**
 * Khớp với kiểu `OverviewStats` phía frontend (app/admin/page.tsx).
 * *Trend luôn có đúng 12 phần tử, từ tháng cũ nhất đến tháng hiện tại.
 */
export interface AdminOverviewStats {
    totalSales: number;
    totalOrders: number;
    activeCustomers: number;
    revenueGrowth: string;
    salesTrend: number[];
    ordersTrend: number[];
    customersTrend: number[];
    revenueTrend: number[];
}
