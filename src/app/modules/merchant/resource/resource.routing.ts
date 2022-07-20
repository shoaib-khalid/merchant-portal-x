import { Route } from '@angular/router';
import { DiscountsProductResolver, DiscountsResolver } from '../discounts-management/order-discount/order-discount-list/order-discount-list.resolvers';
import { ProductsForComboResolver } from '../products-management/add-product/add-product.resolvers';
import { CategoriesComponent } from '../products-management/categories/categories.component';
import { ProductCategoriesResolver, InventoryProductsResolver, GetStoreByIdResolver, ResourceResolver, ResourceAvailabilityResolver, InventoryCategoriesResolver} from '../products-management/inventory/inventory.resolvers';
import { AddResourceComponent } from './add-resource/add-resource.component';
import { EditResourceComponent } from './edit-resource/edit-resource.component';
import { ReservedSlotsComponent } from './reserved-slots/reserved-slots.component';
import { ResourceSlotReservationDetailsResolver } from './reserved-slots/resourceSlotReservationDetails.resolver';
import { ResourceComponent } from './resource.component';

export const resourceRoutes: Route[] = [
    {
        path: '',
        pathMatch: 'full',
        resolve: {
            categories: ProductCategoriesResolver,
            products: InventoryProductsResolver,
            resources: ResourceResolver,
            resourceAvailabilites: ResourceAvailabilityResolver,
            // tags      : InventoryTagsResolver,
            storeById: GetStoreByIdResolver,
            productsForCombo: ProductsForComboResolver,
            discounts: DiscountsResolver,
            discountsproduct: DiscountsProductResolver,
            ResourceSlotReservationDetailsResolver: ResourceSlotReservationDetailsResolver
        },
        children: [
            {
                path: '',
                component: ResourceComponent,
            },
            {
                path: 'add',
                component: AddResourceComponent,
            },
            {
                path: 'edit',
                component: EditResourceComponent,
            },
            {
                path: 'reserved',
                component: ReservedSlotsComponent,
                resolve: {
                    ResourceSlotReservationDetailsResolver: ResourceSlotReservationDetailsResolver
                },
            },
            {
                path: 'categories',
                component: CategoriesComponent,
            },
        ]
    },
    // {
    //     path     : 'reserved',
    //     pathMatch : 'full',
    //     component: ReservedSlotsComponent,
    //     resolve  : {
    //         categories: ProductCategoriesResolver,
    //         products  : InventoryProductsResolver,
    //         resources : ResourceResolver,
    //         resourceAvailabilites: ResourceAvailabilityResolver,
    //         // tags      : InventoryTagsResolver,
    //         storeById : GetStoreByIdResolver,
    //         productsForCombo : ProductsForComboResolver,
    //         discounts: DiscountsResolver,
    //         discountsproduct  : DiscountsProductResolver,
    //     }
    // },
    {
        path: 'categories',
        component: CategoriesComponent,
        pathMatch: 'full',
        children: [
            {
                path: '',
                component: CategoriesComponent,
                resolve: {
                    categories: InventoryCategoriesResolver,
                    // tags      : InventoryTagsResolver,
                    storeById: GetStoreByIdResolver,
                }
            }
        ]

    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'reserved',
        resolve: {
            ResourceSlotReservationDetailsResolver: ResourceSlotReservationDetailsResolver
        },
    },
    {
        path: 'reserved',
        component: ReservedSlotsComponent,
        resolve: {
            ResourceSlotReservationDetailsResolver: ResourceSlotReservationDetailsResolver
        },
        children: [
            {
                path: '',
                component: ReservedSlotsComponent,
            }
        ]
    },

]