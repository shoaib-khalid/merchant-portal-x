import { Route } from '@angular/router';
import { OrdersListComponent } from 'app/modules/merchant/orders-management/orders-list/orders-list.component';
import { OrderInvoiceComponent } from 'app/modules/merchant/orders-management/order-invoice/order-invoice.component';
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
        component: OrderInvoiceComponent,
        data: {
            layout: 'empty'
        },
    }
];
