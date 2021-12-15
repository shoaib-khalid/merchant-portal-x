import { Route } from '@angular/router';
import { AuthResetPasswordComponent } from 'app/modules/auth/reset-password/reset-password.component';

export const authResetPasswordRoutes: Route[] = [
    {
        path     : '',
        component: AuthResetPasswordComponent
    },
    // {
    //     path     : 'edit/:storeid',
    //     component: EditStoreComponent,
    //     resolve  : {
    //         categories: ChooseStoreCategoriesResolver
    //     },
    //     children : [
    //         {
    //             path     : '',
    //             pathMatch: 'full',
    //             component: ChooseStoreComponent,
    //         },
    //     ]
    // }
];
