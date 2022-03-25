import { BaseLoginProvider, SocialUser } from 'angularx-social-login';
import { AppleConfiguration, SocialLooginClientId } from './oauth.types';

declare let AppleID: any;

export class AppleLoginProvider extends BaseLoginProvider {

  public static readonly PROVIDER_ID: string = 'APPLE';

  protected auth2: any;

  constructor(
    private clientId: string,
    private _initOptions: any = { scope: 'name email' }
  ) {
    super();
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
            redirectURI: AppleConfiguration.redirectURI,
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

  // public async signIn(signInOptions?: any): Promise<SocialUser> {
  //   // try {
  //   //   const data = await AppleID.auth.signIn()
  //   // } catch (er) {
  //   //   console.log(er);
  //   // }
  //   // return;

  // }

  public signIn(signInOptions?: any):Promise<SocialUser>{

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