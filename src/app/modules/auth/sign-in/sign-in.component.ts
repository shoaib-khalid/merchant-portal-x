import { Component, NgZone, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { AppleLoginProvider } from './apple.provider';
import { SocialLooginClientId, ValidateOauthRequest } from './oauth.types';
import { HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import jwt_decode from "jwt-decode";

declare const google: any;

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
    signInForm: FormGroup;
    
    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };
    showAlert: boolean = false;

    //display field country
    displayCountryField:boolean = false;
    countryCode : string = '';

    // validate Payload
    validateOauthRequest : ValidateOauthRequest;
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    
    /**
     * Constructor
     */
    constructor(
        public _dialog: MatDialog,
        private _authService: AuthService,
        private _userService: UserService,
        private _platformsService: PlatformService,
        private _socialAuthService: SocialAuthService,
        private _activatedRoute: ActivatedRoute,
        private _formBuilder: FormBuilder,
        private _router: Router,
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

                this.countryCode = this.platform.country;

            });
        
        // We need to check first the location before we proceed to send the payload
        this.signInForm.disable();
    
    }
    
    ngAfterViewInit() {
        setTimeout(() => {
            // Enable the form
            this.signInForm.enable();
        }, 2000);

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
        document.getElementById('googleButton'),
            { size: "large", text: 'signup_with', theme:"outline", shape:"circle", type:"icon" }
        );
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
            .subscribe((clientAuthenticateResponse: ClientAuthenticate) => {
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
            }, (error) => {
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
            });
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
