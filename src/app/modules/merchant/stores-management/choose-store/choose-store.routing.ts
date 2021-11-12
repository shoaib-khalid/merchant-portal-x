import { Route } from '@angular/router';
import { ChooseStoreComponent } from 'app/modules/merchant/stores-management/choose-store/choose-store.component';
import { ChooseStoreListComponent } from 'app/modules/merchant/stores-management/choose-store/list/list.component';
// import { ChooseStoreDetailsComponent } from 'app/modules/merchant/choose-store/details/details.component';
import { ChooseStoreCategoriesResolver, ChooseStoreResolver, StoresResolver } from 'app/modules/merchant/stores-management/choose-store/choose-store.resolvers';
import { EditStoreComponent } from './edit-store/edit-store.component';

export const chooseStoreRoutes: Route[] = [
    {
        path     : '',
        component: ChooseStoreComponent,
        resolve  : {
            categories: ChooseStoreCategoriesResolver
        },
        children : [
            {
                path     : '',
                pathMatch: 'full',
                component: ChooseStoreListComponent,
                resolve  : {
                    // stores: StoresResolver,
                }
            },
        ]
    },
    {
        path     : 'edit/:storeid',
        component: EditStoreComponent,
        resolve  : {
            categories: ChooseStoreCategoriesResolver
        },
        children : [
            {
                path     : '',
                pathMatch: 'full',
                component: ChooseStoreListComponent,
                resolve  : {
                    // stores: StoresResolver,
                }
            },
        ]
    }
];
