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
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QuillModule } from 'ngx-quill';
import { TimeSelectorInputModule } from 'app/layout/common/time-selector/timeselector.module';
import { NgxGalleryModule } from 'ngx-gallery-9';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatTabsModule } from '@angular/material/tabs';
import { CreateStoreAccountComponent } from './create-store-account/create-store-account.component';


@NgModule({
    declarations: [
        CreateStoreAccountComponent
    ],
    imports     : [
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
        QuillModule,
        TimeSelectorInputModule,
        NgxGalleryModule,
        FontAwesomeModule,
        NgxMatSelectSearchModule,
        MatTabsModule 

    ],
    exports     : [
    ]
})
export class CreateStoreModule
{
}
