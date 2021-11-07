import { Route } from '@angular/router';
import { OrdersListComponent } from 'app/modules/merchant/orders-management/orders-list/orders-list.component';
import { OrdersListResolver } from 'app/modules/merchant/orders-management/orders-list/orders-list.resolvers';

export const financeRoutes: Route[] = [
    {
        path     : '',
        component: OrdersListComponent,
        resolve  : {
            data: OrdersListResolver,
            // data2: OrdersList2Resolver
        }
    }
];
