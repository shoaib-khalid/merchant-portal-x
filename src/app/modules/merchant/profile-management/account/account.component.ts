import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { UserService } from 'app/core/user/user.service';
import { Client } from '../edit-profile/edit-profile.types';

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
    clientId: string;
    client: Client;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _userService: UserService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _changeDetectorRef: ChangeDetectorRef
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

    this._userService.client$.subscribe(
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

        this._userService.updateClientProfile(this.accountForm.value)
            .subscribe((response) => {

                let clientId = response.id;

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

                 // Mark for check
                 this._changeDetectorRef.markForCheck();
            });

            // this._storesService.getStoreById(storeId)
            // .subscribe((store: Store)=>{
            //     this._storesService.store = store;
            //     this.store = store;

            //     this.storeLogo = (this.store.storeAsset) ? this.store.storeAsset.logoUrl : null;

            //     // Mark for check
            //     this._changeDetectorRef.markForCheck();
            // });
        // let newBody = {
        //     bankAccountNumber: this.editProfileForm.get('bankAccountNumber').value,
        //     bankName : this.editProfileForm.get('bankName').value,
        //     bankAccountTitle : this.editProfileForm.get('bankAccountTitle').value
        // };

        // if(this.clientPaymentId !==null){
        //     this._userService.updatePaymentProfile(this.clientPaymentId, newBody)
        //     .subscribe((response) => {

        //     });
        // } else {
        //     this._userService.createPaymentProfile(newBody)
        //     .subscribe((response) => {

        //     });
        // }

        setTimeout(() => {
            this.alert = null;
        }, 7000);

        // Enable the form
        this.accountForm.enable();
    }
}
