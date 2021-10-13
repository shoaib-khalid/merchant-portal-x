import { Route } from '@angular/router';
import { DashboardComponent } from 'app/modules/merchant/dashboard/dashboard.component';
import { DashboardResolver } from 'app/modules/merchant/dashboard/dashboard.resolvers';

export const dashboardRoutes: Route[] = [
    {
        path     : '',
        component: DashboardComponent,
        resolve  : {
            data: DashboardResolver
        }
    }
];
