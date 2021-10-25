import { Route } from '@angular/router';
import { ChooseStoreComponent } from 'app/modules/merchant/stores-management/choose-store.component';
import { ChooseStoreListComponent } from 'app/modules/merchant/stores-management/stores-list/list.component';
// import { ChooseStoreDetailsComponent } from 'app/modules/merchant/choose-store/details/details.component';
import { ChooseStoreCategoriesResolver, ChooseStoreResolver, ChooseStoresResolver } from 'app/modules/merchant/stores-management/choose-store.resolvers';
import { ChooseVerticleComponent } from './choose-verticle/choose-verticle.component';

export const academyRoutes: Route[] = [
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
                    stores: ChooseStoresResolver
                }
            },

            {path: 'choose-verticle', loadChildren: () => import('app/modules/merchant/stores-management/choose-verticle/choose-verticle.module').then(m => m.ChooseVerticleModule)},

            // {
            //     path     : 'choose-verticle',
            //     component: ChooseVerticleComponent,
            //     resolve  : {
            //         course: ChooseStoreResolver
            //     }
            // }
        ]
    }
];
