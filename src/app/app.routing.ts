import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver, PlatformSetupResolver } from 'app/app.resolvers';
import { UserRole } from 'app/core/user/user.roles';

// @formatter:off
// tslint:disable:max-line-length
export const appRoutes: Route[] = [

    // Landing routes
    // { 
    //     path: '', 
    //     component  : LayoutComponent, 
    //     data: {
    //         layout: 'empty'
    //     },
    //     loadChildren: () => import('app/modules/landing/home/home.module').then(m => m.LandingHomeModule)
    // },  
    {
        path      : '',
        pathMatch : 'full',
        redirectTo: 'sign-in'
    },  
    
    // Error
    {path: 'error', children: [
        {path: '404', loadChildren: () => import('app/shared/error/error-404/error-404.module').then(m => m.Error404Module)},
        {path: '500', loadChildren: () => import('app/shared/error/error-500/error-500.module').then(m => m.Error500Module)}
    ]},
    {path: 'coming-soon', loadChildren: () => import('app/shared/coming-soon/coming-soon.module').then(m => m.ComingSoonModule)},

    // Redirect signed in user to the '/example'
    //
    // After the user signs in, the sign in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    {path: 'signed-in-redirect', pathMatch : 'full', redirectTo: 'redirect'},

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        resolve    : {
            platformSetup: PlatformSetupResolver
        },
        children: [
            // you also need to add in auth.interceptor to avoid page refresh if there's any auth error
            {path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.module').then(m => m.AuthConfirmationRequiredModule)},
            {path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.module').then(m => m.AuthForgotPasswordModule)},
            {path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.module').then(m => m.AuthResetPasswordModule)},
            {path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.module').then(m => m.AuthSignInModule)},
            {path: 'sign-up', loadChildren: () => import('app/modules/auth/sign-up/sign-up.module').then(m => m.AuthSignUpModule)},
            {path: 'applelogin', loadChildren: () => import('app/modules/auth/apple-login/apple-login.module').then(m => m.AppleLoginModule)}
        ]
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        resolve    : {
            platformSetup: PlatformSetupResolver
        },
        children: [
            {path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.module').then(m => m.AuthSignOutModule)},
            {path: 'unlock-session', loadChildren: () => import('app/modules/auth/unlock-session/unlock-session.module').then(m => m.AuthUnlockSessionModule)},
        ]
    },

    // Merchant routes
    {
        path       : '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component  : LayoutComponent,
        data: {
            layout: 'classy',
            roles: [UserRole.Admin, UserRole.Merchant]
        },
        resolve    : {
            initialData: InitialDataResolver,
            platformSetup: PlatformSetupResolver
        },
        children   : [
            {path: '', loadChildren: () => import('app/modules/merchant/merchant.module').then(m => m.MerchantModule)},
        ]
    }, 

    // Admin routes
    {
        path       : '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component  : LayoutComponent,
        data: {
            layout: 'futuristic',
            roles: [UserRole.Admin]
        },
        resolve    : {
            initialData: InitialDataResolver,
        },
        children   : [
            {path: 'example', loadChildren: () => import('app/modules/admin/example/example.module').then(m => m.ExampleModule)},
        ]
    },

    // Documentation
    {
        path: 'docs',
        children: [
            // Changelog
            {path: 'changelog', loadChildren: () => import('app/modules/admin/docs/changelog/changelog.module').then(m => m.ChangelogModule)}
        ]
    },

    // Redirect if not exists
    // {path: '**', redirectTo: '/'}
];
