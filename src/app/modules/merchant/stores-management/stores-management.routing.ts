import { Route } from '@angular/router';
import { ChooseStoreComponent } from './choose-store/choose-store.component';
import { ChooseStoreCategoriesResolver } from './choose-store/choose-store.resolvers';
import { ChooseVerticalComponent } from './choose-vertical/choose-vertical.component';
import { RegisterStoreComponent } from './register-store/register-store.component';
import { ChooseVerticalsResolver } from './register-store/register-store.resolvers';
import { EditStoreComponent } from './edit-store/edit-store.component';
import { CreateStoreAccountComponent } from './create-store/create-store-account/create-store-account.component';

export const storesManagementRoutes: Route[] = [
    {
        path     : '',
        resolve  : {
            categories: ChooseStoreCategoriesResolver,
        },
        children : [
            {
                path     : '',
                pathMatch: 'full',
                component: ChooseStoreComponent,
            },
            {
                path     : 'create-store',
                pathMatch: 'full',
                redirectTo: 'choose-vertical'
            },
            {
                path     : 'choose-vertical',
                pathMatch: 'full',
                component: ChooseVerticalComponent,
                resolve  : {
                    vertical: ChooseVerticalsResolver
                }
            },
            {
                path     : 'create-store/:vertical-code',
                pathMatch: 'full',
                // component: RegisterStoreComponent,
                component: CreateStoreAccountComponent,
                resolve  : {
                    createStore: ChooseVerticalsResolver
                }
            },
        ]
    },
    {
        path     : 'edit/:storeid',
        component: EditStoreComponent,
        resolve  : {
            vertical: ChooseVerticalsResolver
        },
        children : [
            {
                path     : '',
                pathMatch: 'full',
                component: ChooseStoreComponent,
            },
        ]
    }
];
