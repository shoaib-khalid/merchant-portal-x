import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { AppleLoginComponent } from './apple.component';
import { appleLoginRoutes } from './apple-login.routing';

@NgModule({
    declarations: [
      AppleLoginComponent,
    ],
    imports     : [
        RouterModule.forChild(appleLoginRoutes),
        SharedModule,
    ],

})
export class AppleLoginModule
{
}
