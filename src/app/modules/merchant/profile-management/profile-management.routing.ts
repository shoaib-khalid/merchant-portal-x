import { Route } from '@angular/router';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { GetClientResolver, GetProfilePaymentResolver } from './edit-profile/edit-profile.resolvers';

export const profileManagementRoutes: Route[] = [
    {
        path     : ':panel-id',
        component: EditProfileComponent,
        resolve  : {
            clients: GetClientResolver,
            profilePayment: GetProfilePaymentResolver
        },
    }
];
