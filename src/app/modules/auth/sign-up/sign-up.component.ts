import { FacebookLoginProvider, GoogleLoginProvider, SocialAuthService } from '@abacritt/angularx-social-login';
import { Component, NgZone, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { PlatformService } from 'app/core/platform/platform.service';
import { Platform } from 'app/core/platform/platform.types';
import { StoresService } from 'app/core/store/store.service';
import { StoreRegionCountries } from 'app/core/store/store.types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { AppleLoginProvider } from '../sign-in/apple.provider';
import { SocialLooginClientId, ValidateOauthRequest } from '../sign-in/oauth.types';
import jwt_decode from "jwt-decode";

declare const google: any;

@Component({
    selector     : 'auth-sign-up',
    templateUrl  : './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthSignUpComponent implements OnInit
{
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    platform: Platform;
    
    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;
    isError: boolean = false;

    //populate country list
    countriesList: any = [];

    //display field country
    displayCountryField:boolean = false;

    countryCode : string = '';

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // validate Payload
    validateOauthRequest : ValidateOauthRequest;

    /**
     * Constructor
     */
    constructor(
        public _dialog: MatDialog,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _platformsService: PlatformService,
        private _storesService: StoresService,
        private _socialAuthService: SocialAuthService,
        private _ngZone: NgZone  //the navigation will be triggered outside Angular zone

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
        this.signUpForm = this._formBuilder.group({
                name      : ['', Validators.required],
                email     : ['', [Validators.required, Validators.email]],
                username  : ['', Validators.required],
                password  : ['', Validators.required],
                agreements: ['', Validators.requiredTrue],
                countryId:['', Validators.required]
            }
        );

        // Subscribe to platform data
        this._platformsService.platform$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((platform: Platform) => {
                this.platform = platform;

                this.signUpForm.get('countryId').patchValue(this.platform.country);
                this.countryCode = this.platform.country;

    
            });

        // get value for country list
        this._storesService.getStoreRegionCountries().subscribe((response: StoreRegionCountries[])=>{
            
            response["data"].content.forEach((country: StoreRegionCountries) => {
                this.countriesList.push(country);
            });

        });

    }

    ngAfterViewInit() {

        google.accounts.id.initialize({
            client_id: SocialLooginClientId.GOOGLE_CLIENT_ID,
            //Collect the token that Google returns to us when logging in
            callback: (response: any) => this._ngZone.run(() => {
              this.handleGoogleSignIn(response);
            })
        });

        //Use customized button for Google Sign-in
        google.accounts.id.renderButton(
        //    this.gbutton.nativeElement,
        document.getElementById('googleButtonSignUp'),
           { size: "large", text: 'signup_with', theme:"outline", shape:"circle", type:"icon" }
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign up
     */
    signUp(): void
    {
        // Do nothing if the form is invalid
        if ( this.signUpForm.invalid )
        {
            this.isError = true;
            return;
        }

        // Disable the form
        this.signUpForm.disable();

        // Hide the alert
        this.showAlert = false;
        this.isError = false;
    
        // Sign up
        this._authService.signUp(this.signUpForm.value)
            .subscribe(
                (response) => {

                    // Navigate to the confirmation required page
                    this._router.navigateByUrl('/confirmation-required');
                },
                (response) => {

                    // Re-enable the form
                    this.signUpForm.enable();

                    // Reset the form
                    // this.signUpNgForm.resetForm();

                    // Set the alert

                    let message;
                    if (response.status === 409) {
                        message = "Something went wrong, " + response.error.data;
                    } else {
                        message = "Something went wrong, please try again.";
                    }

                    this.alert = {
                        type   : 'error',
                        message: message
                    };

                    // Show the alert
                    this.showAlert = true;
                }
            );
    }

    signInWithGoogle(): void {
        this._socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID)
            .then(userData => {
                this.validateOauthRequest = new ValidateOauthRequest();
                this.validateOauthRequest.country = this.countryCode;
                this.validateOauthRequest.email = userData.email;
                this.validateOauthRequest.loginType = "GOOGLE";
                this.validateOauthRequest.name = userData.name;
                this.validateOauthRequest.token = userData.idToken;
                
                this._authService.loginOauth(this.validateOauthRequest,'sign-in-comp-google')
                    .subscribe(() => {
                        // const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

                        // // Navigate to the redirect url
                        // this._router.navigateByUrl(redirectURL);

                        this._router.navigate(['/stores' ]);
                    },
                    exception => {
                        console.error("An error has occured : ",exception);
                    });
            });
    }
    
    signInWithFB(): void {
        this._socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID)
            .then(userData => {
                this.validateOauthRequest = new ValidateOauthRequest();
                this.validateOauthRequest.country = this.countryCode;
                this.validateOauthRequest.email = userData.email
                this.validateOauthRequest.loginType = "FACEBOOK";
                this.validateOauthRequest.name = userData.name;
                this.validateOauthRequest.token = userData.authToken;
                this.validateOauthRequest.userId = userData.id;
                
                this._authService.loginOauth(this.validateOauthRequest,'sign-in-comp-facebook')
                    .subscribe(() => {                    
                        // const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

                        // // Navigate to the redirect url
                        // this._router.navigateByUrl(redirectURL);

                        this._router.navigate(['/stores' ]);
                    },
                    exception => {
                        console.log("exception ::::",exception);

                    });
            });
    }

    // signInWithApple(): void {
    //     this._socialAuthService.signIn(AppleLoginProvider.PROVIDER_ID)
    //         .then(userData => {

    //         });
    // }
    
    signInWithApple(): void {

        const dialogRef = this._dialog.open( 
            AuthModalComponent,{
                width : '520px',
                maxWidth: '80vw',
                data:{ 
                    icon : 'heroicons_solid:exclamation',
                    title : 'Disclaimer',
                    description : 'While using Apple ID to create your DeliverIn account, please select option to "Share My Email" to ensure your DeliverIn account is created properly.'
                }
            });
        dialogRef.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            this._socialAuthService.signIn(AppleLoginProvider.PROVIDER_ID)
                .then(userData => {

                });
        });
       
   }

    handleGoogleSignIn(response: any) {
        // Decode Google Token
        let userObject: ValidateOauthRequest = jwt_decode(response.credential);
        if (userObject) {

            let userData = {
                email         : userObject.email,
                loginType     : "GOOGLE",
                name          : userObject.name,
                token         : response.credential
            }

            this.validateOauthRequest = new ValidateOauthRequest();
            this.validateOauthRequest.country = this.countryCode;
            this.validateOauthRequest.email = userData.email;
            this.validateOauthRequest.loginType = "GOOGLE";
            this.validateOauthRequest.name = userData.name;
            this.validateOauthRequest.token = userData.token;
            
            this._authService.loginOauth(this.validateOauthRequest,'sign-in-comp-google')
                .subscribe(() => {
                    // const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

                    // // Navigate to the redirect url
                    // this._router.navigateByUrl(redirectURL);

                    this._router.navigate(['/stores' ]);
                },
                exception => {
                    console.error("An error has occured : ",exception);
                });
        }

}
}
