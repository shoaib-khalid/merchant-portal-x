import { Route } from '@angular/router';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { EditProfileResolver } from './edit-profile/edit-profile.resolvers';

export const profileManagementRoutes: Route[] = [
    {
        path     : '',
        component: EditProfileComponent,
        resolve  : {
            clients: EditProfileResolver,
        },
    }
];
