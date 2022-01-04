import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { merchantRoutes } from 'app/modules/merchant/merchant.routing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

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
