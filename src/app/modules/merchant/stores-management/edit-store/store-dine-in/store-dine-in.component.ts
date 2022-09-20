import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StoresService } from 'app/core/store/store.service';
import { ChooseVerticalService } from '../../choose-vertical/choose-vertical.service';
import { EditStoreValidationService } from 'app/modules/merchant/stores-management/edit-store/edit-store.validation.service';
import { Store, StoreRegionCountries } from 'app/core/store/store.types';
import { debounce } from 'lodash';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector       : 'store-dine-in',
    templateUrl    : './store-dine-in.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreDineInComponent implements OnInit
{
    storeDineInForm: FormGroup;
    
    store: Store;
    storeId: string;
    storeName: string;

    /** Domain details */
    fullDomain: string;
    domainName:string;
    subDomainName: string;
    
    // dialingCode
    dialingCode: string;

    // Fuse Media Watcher
    currentScreenSize: string[] = [];

    /** Quil Modules */
    quillModules: any = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{align: []}, {list: 'ordered'}, {list: 'bullet'}],
            [{link: function(value) {
                    if (value) {
                      var href = prompt('Enter the URL');
                      this.quill.format('link', href);
                    } else {
                      this.quill.format('link', false);
                    }
                  }
            }],
            ['blockquote','clean']
        ]
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _route: ActivatedRoute,
        private _storesService: StoresService,
        private _chooseVerticalService: ChooseVerticalService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService
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
        this.storeDineInForm = this._formBuilder.group({
            dineInPaymentType   : ['COD', Validators.required],
            dineInOption        : ['SELFCOLLECT'], //SELFCOLLECT, SENDTOTABLE
            isDineIn            : [false]
        });

        this.storeId = this._route.snapshot.paramMap.get('storeid');

        this._storesService.getStoreById(this.storeId)
            .subscribe((storeResponse: Store) => {

                this.store = storeResponse;

                // set store to current store
                this._storesService.store = storeResponse;
                this._storesService.storeId = this.storeId;

                this.storeDineInForm.patchValue(storeResponse)

                // set default dineInOption to SELFCOLLECT
                if (this.storeDineInForm.get('isDineIn').value === false) {
                    this.storeDineInForm.get('dineInOption').setValue('SELFCOLLECT');
                }
 
                // Mark for check
                this._changeDetectorRef.markForCheck();

            });

        // Fuse Media Watcher Service
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {               

                this.currentScreenSize = matchingAliases;                

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    update(){

        // this will remove the item from the object
        const storeDineIn = this.storeDineInForm.value;
        
        this._storesService.update(this.storeId, storeDineIn)
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

        });

        // Enable the form
        this.storeDineInForm.enable();
    }

}
