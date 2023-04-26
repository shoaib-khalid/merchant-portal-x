import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { UserService } from 'app/core/user/user.service';
import { ClientPaymentDetails } from 'app/core/user/user.types';

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
        private _userService: UserService,
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
            bankAccountTitle  : ['', Validators.required],
            bankName          : ['', Validators.required],
            bankAccountNumber : ['', Validators.required],
            ansurMerchantId   : [''],
            ansurApiKey       : ['']
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

        this._userService.clientPaymentDetails$.subscribe(
            (response) => {

                // Fill the form
                if (response) {
                    this.planBillingForm.get('bankAccountNumber').patchValue(response.bankAccountNumber ? response.bankAccountNumber : null);
                    this.planBillingForm.get('bankName').patchValue(response.bankName ? response.bankName : null);
                    this.planBillingForm.get('bankAccountTitle').patchValue(response.bankAccountTitle ? response.bankAccountTitle : null);
                    this.planBillingForm.get('ansurMerchantId').patchValue(response.ansurMerchantId);
                    this.planBillingForm.get('ansurApiKey').patchValue(response.ansurApiKey);
    
                    this.clientPaymentId = response.id ? response.id : null;
                }
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
    updateClientBillingProfile(): void
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

        const form = this.planBillingForm.getRawValue() as ClientPaymentDetails;

        let newBody = {
            bankAccountNumber: form.bankAccountNumber,
            bankName : form.bankName,
            bankAccountTitle : form.bankAccountTitle,
            ansurApiKey : form.ansurApiKey,
            ansurMerchantId : form.ansurMerchantId
        };

        if (this.clientPaymentId !== null){
            // update payment profile
            this._userService.updatePaymentProfile(this.clientPaymentId, newBody)
            .subscribe();

        } else {
            // create payment profile
            this._userService.createPaymentProfile(newBody)
            .subscribe();
        }

        // Show a success message (it can also be an error message)
        this._fuseConfirmationService.open({
            title  : 'Success',
            message: 'Your bank details has been updated successfully!',
            icon: {
                show: true,
                name: "heroicons_outline:check",
                color: "success"
            },
            actions: {
                confirm: {
                    label: 'OK',
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
