import { Route } from '@angular/router';
import { InventoryComponent } from 'app/modules/merchant/products-management/inventory/inventory.component';
import { InventoryCategoriesResolver, InventoryProductsResolver, GetStoreByIdResolver, ProductCategoriesResolver, ClientResolver, InventoryProductResolver } from 'app/modules/merchant/products-management/inventory/inventory.resolvers';
import { AddOnDetailsComponent } from './addon-template/addon-details/addon-details.component';
import { AddOnGroupTemplateResolver } from './addon-template/addon-details/addon-details.resolvers';
import { AddOnListComponent } from './addon-template/addon-list/addon-list.component';
import { AddOnComponent } from './addon-template/addon.component';
import { CanDeactivateAddOnDetails } from './addon-template/addon.guards';
import { AddOnGroupTemplatesResolver } from './addon-template/addon.resolvers';
import { CategoriesComponent } from './categories/categories.component';
import { CanDeactivateAddInventory } from './inventory/inventory.guards';
import { AddProductComponent2 } from './inventory/product-details/add-product/add-product.component';
import { ProductsForComboResolver } from './inventory/product-details/add-product/add-product.resolvers';
import { AddOnGroupOnProductResolver } from './inventory/product-details/addon-product.resolvers';
import { EditProductComponent2 } from './inventory/product-details/edit-product/edit-product.component';
import { CanDeactivateEditInventory } from './inventory/product-details/edit-product/edit-product.guards';
import { InventoryListComponent } from './inventory/product-list/inventory-list.component';
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
        resolve  : {
            categories: ProductCategoriesResolver,
            products  : InventoryProductsResolver,
            storeById : GetStoreByIdResolver,
            productsForCombo : ProductsForComboResolver,
            client : ClientResolver,
            addOnTemplates: AddOnGroupTemplatesResolver
        },
        children : [
            {
                path     : '',
                component: InventoryListComponent,
                children : [
                    {
                        path     : 'create',
                        component: AddProductComponent2,
                        canDeactivate: [CanDeactivateAddInventory]
                    },
                    {
                        path         : ':id',
                        component    : EditProductComponent2,
                        resolve      : {
                            product  : InventoryProductResolver,
                            addOn    : AddOnGroupOnProductResolver
                        },
                        canDeactivate: [CanDeactivateEditInventory]
                    }
                ]
            
            }
        ]
    
    },
    // {
    //     path     : 'inventory',
    //     component: InventoryComponent,
    //     children : [
    //         {
    //             path     : '',
    //             component: InventoryComponent,
    //             resolve  : {
    //                 categories: ProductCategoriesResolver,
    //                 products  : InventoryProductsResolver,
    //                 // tags      : InventoryTagsResolver,
    //                 storeById : GetStoreByIdResolver,
    //                 productsForCombo : ProductsForComboResolver,
    //                 client : ClientResolver
    //             }
    //         }
    //     ]
    // },
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
                    // parentCategories: ParentCategoriesResolver,
                    storeById : GetStoreByIdResolver
                }
            }
        ]
    
    },
    {
        path     : 'addon',
        component: AddOnComponent,
        resolve  : {
            storeById : GetStoreByIdResolver,
            addOnTemplates: AddOnGroupTemplatesResolver
        },
        children : [
            {
                path     : '',
                component: AddOnListComponent,
                children : [
                    {
                        path     : 'create',
                        component: AddOnDetailsComponent,
                        canDeactivate: [CanDeactivateAddOnDetails]
                    },
                    {
                        path         : ':id',
                        component    : AddOnDetailsComponent,
                        resolve      : {
                            template  : AddOnGroupTemplateResolver
                        },
                        canDeactivate: [CanDeactivateAddOnDetails]
                    }
                ]
            
            }
        ]
    
    }
];
