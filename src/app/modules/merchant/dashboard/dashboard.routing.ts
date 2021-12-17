import { Route } from '@angular/router';
import { DashboardComponent } from 'app/modules/merchant/dashboard/dashboard.component';
import { DashboardResolver, DailyTopProductsResolver, DetailedDailySalesResolver, SummarySalesResolver, TotalSalesResolver } from 'app/modules/merchant/dashboard/dashboard.resolvers';

export const dashboardRoutes: Route[] = [
    {
        path     : '',
        component: DashboardComponent,
        resolve  : {
            data: DashboardResolver,
            dailyTopProducts: DailyTopProductsResolver,
            detailedDailySalesResolver: DetailedDailySalesResolver,
            summarySalesResolver: SummarySalesResolver,
            totalSalesResolver: TotalSalesResolver
        }
    }
];
