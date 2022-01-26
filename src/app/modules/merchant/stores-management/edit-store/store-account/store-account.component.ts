import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StoresService } from 'app/core/store/store.service';
import { ChooseVerticalService } from '../../choose-vertical/choose-vertical.service';
import { RegisterStoreValidationService } from 'app/modules/merchant/stores-management/register-store/register-store.validation.service';
import { StoreRegionCountries } from 'app/core/store/store.types';
import { LocaleService } from 'app/core/locale/locale.service';
import { Locale } from 'app/core/locale/locale.types';
import { debounce } from 'lodash';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
    selector       : 'store-account',
    templateUrl    : './store-account.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreAccountComponent implements OnInit
{
    storeId: string;

    storeAccountForm: FormGroup;

    fullDomain: string;
    domainName:string;
    subDomainName: string;

    storeName: string;

    statesList: any;
    statesByCountry: string;
    /** for selected state refer form builder */ 
    
    countriesList: any = [];
    /** for selected country refer form builder */ 
    
    regionsList: any;
    /** for selected country refer form builder */ 

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _route: ActivatedRoute,
        private _storesService: StoresService,
        private _chooseVerticalService: ChooseVerticalService,
        private _localeService: LocaleService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
    )
    {
        this.checkExistingURL = debounce(this.checkExistingURL, 300);
        this.checkExistingName = debounce(this.checkExistingName,300);
    }
    /**
    * Getter for access token
    */

        get accessToken(): string
        {
            return localStorage.getItem('accessToken') ?? '';
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
            subdomain           : ['',[Validators.required, Validators.minLength(4), Validators.maxLength(15), RegisterStoreValidationService.domainValidator]],
            storeDescription    : ['', [Validators.required, Validators.maxLength(100)]],
            email               : ['', [Validators.required, Validators.email]],
            phoneNumber         : ['', RegisterStoreValidationService.phonenumberValidator],
            address             : ['', Validators.required],
            city                : ['', Validators.required],
            postcode            : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), RegisterStoreValidationService.postcodeValidator]],
            regionCountryStateId: ['', Validators.required],
            regionCountryId     : ['', Validators.required],
            paymentType        : ['', Validators.required],
        });

        // get states service
        this.statesList = [
            { countryId: "MYS", states: ["Johor","Kedah","Kelantan","Kuala Lumpur","Malacca","Negeri Sembilan", "Pahang", "Pulau Pinang", "Perak", "Perlis", "Sabah", "Serawak", "Selangor"] },
            { countryId: "PAK", states: ["Balochistan","Federal","Khyber Pakhtunkhwa", "Punjab", "Sindh"] }
        ];

        // get regions service
        this.regionsList = [
            { regionCode: "SEA", name: "South East Asia", countries: ["MY"] },
            { regionCode: "SE", name: "South East", countries: ["PK"] }
        ];

        this.storeId = this._route.snapshot.paramMap.get('storeid');

        // ----------------------
        // Get Store Details by Id
        // ----------------------

        this._storesService.getStoreById(this.storeId).subscribe(
           (storeResponse) => {
               
               // Fill the form
               this.storeAccountForm.patchValue(storeResponse);

                // set store to current store
                this._storesService.store = storeResponse;
                this._storesService.storeId = this.storeId;

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

                this.storeName = storeResponse.name

                // -------------------------
                // Get country location
                // -------------------------

                // Get allowed store countries 
                // this only to get list of country in symplified backend
                this._storesService.storeRegionCountries$.subscribe((response: StoreRegionCountries[])=>{
                    response.forEach((country: StoreRegionCountries) => {
                        this.countriesList.push(country);
                    });
                });
                

                // get locale info from (locale service)
                // this is to get the current location by using 3rd party api service
                this._localeService.locale$.subscribe((response: Locale)=>{
                    
                    let symplifiedCountryId = this.storeAccountForm.get('regionCountryId').value;
                    
                    // state (using component variable)
                    // INITIALLY (refer below section updateStates(); for changes), get states from symplified backed by using the 3rd party api
                    
                    // Get states by country Z(using symplified backend)
                    this._storesService.getStoreRegionCountryState(symplifiedCountryId).subscribe((response)=>{
                        this.statesByCountry = response.data.content;

                        // Repatch
                        this.storeAccountForm.get('regionCountryStateId').patchValue(storeResponse.regionCountryStateId);
                    });

                    // country (using form builder variable)
                    // this.editStoreForm.get('regionCountryId').patchValue(symplifiedCountryId.toUpperCase());
                    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            } 
        );

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

    updateStates(countryId: string){

        // reset current regionCountryStateId
        this.storeAccountForm.get('regionCountryStateId').patchValue("");

        // Get states by country (using symplified backend)
        this._storesService.getStoreRegionCountryState(countryId).subscribe((response)=>{
            this.statesByCountry = response.data.content;
        });

        // Mark for check
        this._changeDetectorRef.markForCheck();
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

}