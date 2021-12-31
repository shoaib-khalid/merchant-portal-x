import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatSelectModule } from '@angular/material/select';
import { SharedModule } from 'app/shared/shared.module';
import { OrdersListComponent } from 'app/modules/merchant/orders-management/orders-list/orders-list.component';
import { OrderDetailsComponent } from 'app/modules/merchant/orders-management/order-details/order-details.component';
import { ChooseProviderDateTimeComponent } from 'app/modules/merchant/orders-management/choose-provider-datetime/choose-provider-datetime.component';
import { financeRoutes } from 'app/modules/merchant/orders-management/orders-management.routing';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {NgxPrintModule} from 'ngx-print';

@NgModule({
    declarations: [
        OrdersListComponent,
        OrderDetailsComponent,
        ChooseProviderDateTimeComponent
    ],
    imports     : [
        RouterModule.forChild(financeRoutes),
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatSortModule,
        MatTableModule,
        NgApexchartsModule,
        SharedModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        NgxPrintModule
    ]
})
export class OrdersManagementModule
{
}
