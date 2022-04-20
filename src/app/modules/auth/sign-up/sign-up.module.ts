import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FuseCardModule } from '@fuse/components/card';
import { FuseAlertModule } from '@fuse/components/alert';
import { SharedModule } from 'app/shared/shared.module';
import { AuthSignUpComponent } from 'app/modules/auth/sign-up/sign-up.component';
import { authSignupRoutes } from 'app/modules/auth/sign-up/sign-up.routing';
import { MatSelectModule } from '@angular/material/select';

import { SharedBackgroundModule } from '../shared-background/shared-background.module';
import { FacebookLoginProvider, GoogleLoginProvider, SocialAuthServiceConfig, SocialLoginModule } from 'angularx-social-login';
import { SocialLooginClientId } from '../sign-in/oauth.types';
import { AppleLoginProvider } from '../sign-in/apple.provider';

@NgModule({
    declarations: [
        AuthSignUpComponent
    ],
    imports     : [
        RouterModule.forChild(authSignupRoutes),
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        FuseCardModule,
        FuseAlertModule,
        SharedModule,
        SharedBackgroundModule,
        SocialLoginModule
    ],
    providers: [
        {
            provide: 'SocialAuthServiceConfig',
            useValue: {
                autoLogin: false,
                providers: [
                    {
                        id: GoogleLoginProvider.PROVIDER_ID,
                        provider: new GoogleLoginProvider(SocialLooginClientId.GOOGLE_CLIENT_ID)
                    },
                    {
                        id: AppleLoginProvider.PROVIDER_ID,
                        provider: new AppleLoginProvider(SocialLooginClientId.APPLE_CLIENT_ID)
                    },
                    {
                        id: FacebookLoginProvider.PROVIDER_ID,
                        provider: new FacebookLoginProvider(SocialLooginClientId.FACEBOOK_CLIENT_ID)
                    }
                ],
                onError: (err) => {
                    console.error(err);
                }
            } as SocialAuthServiceConfig
        }
    ]
    
})
export class AuthSignUpModule
{
}
