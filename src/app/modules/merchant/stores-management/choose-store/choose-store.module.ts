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
import { chooseStoreRoutes } from 'app/modules/merchant/stores-management/choose-store/choose-store.routing';
import { ChooseStoreComponent } from 'app/modules/merchant/stores-management/choose-store/choose-store.component';
// import { ChooseStoreDetailsComponent } from 'app/modules/merchant/choose-store/details/details.component';
import { ChooseStoreListComponent } from 'app/modules/merchant/stores-management/choose-store/list/list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { EditStoreComponent } from './edit-store/edit-store.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';


@NgModule({
    declarations: [
        ChooseStoreComponent,
        // ChooseStoreDetailsComponent,
        ChooseStoreListComponent,
        EditStoreComponent
    ],
    imports     : [
        RouterModule.forChild(chooseStoreRoutes),
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
        MatToolbarModule
    ]
})
export class ChooseStoreModule
{
}
