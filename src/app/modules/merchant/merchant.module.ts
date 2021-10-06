import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MerchantComponent } from 'app/modules/merchant/merchant.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChooseVerticleComponent } from './choose-verticle/choose-verticle.component';
import { StoresComponent } from './stores/stores.component';
import { ProductsComponent } from './products/products.component';
import { merchantRoutes } from 'app/modules/merchant/merchant.routing';

@NgModule({
    declarations: [
        MerchantComponent,
        DashboardComponent,
        ChooseVerticleComponent,
        StoresComponent,
        ProductsComponent
    ],
    imports     : [
        RouterModule.forChild(merchantRoutes),
    ],
    bootstrap   : [
        MerchantComponent,
        DashboardComponent,
        ChooseVerticleComponent,
        StoresComponent,
        ProductsComponent
    ]
})
export class MerchantModule
{
}
