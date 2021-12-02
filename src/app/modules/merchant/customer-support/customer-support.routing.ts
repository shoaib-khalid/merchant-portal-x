import { Route } from '@angular/router';
import { CustomersComponent } from 'app/modules/merchant/customer-support/list/customers.component';
import { CustomersResolver } from 'app/modules/merchant/customer-support/list/customers.resolvers';
import { ManageAgentComponent } from 'app/modules/merchant/customer-support/manage-agent/manage-agent.component';
import { ManageAgentResolver } from 'app/modules/merchant/customer-support/manage-agent/manage-agent.resolvers';

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
    },
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'manage-agent'
    },
    {
        path     : 'manage-agent',
        component: ManageAgentComponent,
        children : [
            {
                path     : '',
                component: ManageAgentComponent,
                resolve  : {
                    discounts  : ManageAgentResolver
                }
            }
        ]
    }
];
