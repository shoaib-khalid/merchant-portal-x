import { Route } from '@angular/router';
// import { LayoutComponent } from 'app/layout/layout.component';
import { MerchantComponent } from 'app/modules/merchant/merchant.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChooseVerticleComponent } from './choose-verticle/choose-verticle.component';
import { ChooseStoreComponent } from './choose-store/choose-store.component';
import { RedirectComponent } from './redirect/redirect.component';
import { StoresManagementComponent } from './stores-management/stores-management.component';
import { ProductsManagementComponent } from './products-management/products-management.component';
import { OrdersManagementComponent } from './orders-management/orders-management.component';
import { DiscountsManagementComponent } from './discounts-management/discounts-management.component';
import { SocialMediaComponent } from './social-media/social-media.component';
import { CustomerSupportComponent } from './customer-support/customer-support.component';

export const merchantRoutes: Route[] = [
        // Merchant routes

        {
            path       : '',
            // component  : MerchantComponent,
            children   : [
                {path: 'choose-verticle', loadChildren: () => import('app/modules/merchant/choose-verticle/choose-verticle.module').then(m => m.ChooseVerticleModule), component  : ChooseVerticleComponent},
                {path: 'choose-store', loadChildren: () => import('app/modules/merchant/choose-store/choose-store.module').then(m => m.ChooseStoreModule), component  : ChooseStoreComponent},
                {path: 'redirect', loadChildren: () => import('app/modules/merchant/redirect/redirect.module').then(m => m.RedirectModule), component  : RedirectComponent},
                {path: 'dashboard', loadChildren: () => import('app/modules/merchant/dashboard/dashboard.module').then(m => m.DashboardModule), component  : DashboardComponent},
                {path: 'stores', loadChildren: () => import('app/modules/merchant/stores-management/stores-management.module').then(m => m.StoresManagementModule), component  : StoresManagementComponent},
                {path: 'products', loadChildren: () => import('app/modules/merchant/products-management/products-management.module').then(m => m.ProductsManagementModule), component  : ProductsManagementComponent},
                {path: 'orders', loadChildren: () => import('app/modules/merchant/orders-management/orders-management.module').then(m => m.OrdersManagementModule), component  : OrdersManagementComponent},
                {path: 'discounts', loadChildren: () => import('app/modules/merchant/discounts-management/discounts-management.module').then(m => m.DiscountsManagementModule), component  : DiscountsManagementComponent},
                {path: 'user-channels', loadChildren: () => import('app/modules/merchant/social-media/social-media.module').then(m => m.SocialMediaModule), component  : SocialMediaComponent},
                {path: 'customer-support', loadChildren: () => import('app/modules/merchant/customer-support/customer-support.module').then(m => m.CustomerSupportModule), component  : CustomerSupportComponent},
            ]
        }
];
