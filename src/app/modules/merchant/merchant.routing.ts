import { Route } from '@angular/router';
import { WithStoreIdGuard } from 'app/core/store/guards/withStoreId.guard';
import { WithoutStoreIdGuard } from 'app/core/store/guards/withoutStoreId.guard';
// import { ChooseVerticalComponent } from './stores-management/choose-vertical/choose-vertical.component';
import { RedirectComponent } from './redirect/redirect.component';
// import { OrdersManagementComponent } from './orders-management/orders-management.component';
// import { DiscountsManagementComponent } from './discounts-management/discounts-management.component';
// import { CustomerSupportComponent } from './customer-support/customer-support.component';
// import { SocialMediaComponent } from './social-media/social-media.component';

export const merchantRoutes: Route[] = [
        // Merchant routes

        {
            path       : '',
            canActivate: [WithStoreIdGuard],
            canActivateChild: [WithStoreIdGuard],
            children   : [
                {path: 'dashboard', loadChildren: () => import('app/modules/merchant/dashboard/dashboard.module').then(m => m.DashboardModule)},
                {path: 'products', loadChildren: () => import('app/modules/merchant/products-management/products-management.module').then(m => m.ECommerceModule)},
                {path: 'orders', loadChildren: () => import('app/modules/merchant/orders-management/orders-management.module').then(m => m.OrdersManagementModule)},
                {path: 'discounts', loadChildren: () => import('app/modules/merchant/discounts-management/discounts-management.module').then(m => m.DiscountsManagementModule)},
                {path: 'social-media', loadChildren: () => import('app/modules/merchant/social-media/social-media.module').then(m => m.SocialMediaModule)},
            ]
        },
        {
            path       : '',
            children   : [
                {path: 'customer-support', loadChildren: () => import('app/modules/merchant/customer-support/customer-support.module').then(m => m.CustomerSupportModule)},
                {path: 'redirect', loadChildren: () => import('app/modules/merchant/redirect/redirect.module').then(m => m.RedirectModule), component  : RedirectComponent},
                {path: 'stores', loadChildren: () => import('app/modules/merchant/stores-management/stores-management.module').then(m => m.StoreManagementModule)},
                {path: 'profile', loadChildren: () => import('app/modules/merchant/profile-management/profile-management.module').then(m => m.ProfileManagementModule)},
            ]
        }
]; 
