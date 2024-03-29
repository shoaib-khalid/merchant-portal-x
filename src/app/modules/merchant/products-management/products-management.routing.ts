import { Route } from '@angular/router';
import { InventoryComponent } from 'app/modules/merchant/products-management/inventory/inventory.component';
import { InventoryCategoriesResolver, InventoryProductsResolver, GetStoreByIdResolver, ProductCategoriesResolver } from 'app/modules/merchant/products-management/inventory/inventory.resolvers';
import { ProductsForComboResolver } from './add-product/add-product.resolvers';
import { CategoriesComponent } from './categories/categories.component';
// import { CategoriesResolver, CategoriesProductsResolver, CategoriesTagsResolver, } from './categories/categories.resolvers';
// import { InventoryBrandsResolver


export const productsManagementRoutes: Route[] = [
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'inventory'
    },
    {
        path     : 'inventory',
        component: InventoryComponent,
        children : [
            {
                path     : '',
                component: InventoryComponent,
                resolve  : {
                    categories: ProductCategoriesResolver,
                    products  : InventoryProductsResolver,
                    // tags      : InventoryTagsResolver,
                    storeById : GetStoreByIdResolver,
                    productsForCombo : ProductsForComboResolver
                }
            }
        ]
    },
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'categories'
    },
    {
        path     : 'categories',
        component: CategoriesComponent,
        children : [
            {
                path     : '',
                component: CategoriesComponent,
                resolve  : {
                    categories: InventoryCategoriesResolver,
                    // tags      : InventoryTagsResolver,
                    storeById : GetStoreByIdResolver
                }
            }
        ]
    
    },
];
