import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { QuillModule } from 'ngx-quill';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from 'app/shared/shared.module';
import { OrderDiscountListComponent } from 'app/modules/merchant/discounts-management/order-discount/order-discount-list/order-discount-list.component';
import { discountsManagementRoutes } from 'app/modules/merchant/discounts-management/discounts-management.routing';
import { CreateOrderDiscountDialogComponent } from './order-discount/create-order-discount/create-order-discount.component';
import { ProductDiscountListComponent } from './product-discount/product-discount-list/product-discount-list.component';
import { CreateProductDiscountDialogComponent } from './product-discount/create-product-discount/create-product-discount.component';
import { ProductListDialogComponent } from './product-discount/product-list-dialog/product-list-dialog.component';
import { TimeSelectorInputModule } from 'app/layout/common/time-selector/timeselector.module';
import { EditOrderDiscountDialogComponent } from './order-discount/edit-order-discount/edit-order-discount.component';
import { MatStepperModule } from '@angular/material/stepper';

@NgModule({
    declarations: [
        OrderDiscountListComponent,
        CreateOrderDiscountDialogComponent,
        ProductDiscountListComponent,
        CreateProductDiscountDialogComponent,
        ProductListDialogComponent,
        EditOrderDiscountDialogComponent
    ],
    imports     : [
        RouterModule.forChild(discountsManagementRoutes),
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        QuillModule.forRoot(),
        MatPaginatorModule,
        MatProgressBarModule,
        MatRippleModule,
        MatSortModule,
        MatSelectModule,
        MatAutocompleteModule,
        MatTableModule,
        MatSlideToggleModule,
        MatTooltipModule,
        SharedModule,
        TimeSelectorInputModule, 
        MatStepperModule,


    ]
})
export class DiscountsManagementModule
{
}
