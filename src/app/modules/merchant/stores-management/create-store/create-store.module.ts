import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { CreateStoreComponent } from 'app/modules/merchant/stores-management/create-store/create-store.component';
import { ChooseVerticalComponent } from 'app/modules/merchant/stores-management/create-store/choose-vertical/choose-vertical.component';
import { RegisterStoreComponent } from 'app/modules/merchant/stores-management/create-store/register-store/register-store.component';
import { chooseVerticalRoutes } from 'app/modules/merchant/stores-management/create-store/create-store.routing';

@NgModule({
    declarations: [
        CreateStoreComponent,
        ChooseVerticalComponent,
        RegisterStoreComponent,
    ],
    imports     : [
        RouterModule.forChild(chooseVerticalRoutes),
        MatButtonModule,
        MatIconModule,
        FuseCardModule,
        SharedModule,
        MatFormFieldModule,
        MatInputModule,
        MatToolbarModule,
        MatSelectModule,
        MatRadioModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatListModule,
        MatSlideToggleModule
    ]
})
export class CreateStoreModule
{
}
