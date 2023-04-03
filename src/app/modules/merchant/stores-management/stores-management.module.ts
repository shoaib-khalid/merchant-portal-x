import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { SharedModule } from 'app/shared/shared.module';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { FuseCardModule } from '@fuse/components/card';
import { FuseDateRangeComponent } from '@fuse/components/date-range/date-range.component';
import { QuillModule } from 'ngx-quill';

import { ChooseVerticalComponent } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.component';
import { RegisterStoreComponent } from 'app/modules/merchant/stores-management/register-store/register-store.component';
import { ChooseStoreComponent } from 'app/modules/merchant/stores-management/choose-store/choose-store.component';
import { EditStoreComponent } from 'app/modules/merchant/stores-management/edit-store/edit-store.component';

import { storesManagementRoutes } from 'app/modules/merchant/stores-management/stores-management.routing';
import { EditStoreModule } from './edit-store/edit-store.module';
import { MatStepperModule } from '@angular/material/stepper';
import { TimeSelectorInputModule } from 'app/layout/common/time-selector/timeselector.module';
import { NgxGalleryModule } from 'ngx-gallery-9';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { CreateStoreModule } from './create-store/create-store.module';
import { NgScrollbarModule } from 'ngx-scrollbar';


@NgModule({
    declarations: [
        ChooseStoreComponent,
        ChooseVerticalComponent,
        EditStoreComponent,
        RegisterStoreComponent,
        FuseDateRangeComponent
    ],
    imports     : [
        RouterModule.forChild(storesManagementRoutes),
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatSelectModule,
        MatRadioModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MatTooltipModule,
        FuseFindByKeyPipeModule,
        SharedModule,
        MatTabsModule,
        MatPaginatorModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatListModule,
        FuseCardModule,
        MatStepperModule,
        EditStoreModule,
        TimeSelectorInputModule,
        QuillModule,
        NgxGalleryModule,
        FontAwesomeModule,
        MatMenuModule,
        NgxMatSelectSearchModule,
        CreateStoreModule, 
        NgScrollbarModule

    ],
    providers: [
        // GraphHelper
    ],
})
export class StoreManagementModule
{
}
