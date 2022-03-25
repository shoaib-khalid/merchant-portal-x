import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LocaleService } from 'app/core/locale/locale.service';
import { LoginOauthService } from '../sign-in/login-oauth.service';
import { ValidateOauthRequest } from '../sign-in/oauth.types';

@Component({
    selector     : 'apple-login',
    template  : ``,
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AppleLoginComponent
{
    idToken:string;
    jwtData:string;
    clientEmail:string;

    countryCode : string = '';


    //validate Payload
    validateOauthRequest : ValidateOauthRequest;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _jwtService: JwtService,
        private _loginOauthService:LoginOauthService,
        private _router: Router,



    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
     ngOnInit(): void
     {
        this._activatedRoute.queryParams.subscribe(params => {
            this.idToken = params['id_token'];

            this.jwtData = this._jwtService.getJwtPayload(this.idToken);

            this.clientEmail = this.jwtData['email'];

            console.log("mmm", this.idToken);
            console.log("xxxx", this.jwtData);
            console.log("yyyyy", this.clientEmail);



            
            
          });

        // //get current location
        // this._localeService.get().subscribe((resp)=>{
        //     //the response status either fail or success
        //     if(resp.status === "success" && (resp.countryCode === 'MY' || resp.countryCode === 'PK')){

        //         // this.displayCountryField = true;
        //         this.countryCode = resp.countryCode === 'MY'?'MYS':resp.countryCode === 'PK'?'PAK':null;

        //     } else{
        //         // this.displayCountryField = false;
        //     }

        //     // return this.displayCountryField;
        // });

          this.validateOauthRequest = new ValidateOauthRequest();
          this.validateOauthRequest.country = this.countryCode;
          this.validateOauthRequest.loginType = "APPLE";
          this.validateOauthRequest.token = this.idToken;
          this.validateOauthRequest.email = this.clientEmail;


        //   this._loginOauthService.loginOauth(this.validateOauthRequest).subscribe(
        //       () => {
                
        //           // const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
  
        //           // // Navigate to the redirect url
        //           // this._router.navigateByUrl(redirectURL);
  
        //           this._router.navigate(['/stores' ]);
                  
        //       },
        //       exception => {
        //           console.log("exception ::::",exception);
  
        //       }
        //     );
     } 
}
