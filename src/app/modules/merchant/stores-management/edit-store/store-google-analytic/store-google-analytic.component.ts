import { ChangeDetectionStrategy, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector       : 'store-google-analytic',
    templateUrl    : './store-google-analytic.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreGoogleAnalyticComponent implements OnInit
{
    @ViewChild('supportNgForm') supportNgForm: NgForm;
    storeId: string;

    googleAnalyticId: string;

    googleAnalyticForm: UntypedFormGroup;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _storesService: StoresService,
        private _route: ActivatedRoute,
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
        this.googleAnalyticForm = this._formBuilder.group({
            googleAnalyticId     : [''],
        });

        this.storeId = this._route.snapshot.paramMap.get('storeid');

        this._storesService.getStoreById(this.storeId).subscribe(
            (response) => {

                // set store to current store
                this._storesService.store = response;
                this._storesService.storeId = this.storeId;

                // Fill the form
                this.googleAnalyticForm.patchValue(response);
                
                // this.googleAnalyticId = response['googleAnalyticId']

            } 
        );

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    updateGoogleAnalytic(){

        // this will remove the item from the object
        const GoogleAnalyticbody = this.googleAnalyticForm.value;

        this._storesService.update(this.storeId, GoogleAnalyticbody)
        .subscribe((response) => {

            let storeId = response.id;

            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Success',
                message: 'Your store account has been updated successfully!',
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

        })
    }

    /**
    * Clear the form
    */
    clearForm(): void
    {
        this.googleAnalyticForm.get('googleAnalyticId').patchValue("");
        // Reset the form
    }

}
