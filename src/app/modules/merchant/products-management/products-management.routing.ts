import { Route } from '@angular/router';
import { InventoryComponent } from 'app/modules/merchant/products-management/inventory/inventory.component';
import { InventoryCategoriesResolver, InventoryProductsResolver, InventoryTagsResolver, GetStoreByIdResolver } from 'app/modules/merchant/products-management/inventory/inventory.resolvers';
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
                    categories: InventoryCategoriesResolver,
                    products  : InventoryProductsResolver,
                    tags      : InventoryTagsResolver,
                    storeById : GetStoreByIdResolver
                }
            }
        ]
        /*children : [
            {
                path     : '',
                component: ContactsListComponent,
                resolve  : {
                    tasks    : ContactsResolver,
                    countries: ContactsCountriesResolver
                },
                children : [
                    {
                        path         : ':id',
                        component    : ContactsDetailsComponent,
                        resolve      : {
                            task     : ContactsContactResolver,
                            countries: ContactsCountriesResolver
                        },
                        canDeactivate: [CanDeactivateContactsDetails]
                    }
                ]
            }
        ]*/
    }
];
