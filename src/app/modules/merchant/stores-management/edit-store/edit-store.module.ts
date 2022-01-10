import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FuseAlertModule } from '@fuse/components/alert';
import { SharedModule } from 'app/shared/shared.module';
import { StoreAccountComponent } from './store-account/store-account.component';
import { StoreAssetComponent } from './store-asset/store-asset.component';
import { StoreTimingComponent } from './store-timing/store-timing.component';
import { StoreGoogleAnalyticComponent } from './store-google-analytic/store-google-analytic.component';
import { StoreDeliveryComponent } from './store-delivery/store-delivery.component';
import { editStoreRoutes } from './edit-store.routing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
    declarations: [
        StoreAccountComponent,
        StoreAssetComponent,
        StoreDeliveryComponent,
        StoreTimingComponent,
        StoreGoogleAnalyticComponent
    ],
    imports     : [
        RouterModule.forChild(editStoreRoutes),
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatRadioModule,
        MatSelectModule,
        MatSidenavModule,
        MatSlideToggleModule,
        FuseAlertModule,
        SharedModule,
        MatToolbarModule,
        MatCheckboxModule,
        MatTooltipModule,

    ],
    exports     : [
        StoreAccountComponent,
        StoreAssetComponent,
        StoreDeliveryComponent,
        StoreTimingComponent,
        StoreGoogleAnalyticComponent
    ]
})
export class EditStoreModule
{
}
