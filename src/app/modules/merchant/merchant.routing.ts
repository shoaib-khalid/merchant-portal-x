import { Route } from '@angular/router';
// import { LayoutComponent } from 'app/layout/layout.component';
import { MerchantComponent } from 'app/modules/merchant/merchant.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChooseVerticleComponent } from './choose-verticle/choose-verticle.component';
import { StoresComponent } from './stores/stores.component';
import { ProductsComponent } from './products/products.component';

export const merchantRoutes: Route[] = [
        // Merchant routes
        {
            path       : '',
            // component  : MerchantComponent,

            children   : [
                {path: 'dashboard', loadChildren: () => import('app/modules/merchant/dashboard/dashboard.module').then(m => m.DashboardModule), component  : DashboardComponent},
                {path: 'choose-verticle', loadChildren: () => import('app/modules/merchant/choose-verticle/choose-verticle.module').then(m => m.ChooseVerticleModule), component  : ChooseVerticleComponent},
                {path: 'stores', loadChildren: () => import('app/modules/merchant/stores/stores.module').then(m => m.StoresModule), component  : StoresComponent},
                {path: 'products', loadChildren: () => import('app/modules/merchant/products/products.module').then(m => m.ProductsModule), component  : ProductsComponent},
            ]
        }
];
