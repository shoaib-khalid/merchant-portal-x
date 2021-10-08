import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { SharedModule } from 'app/shared/shared.module';
import { academyRoutes } from 'app/modules/merchant/stores-management/choose-store.routing';
import { ChooseStoreComponent } from 'app/modules/merchant/stores-management/choose-store.component';
// import { ChooseStoreDetailsComponent } from 'app/modules/merchant/choose-store/details/details.component';
import { ChooseStoreListComponent } from 'app/modules/merchant/stores-management/list/list.component';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
    declarations: [
        ChooseStoreComponent,
        // ChooseStoreDetailsComponent,
        ChooseStoreListComponent
    ],
    imports     : [
        RouterModule.forChild(academyRoutes),
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatSelectModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MatTooltipModule,
        FuseFindByKeyPipeModule,
        SharedModule,
        MatTabsModule
    ]
})
export class ChooseStoreModule
{
}
