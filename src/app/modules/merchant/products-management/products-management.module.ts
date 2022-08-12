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
import { MatTableModule } from '@angular/material/table';
import { QuillModule } from 'ngx-quill';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from 'app/shared/shared.module';
import { InventoryComponent } from 'app/modules/merchant/products-management/inventory/inventory.component';
import { productsManagementRoutes } from 'app/modules/merchant/products-management/products-management.routing';
import { AddProductComponent } from './add-product/add-product.component';
import { CategoriesComponent } from './categories/categories.component';
import { AddCategoryComponent } from './add-category/add-category.component';
import { MatStepperModule } from '@angular/material/stepper';
import { EditProductComponent } from './edit-product/edit-product.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule, MAT_AUTOCOMPLETE_SCROLL_STRATEGY } from '@angular/material/autocomplete';
import { Overlay, RepositionScrollStrategy } from '@angular/cdk/overlay';

@NgModule({
    declarations: [
        InventoryComponent,
        AddProductComponent,
        CategoriesComponent,
        AddCategoryComponent,
        EditProductComponent
    ],
    imports     : [
        RouterModule.forChild(productsManagementRoutes),
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
        MatTableModule,
        MatSlideToggleModule,
        MatTooltipModule,
        SharedModule,
        MatStepperModule,
        MatRadioModule,
        MatAutocompleteModule
    ],
    providers   : [
        {
            provide   : MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
            useFactory: (overlay: Overlay) => (): RepositionScrollStrategy => overlay.scrollStrategies.reposition(),
            deps      : [Overlay]
        }
    ]
})
export class ECommerceModule
{
}
