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
            newPassword        : ['', [Validators.required, Validators.minLength(8)]],
            confirmNewPassword : ['', [Validators.required, Validators.minLength(8)]],
            twoStep            : [true],
            askPasswordChange  : [false]
        }, 
        {
            // Use custom form validator name
            validator: this.checkPasswordMatch("newPassword", "confirmNewPassword")
        }
        );
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
                            label: 'OK',
                            color: "primary",
                        },
                        cancel: {
                            show: false,
                        },
                    }
                });

                 // Mark for check
                 this._changeDetectorRef.markForCheck();

            },
            error => {
                const confirmation = this._fuseConfirmationService.open({
                    title  : 'Alert',
                    message: 'Your current password is invalid',
                    icon: {
                        show: true,
                        name: "heroicons_outline:exclamation",
                        color: "warn"
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
            });

        setTimeout(() => {
            this.alert = null;
        }, 7000);

        // Enable the form
        this.securityForm.enable();
    }

    checkPasswordMatch(controlName: string,
        matchingControlName: string){
        return (formGroup: FormGroup) => {
          const control = formGroup.controls[controlName];
          const matchingControl = formGroup.controls[matchingControlName];
      
          if (matchingControl.errors && !matchingControl.errors.mustMatch) {
            return;
          }
      
          if (control.value !== matchingControl.value) {
            matchingControl.setErrors({ mustMatch: true });
          } else {
            matchingControl.setErrors(null);
          }
        };
    }
}
