import { Route } from '@angular/router';
import { DiscountsComponent } from 'app/modules/merchant/discounts-management/list/discounts.component';
import { DiscountsProductResolver, DiscountsResolver } from 'app/modules/merchant/discounts-management/list/discounts.resolvers';
import { InventoryCategoriesResolver, InventoryProductsResolver } from '../products-management/inventory/inventory.resolvers';
import { DiscountsProductListComponent } from './product-list/discounts-product-list.component';


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
    },
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'product-list'
    },
    {
        path     : 'product-list',
        component: DiscountsProductListComponent,
        children : [
            {
                path     : '',
                component: DiscountsProductListComponent,
                resolve  : {
                    discountsproduct  : DiscountsProductResolver,
                    categories : InventoryCategoriesResolver,
                    products: InventoryProductsResolver
                }
            }
        ]
    }
];
