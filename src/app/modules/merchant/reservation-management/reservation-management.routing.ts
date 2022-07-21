import { Route } from '@angular/router';
import { ReservationListComponent } from './reservation-management.component';

export const reservationRoutes: Route[] = [
    {
        path     : '',
        component: ReservationListComponent,
    }
]