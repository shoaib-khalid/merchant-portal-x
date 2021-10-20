import { Route } from '@angular/router';
import { FinanceComponent } from 'app/modules/merchant/orders-management/orders-management.component';
import { FinanceResolver } from 'app/modules/merchant/orders-management/orders-management.resolvers';

export const financeRoutes: Route[] = [
    {
        path     : '',
        component: FinanceComponent,
        resolve  : {
            data: FinanceResolver
        }
    }
];
