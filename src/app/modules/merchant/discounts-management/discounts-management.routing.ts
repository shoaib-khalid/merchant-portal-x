import { Route } from '@angular/router';
import { DiscountsComponent } from 'app/modules/merchant/discounts-management/list/discounts.component';
import { DiscountsResolver } from 'app/modules/merchant/discounts-management/list/discounts.resolvers';


export const discountsManagementRoutes: Route[] = [
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'list'
    },
    {
        path     : 'list',
        component: DiscountsComponent,
        children : [
            {
                path     : '',
                component: DiscountsComponent,
                resolve  : {
                    discounts  : DiscountsResolver
                }
            }
        ]
    }
];
