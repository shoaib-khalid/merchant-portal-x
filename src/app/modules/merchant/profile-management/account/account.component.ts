import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { EditProfileService } from '../edit-profile/edit-profile.service';

@Component({
    selector       : 'settings-account',
    templateUrl    : './account.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditAccountComponent implements OnInit
{
    alert: any;
    accountForm: FormGroup;

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
        this.accountForm = this._formBuilder.group({
            name    : ['', Validators.required],
            username: ['', Validators.required],
            title   : ['Senior Frontend Developer'],
            company : ['YXZ Software'],
            about   : ['Hey! This is Brian; husband, father and gamer. I\'m mostly passionate about bleeding edge tech and chocolate! 🍫'],
            email   : ['', [Validators.required, Validators.email]],
            phone   : ['121-490-33-12'],
            country : ['malaysia'],
            language: ['english']
        });

    
    // ----------------------
    // Get client Details
    // ----------------------

    this._editProfileService.client$.subscribe(
        (response) => {
            // Fill the form
            this.accountForm.patchValue(response);
            
        } 
    );

    }

    /**
     * Send the form
     */
    updateClientProfile(): void
    {
        // Do nothing if the form is invalid
        if ( this.accountForm.invalid )
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
        this.accountForm.disable();

        // update profile
        this._editProfileService.updateClientProfile(this.accountForm.value)
            .subscribe((response) => {

            });

        // let newBody = {
        //     bankAccountNumber: this.editProfileForm.get('bankAccountNumber').value,
        //     bankName : this.editProfileForm.get('bankName').value,
        //     bankAccountTitle : this.editProfileForm.get('bankAccountTitle').value
        // };

        // if(this.clientPaymentId !==null){
        //     this._editProfileService.updatePaymentProfile(this.clientPaymentId, newBody)
        //     .subscribe((response) => {

        //     });
        // } else {
        //     this._editProfileService.createPaymentProfile(newBody)
        //     .subscribe((response) => {

        //     });
        // }

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
        this.accountForm.enable();
    }
}
