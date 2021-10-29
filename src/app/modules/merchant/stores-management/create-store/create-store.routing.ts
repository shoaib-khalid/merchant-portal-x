import { Route } from '@angular/router';
import { CreateStoreComponent } from 'app/modules/merchant/stores-management/create-store/create-store.component';
import { ChooseVerticalComponent } from 'app/modules/merchant/stores-management/create-store/choose-vertical/choose-vertical.component';
import { RegisterStoreComponent } from 'app/modules/merchant/stores-management/create-store/register-store/register-store.component';
// import { ChooseVerticalDetailsComponent } from 'app/modules/merchant/choose-vertical/details/details.component';
import { ChooseVerticalsResolver } from 'app/modules/merchant/stores-management/create-store/create-store.resolvers';

export const chooseVerticalRoutes: Route[] = [
    {
        path     : '',
        component: CreateStoreComponent,
        children : [
            {
                path     : 'create-store',
                pathMatch: 'full',
                redirectTo: 'choose-vertical'
            },
            {
                path     : 'create-store/:vertical-code',
                pathMatch: 'full',
                component: RegisterStoreComponent,
                resolve  : {
                    createStore: ChooseVerticalsResolver
                }
            },
            {
                path     : 'choose-vertical',
                pathMatch: 'full',
                component: ChooseVerticalComponent,
                resolve  : {
                    vertical: ChooseVerticalsResolver
                }
            },
        ]
    }
];
