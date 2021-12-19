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

import { ChooseVerticalComponent } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.component';
import { RegisterStoreComponent } from 'app/modules/merchant/stores-management/register-store/register-store.component';
import { ChooseStoreComponent } from 'app/modules/merchant/stores-management/choose-store/choose-store.component';
import { EditStoreComponent } from 'app/modules/merchant/stores-management/edit-store/edit-store.component';

import { storesManagementRoutes } from 'app/modules/merchant/stores-management/stores-management.routing';


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
        FuseCardModule
    ],
    providers: [
        // GraphHelper
    ],
})
export class StoreManagementModule
{
}
