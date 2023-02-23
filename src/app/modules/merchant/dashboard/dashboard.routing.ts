import { Route } from '@angular/router';
import { DashboardComponent } from 'app/modules/merchant/dashboard/dashboard.component';
import { DashboardResolver, DailyTopProductsResolver, DetailedDailySalesResolver, SummarySalesResolver, TotalSalesResolver, SettlementResolver, WeeklySaleResolver, OrdersListResolver, DashboardDataResolver } from 'app/modules/merchant/dashboard/dashboard.resolvers';

export const dashboardRoutes: Route[] = [
    {
        path     : '',
        component: DashboardComponent,
        runGuardsAndResolvers: "always",
        resolve  : {
            // data: DashboardResolver,
            dailyTopProducts: DailyTopProductsResolver,
            // detailedDailySalesResolver: DetailedDailySalesResolver,
            // summarySalesResolver: SummarySalesResolver,
            // totalSalesResolver: TotalSalesResolver,
            settlementResolver: SettlementResolver,
            // weeklySalesResolver: WeeklySaleResolver,
            // OrdersListResolver: OrdersListResolver,
            dashboardDataResolver: DashboardDataResolver
        }
    }
];
