import { BaseLoginProvider, SocialUser } from 'angularx-social-login';

declare let AppleID: any;

export class AppleLoginProvider extends BaseLoginProvider {
//   getLoginStatus(): Promise<SocialUser> {
//       throw new Error('Method not implemented.');
//   }
//   signIn(): Promise<SocialUser> {
//       throw new Error('Method not implemented.');
//   }
//   signOut(revoke?: boolean): Promise<void> {
//       throw new Error('Method not implemented.');
//   }


  public static readonly PROVIDER_ID: string = 'APPLE';

  protected auth2: any;

  constructor(
    private clientId: string,
    private _initOptions: any = { scope: 'email name' }
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
            clientId: this.clientId,
            scope: 'name email',
            redirectURI: 'https://auth.example.com/auth/apple',
            state: '[ANYTHING]', //used to prevent CSFR
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

  public async signIn(signInOptions?: any): Promise<SocialUser> {
    try {
      const data = await AppleID.auth.signIn()
    } catch (er) {
      console.log(er);
    }
    return;
  }

  public signOut(revoke?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      // AppleID doesnt have revoke method
      Promise.resolve();
    });
  }
}