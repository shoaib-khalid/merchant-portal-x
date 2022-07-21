import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { reservationRoutes } from 'app/modules/merchant/reservation-management/reservation-management.routing';
import { ReservationListComponent } from './reservation-management.component';
import { ReservationInvoiceComponent } from './reservation-invoice/reservation-invoice.component';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { SharedModule } from 'app/shared/shared.module';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';


@NgModule({
    declarations: [
        ReservationListComponent,
        ReservationInvoiceComponent
    ],
    imports     : [
        RouterModule.forChild(reservationRoutes),
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatOptionModule,
        MatTabsModule,
        MatTableModule,
        SharedModule,

        MatPaginatorModule,
        MatDatepickerModule,
        MatNativeDateModule,
    ]
})
export class ReservationManagementModule
{
}