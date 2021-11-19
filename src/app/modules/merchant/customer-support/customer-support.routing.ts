import { Route } from '@angular/router';
import { CustomersComponent } from 'app/modules/merchant/customer-support/list/customers.component';
import { CustomersResolver } from 'app/modules/merchant/customer-support/list/customers.resolvers';


export const customerSupportRoutes: Route[] = [
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'list'
    },
    {
        path     : 'list',
        component: CustomersComponent,
        children : [
            {
                path     : '',
                component: CustomersComponent,
                resolve  : {
                    discounts  : CustomersResolver
                }
            }
        ]
    }
];
