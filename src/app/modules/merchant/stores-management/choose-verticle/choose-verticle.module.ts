import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { ChooseVerticleComponent } from 'app/modules/merchant/stores-management/choose-verticle/choose-verticle.component';
import { ChooseVerticleListComponent } from 'app/modules/merchant/stores-management/choose-verticle/list/list.component';
import { chooseVerticleRoutes } from 'app/modules/merchant/stores-management/choose-verticle/choose-verticle.routing';

@NgModule({
    declarations: [
        ChooseVerticleComponent,
        ChooseVerticleListComponent
    ],
    imports     : [
        RouterModule.forChild(chooseVerticleRoutes),
        MatButtonModule,
        MatIconModule,
        FuseCardModule,
        SharedModule
    ]
})
export class ChooseVerticleModule
{
}
