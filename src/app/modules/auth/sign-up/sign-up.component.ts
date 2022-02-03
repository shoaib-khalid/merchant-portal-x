import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { LocaleService } from 'app/core/locale/locale.service';
import { StoresService } from 'app/core/store/store.service';
import { StoreRegionCountries } from 'app/core/store/store.types';

@Component({
    selector     : 'auth-sign-up',
    templateUrl  : './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthSignUpComponent implements OnInit
{
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };
    signUpForm: FormGroup;
    showAlert: boolean = false;
    isError: boolean = false;

    //populate country list
    countriesList: any = [];

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _storesService: StoresService,
        private _localeService:LocaleService,

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

        // get value for country list
        this._storesService.getStoreRegionCountries().subscribe((response: StoreRegionCountries[])=>{
            
            response["data"].content.forEach((country: StoreRegionCountries) => {
                this.countriesList.push(country);
            });

        });

        //get current location
        // this._localeService.get().subscribe((resp)=>
        //     {
        //         console.log("RESPONSE ::: _localeService ",resp);
        //     }
        // );

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
}
