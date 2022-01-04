import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { EditProfileService } from '../edit-profile/edit-profile.service';

@Component({
    selector       : 'settings-security',
    templateUrl    : './security.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditSecurityComponent implements OnInit
{
    securityForm: FormGroup;
    alert: any;

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
        this.securityForm = this._formBuilder.group({
            currentPassword    : ['', Validators.required],
            newPassword        : ['', Validators.required],
            confirmNewPassword : ['', Validators.required],
            twoStep            : [true],
            askPasswordChange  : [false]
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
    * Send the form
    */
    updateClientProfile(): void
    {
        // Do nothing if the form is invalid
        if ( this.securityForm.invalid )
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
        this.securityForm.disable();

        // update profile
        this._editProfileService.updatePasswordProfile(this.securityForm.value)
            .subscribe((response) => {

            });
            
        // let newBody = {
        //     bankAccountNumber: this.securityForm.get('bankAccountNumber').value,
        //     bankName : this.securityForm.get('bankName').value,
        //     bankAccountTitle : this.securityForm.get('bankAccountTitle').value
        // };

        // if(this.clientPaymentId !==null){
        //     // update payment profile
        //     this._editProfileService.updatePaymentProfile(this.securityForm, newBody)
        //     .subscribe((response) => {

        //     });
        // } else {
        //     // create payment profile
        //     this._editProfileService.createPaymentProfile(newBody)
        //     .subscribe((response) => {

        //     });
        // }

        // Show a success message (it can also be an error message)
                        // Show a success message (it can also be an error message)
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Success',
            message: 'Your password has been updated successfully!',
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
        this.securityForm.enable();
    }
}
