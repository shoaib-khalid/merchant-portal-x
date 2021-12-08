import { Route } from '@angular/router';
import { EditProfileComponent } from './edit-profile/edit-profile.component';

export const profileManagementRoutes: Route[] = [
    {
        path     : '',
        component: EditProfileComponent,
    }
];
