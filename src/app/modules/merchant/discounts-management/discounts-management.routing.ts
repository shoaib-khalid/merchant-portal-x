import { Route } from '@angular/router';
import { OrderDiscountListComponent } from 'app/modules/merchant/discounts-management/order-discount/order-discount-list/order-discount-list.component';
import { DiscountsProductResolver, DiscountsResolver, InventoryProductsResolver } from 'app/modules/merchant/discounts-management/order-discount/order-discount-list/order-discount-list.resolvers';
import { InventoryCategoriesResolver } from '../products-management/inventory/inventory.resolvers';
import { DiscountBannerComponent } from './discount-banner/discount-banner.component';
import { ProductDiscountListComponent } from './product-discount/product-discount-list/product-discount-list.component';


export const discountsManagementRoutes: Route[] = [
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'list'
    },
    {
        path     : 'list',
        component: OrderDiscountListComponent,
        children : [
            {
                path     : '',
                component: OrderDiscountListComponent,
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
        component: ProductDiscountListComponent,
        children : [
            {
                path     : '',
                component: ProductDiscountListComponent,
                resolve  : {
                    discountsproduct  : DiscountsProductResolver,
                    categories : InventoryCategoriesResolver,
                    products: InventoryProductsResolver
                }
            }
        ]
    },
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'discount-banner'
    },
    {
        path     : 'discount-banner',
        component: DiscountBannerComponent,
        children : [
            {
                path     : '',
                component: DiscountBannerComponent,
                resolve  : {
                    discounts  : DiscountsResolver
                }
            }
        ]
    }
];
