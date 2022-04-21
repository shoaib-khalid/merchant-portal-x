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
    selector       : 'store-account',
    templateUrl    : './store-account.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreAccountComponent implements OnInit
{
    storeAccountForm: FormGroup;
    
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
        this.checkExistingURL = debounce(this.checkExistingURL, 300);
        this.checkExistingName = debounce(this.checkExistingName,300);
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
        this.storeAccountForm = this._formBuilder.group({
            name                : ['', Validators.required],
            subdomain           : ['',[Validators.required, Validators.minLength(4), Validators.maxLength(15), EditStoreValidationService.domainValidator]],
            storeDescription    : ['', [Validators.required, Validators.maxLength(200)]],
            email               : ['', [Validators.required, Validators.email]],
            phoneNumber         : ['', EditStoreValidationService.phonenumberValidator],
            displayAddress      : [''],
            paymentType        : ['', Validators.required],
        });

        this.storeId = this._route.snapshot.paramMap.get('storeid');

        // ----------------------
        // Get Store Details by Id
        // ----------------------

        this._storesService.getStoreById(this.storeId).subscribe(
           (storeResponse) => {

                this.store = storeResponse;
               
                // Fill the form
                this.storeAccountForm.patchValue(storeResponse);

                // set store to current store
                this._storesService.store = storeResponse;
                this._storesService.storeId = this.storeId;

                // -------------------------
                // Set Dialing code
                // -------------------------
                
                let countryId = this.store.regionCountry.id;
                
                switch (countryId) {
                    case 'MYS':
                        this.dialingCode = '60'
                        break;
                    case 'PAK':
                        this.dialingCode = '92'
                        break;
                    default:
                        break;
                }

                // -------------------------
                // Choose Vertical service
                // -------------------------

                // get domain name from (vertical service)
                this._chooseVerticalService.getVerticalById(storeResponse.verticalCode)
                    .subscribe((response) => {
                        
                        this.domainName = "." + response.domain;
                    });

                // get subdomain from store domain (store service)
                this.fullDomain = storeResponse.domain;

                // domain retrieve from store service that have less than 3 xxx.xxx.xxx is consider invalid
                if (this.fullDomain.split(".").length >= 3) {
                    // set sub domain name 
                    this.subDomainName = this.fullDomain.split(".")[0]
                } else {
                    console.error("Invalid domain name from backend : ",this.fullDomain);
                    alert("Invalid domain name from backend : " + this.fullDomain)
                }

                this.storeAccountForm.get('subdomain').patchValue(this.subDomainName);

                this.storeName = storeResponse.name;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            } 
        );

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

    
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    async checkExistingURL(subdomain: string){
        let url = subdomain + this.domainName;
        let status = await this._storesService.getExistingURL(url);
        if (status === 409 && this.fullDomain !== url){
            this.storeAccountForm.get('subdomain').setErrors({domainAlreadyTaken: true});
        }
    }
    
    async checkExistingName(name:string){
        let status = await this._storesService.getExistingName(name);
        if (status === 409 && this.storeName !== name){
            this.storeAccountForm.get('name').setErrors({storeNameAlreadyTaken: true});
        }

    }

    sanitizePhoneNumber(phoneNumber: string) {

        let substring = phoneNumber.substring(0, 1)
        let countryId = this.store.regionCountry.id;
        let sanitizedPhoneNo = ''
        
        if ( countryId === 'MYS' ) {

                 if (substring === '6') sanitizedPhoneNo = phoneNumber;
            else if (substring === '0') sanitizedPhoneNo = '6' + phoneNumber;
            else if (substring === '+') sanitizedPhoneNo = phoneNumber.substring(1);
            else                        sanitizedPhoneNo = '60' + phoneNumber;

        }
        else if ( countryId === 'PAK') {

                 if (substring === '9') sanitizedPhoneNo = phoneNumber;
            else if (substring === '2') sanitizedPhoneNo = '9' + phoneNumber;
            else if (substring === '+') sanitizedPhoneNo = phoneNumber.substring(1);
            else                        sanitizedPhoneNo = '92' + phoneNumber;

        }

        return sanitizedPhoneNo;
    }

    updateStoreAccount(){

        // this will remove the item from the object
        const { subdomain,...storeAccountBody } = this.storeAccountForm.value;
    
        // add domain when sending to backend.. at frontend form call it subdomain
        storeAccountBody["domain"] = subdomain + this.domainName;

        this._storesService.update(this.storeId, storeAccountBody)
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
                        label: 'Ok',
                        color: "primary",
                    },
                    cancel: {
                        show: false,
                    },
                }
            });

        });

        // Enable the form
        this.storeAccountForm.enable();
    }

    // Quil editor text limit
    textChanged($event) {
        const MAX_LENGTH = 500;
        if ($event.editor.getLength() > MAX_LENGTH) {
           $event.editor.deleteText(MAX_LENGTH, $event.editor.getLength());
        }
    }
}
