import { Route } from '@angular/router';
import { OrdersListComponent } from 'app/modules/merchant/orders-management/orders-list/orders-list.component';
import { OrderDetailsComponent } from 'app/modules/merchant/orders-management/order-details/order-details.component';
import { OrdersListResolver } from 'app/modules/merchant/orders-management/orders-list/orders-list.resolvers';

export const financeRoutes: Route[] = [
    {
        path     : '',
        component: OrdersListComponent,
        resolve  : {
            data: OrdersListResolver,
        }
    },
    {
        path     : ':order_id',
        component: OrderDetailsComponent,
        data: {
            layout: 'empty'
        },
    }
];
