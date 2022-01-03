import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { EditProfileService } from '../edit-profile/edit-profile.service';

@Component({
    selector       : 'settings-plan-billing',
    templateUrl    : './plan-billing.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditPlanBillingComponent implements OnInit
{
    planBillingForm: FormGroup;
    plans: any[];

    alert: any;
    clientPaymentId: string;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _editProfileService: EditProfileService,
        private _fuseConfirmationService: FuseConfirmationService,

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
        this.planBillingForm = this._formBuilder.group({
            plan              : ['team'],
            bankAccountTitle  : ['', Validators.required],
            bankName          : ['', Validators.required],
            bankAccountNumber : ['', Validators.required],
            cardExpiration    : [''],
            cardCVC           : [''],
            country           : ['usa'],
            zip               : ['']
        });

        // Setup the plans
        this.plans = [
            {
                value  : 'basic',
                label  : 'BASIC',
                details: 'Starter plan for individuals.',
                price  : '10'
            },
            {
                value  : 'team',
                label  : 'TEAM',
                details: 'Collaborate up to 10 people.',
                price  : '20'
            },
            {
                value  : 'enterprise',
                label  : 'ENTERPRISE',
                details: 'For bigger businesses.',
                price  : '40'
            }
        ];

          // ----------------------
        // Get client payment Details
        // ----------------------

        this._editProfileService.clientPaymentDetails$.subscribe(
            (response) => {
                // Fill the form
                //response?. to handle if it is undefined
                this.planBillingForm.get('bankAccountNumber').patchValue(response?.bankAccountNumber?response.bankAccountNumber:null);
                this.planBillingForm.get('bankName').patchValue(response?.bankName?response.bankName:null);
                this.planBillingForm.get('bankAccountTitle').patchValue(response?.bankAccountTitle?response.bankAccountTitle:null);

                this.clientPaymentId = response?.id?response.id:null;
                
          
            } 
        );  
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    /**
     * Send the form
     */
    updateClientProfile(): void
    {
        // Do nothing if the form is invalid
        if ( this.planBillingForm.invalid )
        {
            return;
        }

        // Hide the alert
        this.alert = false;

        /**
         * 
         * Register Store Section
         * 
         */
        // Disable the form
        this.planBillingForm.disable();

        // update profile
        this._editProfileService.updateClientProfile(this.planBillingForm.value)
            .subscribe((response) => {

            });

        let newBody = {
            bankAccountNumber: this.planBillingForm.get('bankAccountNumber').value,
            bankName : this.planBillingForm.get('bankName').value,
            bankAccountTitle : this.planBillingForm.get('bankAccountTitle').value
        };

        if(this.clientPaymentId !==null){
            // update payment profile
            this._editProfileService.updatePaymentProfile(this.clientPaymentId, newBody)
            .subscribe((response) => {

            });
        } else {
            // create payment profile
            this._editProfileService.createPaymentProfile(newBody)
            .subscribe((response) => {

            });
        }

        // Show a success message (it can also be an error message)
                        // Show a success message (it can also be an error message)
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Success',
            message: 'Your profile has been updated successfully!',
            icon: {
                show: true,
                name: "heroicons_outline:check",
                color: "success"
            },
            actions: {
                confirm: {
                    label: 'Ok',
                    color: "primary",
                },
                cancel: {
                    show: false,
                },
            }
        });

        setTimeout(() => {
            this.alert = null;
        }, 7000);

        // Enable the form
        this.planBillingForm.enable();
    }
}
