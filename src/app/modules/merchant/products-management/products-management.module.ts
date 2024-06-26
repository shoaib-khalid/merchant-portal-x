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
import { CategoriesComponent } from './categories/categories.component';
import { AddCategoryComponent } from './add-category/add-category.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule, MAT_AUTOCOMPLETE_SCROLL_STRATEGY } from '@angular/material/autocomplete';
import { Overlay, RepositionScrollStrategy } from '@angular/cdk/overlay';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AddOnDetailsComponent } from './addon-template/addon-details/addon-details.component';
import { AddOnListComponent } from './addon-template/addon-list/addon-list.component';
import { AddOnComponent } from './addon-template/addon.component';
import { AddOnProductComponent } from './inventory/product-details/add-on-product/add-on-product.component';
import { AddProductComponent2 } from './inventory/product-details/add-product/add-product.component';
import { EditProductComponent2 } from './inventory/product-details/edit-product/edit-product.component';
import { InventoryListComponent } from './inventory/product-list/inventory-list.component';
import { DuplicateProductsModalComponent } from './inventory/product-duplicate-modal/product-duplicate-modal.component';
import { OpenItemComponent } from './open-item/open-item.component';
import { AddOpenItemComponent } from './add-open-item/add-open-item.component';
import { FileDragNDropDirective } from './inventory/product-details/add-product/file-drag-n-drop.directive';
import { NgScrollbarModule } from 'ngx-scrollbar';

@NgModule({
    declarations: [
        InventoryComponent,
        InventoryListComponent,
        AddProductComponent2,
        EditProductComponent2,
        AddOnProductComponent,
        AddCategoryComponent,
        CategoriesComponent,
        AddOnListComponent,
        AddOnDetailsComponent,
        AddOnComponent,
        DuplicateProductsModalComponent,
        OpenItemComponent,
        AddOpenItemComponent,
        FileDragNDropDirective
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
        MatAutocompleteModule,
        NgxMatSelectSearchModule,
        DragDropModule,
        MatSidenavModule,
        NgScrollbarModule 
        
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
