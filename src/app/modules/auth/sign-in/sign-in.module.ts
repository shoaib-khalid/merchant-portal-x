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
import { AuthSignInComponent } from 'app/modules/auth/sign-in/sign-in.component';
import { authSignInRoutes } from 'app/modules/auth/sign-in/sign-in.routing';
import { SharedBackgroundComponent } from '../shared-background/shared-background.component';
import { SharedBackgroundModule } from '../shared-background/shared-background.module';

import { SocialLoginModule, SocialAuthServiceConfig } from 'angularx-social-login';

import { GoogleLoginProvider,FacebookLoginProvider } from 'angularx-social-login';
import { AppleLoginProvider } from './apple.provider';

@NgModule({
    declarations: [
        AuthSignInComponent,
    ],
    imports     : [
        RouterModule.forChild(authSignInRoutes),
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
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
                provider: new GoogleLoginProvider(
                  // 'clientId'                  
                  '905470792335-krfa0c32ajed37ktrn16ggj3km0783rd.apps.googleusercontent.com'
                )
              },
              {
                id: AppleLoginProvider.PROVIDER_ID,
                provider: new AppleLoginProvider(
                  // 'clientId'   
                  '[CLIENT_ID]'
                ),
              },
              {
                id: FacebookLoginProvider.PROVIDER_ID,
                provider: new FacebookLoginProvider(
                  // 'clientId'
                  '283489330438468'
                  // '2915126152079198'
                  )
              }
            ],
            onError: (err) => {
              console.error(err);
            }
          } as SocialAuthServiceConfig,
        }
      ],
})
export class AuthSignInModule
{
}
