import { Route } from '@angular/router';
import { WithStoreIdGuard } from 'app/core/store/guards/withStoreId.guard';
import { WithoutStoreIdGuard } from 'app/core/store/guards/withoutStoreId.guard';
import { ChooseVerticleComponent } from './choose-verticle/choose-verticle.component';
import { RedirectComponent } from './redirect/redirect.component';
import { OrdersManagementComponent } from './orders-management/orders-management.component';
import { DiscountsManagementComponent } from './discounts-management/discounts-management.component';
import { SocialMediaComponent } from './social-media/social-media.component';
import { CustomerSupportComponent } from './customer-support/customer-support.component';

export const merchantRoutes: Route[] = [
        // Merchant routes

        {
            path       : '',
            canActivate: [WithStoreIdGuard],
            canActivateChild: [WithStoreIdGuard],
            children   : [
                {path: 'dashboard', loadChildren: () => import('app/modules/merchant/dashboard/dashboard.module').then(m => m.DashboardModule)},
                {path: 'products', loadChildren: () => import('app/modules/merchant/products-management/products-management.module').then(m => m.ECommerceModule)},
                {path: 'orders', loadChildren: () => import('app/modules/merchant/orders-management/orders-management.module').then(m => m.OrdersManagementModule), component  : OrdersManagementComponent},
                {path: 'discounts', loadChildren: () => import('app/modules/merchant/discounts-management/discounts-management.module').then(m => m.DiscountsManagementModule), component  : DiscountsManagementComponent},
                {path: 'user-channels', loadChildren: () => import('app/modules/merchant/social-media/social-media.module').then(m => m.SocialMediaModule), component  : SocialMediaComponent},
            ]
        },
        {
            path       : '',
            children   : [
                {path: 'stores', loadChildren: () => import('app/modules/merchant/stores-management/choose-store.module').then(m => m.ChooseStoreModule)},
                {path: 'choose-verticle', loadChildren: () => import('app/modules/merchant/choose-verticle/choose-verticle.module').then(m => m.ChooseVerticleModule), component  : ChooseVerticleComponent},
                {path: 'customer-support', loadChildren: () => import('app/modules/merchant/customer-support/customer-support.module').then(m => m.CustomerSupportModule), component  : CustomerSupportComponent},
                {path: 'redirect', loadChildren: () => import('app/modules/merchant/redirect/redirect.module').then(m => m.RedirectModule), component  : RedirectComponent},
            ]
        }
]; 
