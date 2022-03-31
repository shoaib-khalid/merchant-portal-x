import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { ClientAuthenticate } from 'app/core/auth/auth.type';
import { PlatformService } from 'app/core/platform/platform.service';
import { Platform } from 'app/core/platform/platform.types';
import { UserService } from 'app/core/user/user.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SocialAuthService } from "angularx-social-login";
import { FacebookLoginProvider, GoogleLoginProvider } from "angularx-social-login";
// import { LocaleService } from 'app/core/locale/locale.service';
import { AppleLoginProvider } from './apple.provider';
import { ValidateOauthRequest } from './oauth.types';
import { HttpHeaders } from '@angular/common/http';



@Component({
    selector     : 'auth-sign-in',
    templateUrl  : './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthSignInComponent implements OnInit
{
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    platform: Platform;
    
    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };
    signInForm: FormGroup;
    showAlert: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    //display field country
    displayCountryField:boolean = false;
    countryCode : string = '';

    //validate Payload
    validateOauthRequest : ValidateOauthRequest;

    displaySocialLogin :boolean= false;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _userService: UserService,
        private _platformsService: PlatformService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _socialAuthService: SocialAuthService,
        // private _localeService:LocaleService,



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
        
        // Create the form
        this.signInForm = this._formBuilder.group({
            username     : ['', [Validators.required]],
            password  : ['', Validators.required],
            rememberMe: ['']
        });

        // Subscribe to platform data
        this._platformsService.platform$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((platform: Platform) => {
                this.platform = platform;
                if(this.platform.id){
  
                    this.countryCode = this.platform.id === 'symplified'?'MYS':this.platform.id === 'easydukan'?'PAK':null;

                }
                else{
                    this.countryCode = null
                }

            });
        
        // We need to check first the location before we proceed to send the payload
        this.signInForm.disable();

        //     //get current location
        //     this._localeService.get().subscribe((resp)=>
        //     {
        //         //the response status either fail or success
        //         if(resp.status === "success" && (resp.countryCode === 'MY' || resp.countryCode === 'PK')){

        //             this.displayCountryField = true;
        //             this.countryCode = resp.countryCode === 'MY'?'MYS':resp.countryCode === 'PK'?'PAK':null;

        //         } else{
        //             this.displayCountryField = false;
        //         }

        //         return this.displayCountryField;
        //     }
        // );
    
    }
    
    ngAfterViewInit() {
        setTimeout(() => {
            // Enable the form
            this.signInForm.enable();
        }, 2000);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     */
    signIn(): void
    {
        // Return if the form is invalid
        if ( this.signInForm.invalid )
        {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign in
        this._authService.signIn(this.signInForm.value)
            .subscribe(
                (clientAuthenticateResponse: ClientAuthenticate) => {
                    if (clientAuthenticateResponse) {

                        this._userService.get(clientAuthenticateResponse.session.ownerId)
                            .subscribe((response)=>{
                                let user = {
                                    "id": response.id,
                                    "name": response.name,
                                    "username": response.username,
                                    "locked": response.locked,
                                    "deactivated": response.deactivated,
                                    "created": response.created,
                                    "updated": response.updated,
                                    "roleId": response.roleId,
                                    "email": response.email,
                                    "avatar": "assets/images/logo/logo_default_bg.jpg",
                                    "status": "online",
                                    "role": response.roleId
                                };
    
                                this._userService.client = user;
                            });

                        // Set the redirect url.
                        // The '/signed-in-redirect' is a dummy url to catch the request and redirect the user
                        // to the correct page after a successful sign in. This way, that url can be set via
                        // routing file and we don't have to touch here.
                        const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
    
                        // Navigate to the redirect url
                        this._router.navigateByUrl(redirectURL);
                    }
                },
                (response) => {

                    // Re-enable the form
                    this.signInForm.enable();

                    // Reset the form
                    this.signInNgForm.resetForm();

                    // Set the alert
                    this.alert = {
                        type   : 'error',
                        message: 'Wrong email or password'
                    };

                    // Show the alert
                    this.showAlert = true;
                }
            );
    }

    signInWithGoogle(): void {

        this._socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then(userData => {

            this.validateOauthRequest = new ValidateOauthRequest();
            this.validateOauthRequest.country = this.countryCode;
            this.validateOauthRequest.email = userData.email;
            this.validateOauthRequest.loginType = "GOOGLE";
            this.validateOauthRequest.name = userData.name;
            this.validateOauthRequest.token = userData.idToken;
            
            this._authService.loginOauth(this.validateOauthRequest,'sign-in-comp-google').subscribe(
            () => {
              
                // const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

                // // Navigate to the redirect url
                // this._router.navigateByUrl(redirectURL);

                this._router.navigate(['/stores' ]);
                
            },
            exception => {
                console.log("exception ::::",exception);

            }
            );


        });
    }
    
    signInWithFB(): void {

        this._socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID).then(userData => {

            this.validateOauthRequest = new ValidateOauthRequest();
            this.validateOauthRequest.country = this.countryCode;
            this.validateOauthRequest.email = userData.email
            this.validateOauthRequest.loginType = "FACEBOOK";
            this.validateOauthRequest.name = userData.name;
            this.validateOauthRequest.token = userData.authToken;
            this.validateOauthRequest.userId = userData.id;
            
            this._authService.loginOauth(this.validateOauthRequest,'sign-in-comp-facebook').subscribe(
            () => {
              
                // const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

                // // Navigate to the redirect url
                // this._router.navigateByUrl(redirectURL);

                this._router.navigate(['/stores' ]);
                
            },
            exception => {
                 console.log("exception ::::",exception);

            }
            );

       
        });
    }

    signInWithApple(): void {

        this._socialAuthService.signIn(AppleLoginProvider.PROVIDER_ID).then(userData => {

       
        });

    }

}
