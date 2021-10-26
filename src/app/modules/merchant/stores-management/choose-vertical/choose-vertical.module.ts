import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { ChooseVerticalComponent } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.component';
import { ChooseVerticalListComponent } from 'app/modules/merchant/stores-management/choose-vertical/list/list.component';
import { chooseVerticalRoutes } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.routing';

@NgModule({
    declarations: [
        ChooseVerticalComponent,
        ChooseVerticalListComponent
    ],
    imports     : [
        RouterModule.forChild(chooseVerticalRoutes),
        MatButtonModule,
        MatIconModule,
        FuseCardModule,
        SharedModule
    ]
})
export class ChooseVerticalModule
{
}
