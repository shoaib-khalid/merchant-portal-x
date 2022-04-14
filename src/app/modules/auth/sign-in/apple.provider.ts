import { BaseLoginProvider, SocialUser } from 'angularx-social-login';
import { AppleConfiguration, SocialLooginClientId } from './oauth.types';
import { AppConfig } from 'app/config/service.config';
import { Injectable } from '@angular/core';

declare let AppleID: any;
Injectable()
export class AppleLoginProvider extends BaseLoginProvider {

    public static readonly PROVIDER_ID: string = 'APPLE';
    protected auth2: any;
    userServiceUrl:string;
    merchantPortal:string;

    constructor(
        private clientId: string,
        private _initOptions: any = { scope: 'name email' }
    ) {
        super();
        this.merchantPortal = AppConfig.settings.merchantPortalDomain;
        this.userServiceUrl = AppConfig.settings.apiServer.userService + '/clients/applecallback/' + this.merchantPortal;
    }

    public initialize(): Promise<void> {
        return new Promise((resolve, _reject) => {
            this.loadScript(
                AppleLoginProvider.PROVIDER_ID,
                'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
                () => {
                AppleID.auth.init({
                    clientId: SocialLooginClientId.APPLE_CLIENT_ID,
                    scope: AppleConfiguration.scope,
                    redirectURI: this.userServiceUrl,
                    state: AppleConfiguration.state, //used to prevent CSFR
                    usePopup: false,
                });
                resolve();
                }
            ); 
        });
    }

    public getLoginStatus(): Promise<SocialUser> {
        return new Promise((resolve, reject) => {
            // todo: implement
            resolve(new SocialUser);
        });
    }

    public signIn(signInOptions?: any):Promise<SocialUser> {
        const options = { ...this._initOptions, ...signInOptions };
        return new Promise((resolve, reject) => {
            AppleID.auth.signIn((response: any) => {
            //  console.log('response',response);
            
            }, options);
        });
    }

    public signOut(revoke?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            // AppleID doesnt have revoke method
            Promise.resolve();
        });
    }
}


