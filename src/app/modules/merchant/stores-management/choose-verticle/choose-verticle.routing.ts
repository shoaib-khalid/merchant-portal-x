import { Route } from '@angular/router';
import { ChooseVerticleComponent } from 'app/modules/merchant/stores-management/choose-verticle/choose-verticle.component';
import { ChooseVerticleListComponent } from 'app/modules/merchant/stores-management/choose-verticle/list/list.component';
// import { ChooseVerticleDetailsComponent } from 'app/modules/merchant/choose-verticle/details/details.component';
import { ChooseVerticlesResolver } from 'app/modules/merchant/stores-management/choose-verticle/choose-verticle.resolvers';

export const chooseVerticleRoutes: Route[] = [
    {
        path     : '',
        component: ChooseVerticleComponent,
        children : [
            {
                path     : '',
                pathMatch: 'full',
                component: ChooseVerticleListComponent,
                resolve  : {
                    verticle: ChooseVerticlesResolver
                }
            },
        ]
    }
];
