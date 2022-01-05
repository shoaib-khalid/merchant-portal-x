import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { UserService } from 'app/core/user/user.service';
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
    updateClientPasswordProfile(): void
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
        this._userService.updatePasswordProfile(this.securityForm.value)
            .subscribe((response) => {

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

                 // Mark for check
                 this._changeDetectorRef.markForCheck();

            });

        setTimeout(() => {
            this.alert = null;
        }, 7000);

        // Enable the form
        this.securityForm.enable();
    }
}
