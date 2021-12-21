import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { merchantRoutes } from 'app/modules/merchant/merchant.routing';

@NgModule({
    declarations: [
    
  ],
    imports     : [
        RouterModule.forChild(merchantRoutes),
    ],
    bootstrap   : [
    ]
})
export class MerchantModule
{
}
