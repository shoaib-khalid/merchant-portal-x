import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
// import { MerchantComponent } from 'app/modules/merchant/merchant.component';
// import { DashboardComponent } from './dashboard/dashboard.component';
// import { ChooseVerticalComponent } from './stores-management/choose-vertical/choose-vertical.component';
// import { StoresManagementComponent } from './stores-management/stores-management.component';
// import { ProductsManagementComponent } from './products-management/products-management.component';
// import { OrdersManagementComponent } from './orders-management/orders-management.component';
import { DiscountsManagementComponent } from './discounts-management/discounts-management.component';
import { SocialMediaComponent } from './social-media/social-media.component';
import { CustomerSupportComponent } from './customer-support/customer-support.component';
import { merchantRoutes } from 'app/modules/merchant/merchant.routing';

@NgModule({
    declarations: [
        // MerchantComponent,
        // DashboardComponent,
        // ChooseVerticalComponent,
        // StoresManagementComponent,
        // ProductsManagementComponent,
        // OrdersManagementComponent,
        DiscountsManagementComponent,
        SocialMediaComponent,
        CustomerSupportComponent
    ],
    imports     : [
        RouterModule.forChild(merchantRoutes),
    ],
    bootstrap   : [
        // MerchantComponent,
        // DashboardComponent,
        // ChooseVerticalComponent,
        // StoresManagementComponent,
        // ProductsManagementComponent,
        // OrdersManagementComponent,
        DiscountsManagementComponent,
        SocialMediaComponent,
        CustomerSupportComponent
    ]
})
export class MerchantModule
{
}
