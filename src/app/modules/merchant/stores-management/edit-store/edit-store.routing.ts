import { Route } from '@angular/router';
import { EditStoreComponent } from './edit-store.component';
import { ChooseVerticalsResolver } from './edit-store.resolver';

export const editStoreRoutes: Route[] = [
    {
        path     : 'edit/:storeid',
        component: EditStoreComponent,
        resolve: {
            verticals: ChooseVerticalsResolver
        }
    }
];
