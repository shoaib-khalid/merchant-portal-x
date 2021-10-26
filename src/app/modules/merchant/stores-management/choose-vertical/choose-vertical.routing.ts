import { Route } from '@angular/router';
import { ChooseVerticalComponent } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.component';
import { ChooseVerticalListComponent } from 'app/modules/merchant/stores-management/choose-vertical/list/list.component';
// import { ChooseVerticalDetailsComponent } from 'app/modules/merchant/choose-vertical/details/details.component';
import { ChooseVerticalsResolver } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.resolvers';

export const chooseVerticalRoutes: Route[] = [
    {
        path     : '',
        component: ChooseVerticalComponent,
        children : [
            {
                path     : '',
                pathMatch: 'full',
                component: ChooseVerticalListComponent,
                resolve  : {
                    vertical: ChooseVerticalsResolver
                }
            },
        ]
    }
];
