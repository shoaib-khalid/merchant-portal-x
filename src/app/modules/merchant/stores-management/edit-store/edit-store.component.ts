import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { RegisterStoreValidationService } from 'app/modules/merchant/stores-management/register-store/register-store.validation.service';
import { Observable } from 'rxjs';
import { LocaleService } from 'app/core/locale/locale.service';
import { Locale } from 'app/core/locale/locale.types';
import { StoresService } from 'app/core/store/store.service';
import { Store, StoreRegionCountries, CreateStore, StoreAssets, StoreSelfDeliveryStateCharges, StoreDeliveryDetails, StoreDeliveryProvider } from 'app/core/store/store.types';
import { ActivatedRoute, Router } from '@angular/router';
import { JwtService } from 'app/core/jwt/jwt.service';
import { debounce } from 'lodash';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { FuseAlertType } from '@fuse/components/alert';
import { ChooseVerticalService } from '../choose-vertical/choose-vertical.service';

@Component({
    selector     : 'edit-store-page',
    templateUrl  : './edit-store.component.html',
    styles       : [
        `
            .ql-container { height: 156px; }

        `
    ],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class EditStoreComponent implements OnInit
{
    @ViewChild('supportNgForm') supportNgForm: NgForm;

    storeId: string;
    
    fullDomain: string;
    domainName:string;
    subDomainName: string;

    storeName: string;
    
    editStoreForm: FormGroup;
    otherStoreForm: FormGroup;
    
    statesList: any;
    statesByCountry: string;
    /** for selected state refer form builder */ 
    
    countriesList: any = [];
    /** for selected country refer form builder */ 
    
    regionsList: any;
    /** for selected country refer form builder */ 
    
    deliveryFullfilment: any;
    deliveryPartners: any = [];
    hasDeliveryPartnerError: boolean = true;

    storeDeliveryProvider: StoreDeliveryProvider[] = [];
    
    _originalAllowedSelfDeliveryStates: any = [];
    _allowedSelfDeliveryStates: any = [];
    allowedSelfDeliveryStates: FormArray;
    
    _storeTiming: any;
    storeTiming: FormArray;
    
    // Image part    
    files: any;

    timeAlert: any = [];
    
    // display error
    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };
    isDisplayStatus: boolean = false;
    
    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _storesService: StoresService,
        private _jwt: JwtService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _localeService: LocaleService,
        private _chooseVerticalService: ChooseVerticalService,
        private _router: Router,
        private _route: ActivatedRoute
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
        // Create the support form
        this.editStoreForm = this._formBuilder.group({
            // Main Store Section
            name               : ['', Validators.required],
            city               : ['', Validators.required],
            address            : ['', Validators.required],
            postcode           : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), RegisterStoreValidationService.postcodeValidator]],
            storeDescription   : ['', [Validators.required, Validators.maxLength(100)]],
            email              : ['', [Validators.required, Validators.email]],
            clientId           : [''],
            subdomain          : ['',[Validators.required, Validators.minLength(4), Validators.maxLength(15), RegisterStoreValidationService.domainValidator]],
            regionCountryId    : ['', Validators.required],
            regionCountryStateId: ['', Validators.required],
            phoneNumber        : ['', RegisterStoreValidationService.phonenumberValidator],
            serviceChargesPercentage: [0],
            verticalCode       : [''],
            paymentType        : ['', Validators.required],
            
            // Store Timing
            storeTiming: this._formBuilder.array([]),

            // Allowed Self Delivery States
            allowedSelfDeliveryStates: this._formBuilder.array([]),

            // Delivery Provider
            deliveryType       : ['', Validators.required],

            // Delivery Partner
            deliveryPartner      : ['', Validators.required],
            
            // Else
            allowScheduledDelivery : [false],
            allowStorePickup : [false],
            isBranch: [false],
            isSnooze: [false],
        });

        // Logo & Banner
        this.files = [
            { 
                type: "logo", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "500", 
                recommendedImageHeight: "500", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            },
            { 
                type: "banner", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "1110", 
                recommendedImageHeight: "250", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            },
            { 
                type: "bannerMobile", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "950", 
                recommendedImageHeight: "260", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            },
        ];

        this.storeId = this._route.snapshot.paramMap.get('storeid');

        // ----------------------
        // Get Store Details by Id
        // ----------------------

        this._storesService.getStoreById(this.storeId).subscribe(
           (response) => {

                // set store to current store
                this._storesService.store = response;
                this._storesService.storeId = this.storeId;

                // Fill the form
                this.editStoreForm.patchValue(response);

                // -------------------------
                // Choose Vertical service
                // -------------------------

                // get domain name from (vertical service)
                this._chooseVerticalService.getVerticalById(response.verticalCode)
                    .subscribe((response) => {
                        this.domainName = "." + response.domain;
                    });

                // get subdomain from store domain (store service)
                this.fullDomain = response.domain;

                // domain retrieve from store service that have less than 3 xxx.xxx.xxx is consider invalid
                if (this.fullDomain.split(".").length >= 3) {
                    // set sub domain name 
                    this.subDomainName = this.fullDomain.split(".")[0]
                } else {
                    console.error("Invalid domain name from backend : ",this.fullDomain);
                    alert("Invalid domain name from backend : " + this.fullDomain)
                }

                this.editStoreForm.get('subdomain').patchValue(this.subDomainName);

                this.storeName = response.name

                // ---------------
                // set timing
                // ---------------

                this._storeTiming = response.storeTiming;
                
                this._storeTiming.map(item => item["isOpen"] = !item.isOff);
                this._storeTiming.map(item => {
                    if (item.breakStartTime === null && item.breakEndTime === null){
                        item["isBreakTime"] = false;
                    }
                    else{
                        item["isBreakTime"] = true;
                    }

                });

                this._storeTiming.forEach(item => {
                    this.storeTiming = this.editStoreForm.get('storeTiming') as FormArray;
                    this.storeTiming.push(this._formBuilder.group(item));
                });

                // ---------------
                // set assets image
                // ---------------

                this.files[0].fileSource = response.storeAsset.logoUrl;
                this.files[1].fileSource = response.storeAsset.bannerUrl;
                this.files[2].fileSource = response.storeAsset.bannerMobileUrl;

                // Reason why we put de under get vertical code by paramMap is because
                // we need the verticalCode before we need to query getStoreDeliveryProvider which require verticalCode
    
                let _verticalCode = this.editStoreForm.get('verticalCode').value;
                let _regionCountryId = this.editStoreForm.get('regionCountryId').value;
                let _deliveryType;
                if (_verticalCode === "FnB" || _verticalCode === "FnB_PK") {
                    _deliveryType = "ADHOC";
                } else if (_verticalCode === 'E-Commerce' || _verticalCode === 'e-commerce-b2b2c' || _verticalCode === 'ECommerce_PK') {
                    _deliveryType = "SCHEDULED";
                } else {
                    console.error("Invalid vertical code: ", _verticalCode)
                    alert("Invalid vertical code : " + _verticalCode);
                }

                // ----------------------
                // Get Store Delivery Providers
                // ----------------------

                this._storesService.getStoreDeliveryProvider({deliveryType: _deliveryType, regionCountryId: _regionCountryId}).subscribe(
                    (response: StoreDeliveryProvider[]) => {
                        // reset this.deliveryPartners first to initial state
                        this.deliveryPartners = [];
                        response.forEach(item => {
                            // push the data into array
                            this.deliveryPartners.push({
                                id: item.id,
                                name: item.name,
                                providerImage: item.providerImage,
                                label: item.name,
                                selected: false
                            });
                        });
                        // check changes
                        this.checkDeliveryPartner();

                    }
                );

                // ----------------------
                // Get Current Store Delivery Provider
                // ----------------------

                this._storesService.getStoreRegionCountryDeliveryProvider(this.storeId).subscribe(
                    (response: StoreDeliveryProvider[]) => {

                        this.storeDeliveryProvider = response;
                        
                        let _deliverySpId = response.length > 0 ? response[0].deliverySpId : "";
                        this.editStoreForm.get('deliveryPartner').patchValue(_deliverySpId);
                    }
                );
           } 
        );

        // get states service
        this.statesList = [
            { countryId: "MYS", states: ["Johor","Kedah","Kelantan","Kuala Lumpur","Malacca","Negeri Sembilan", "Pahang", "Pulau Pinang", "Perak", "Perlis", "Sabah", "Serawak", "Selangor"] },
            { countryId: "PAK", states: ["Balochistan","Federal","Khyber Pakhtunkhwa", "Punjab", "Sindh"] }
        ];

        // get countries service
        // this.countriesList = [
        //     { countryCode: "MY", name: "Malaysia" },
        //     { countryCode: "PK", name: "Pakistan" }
        // ];

        // get regions service
        this.regionsList = [
            { regionCode: "SEA", name: "South East Asia", countries: ["MY"] },
            { regionCode: "SE", name: "South East", countries: ["PK"] }
        ];

        this.deliveryFullfilment = [
            { selected: false, option: "INSTANT_DELIVERY", label: "Instant Delivery", tooltip: "This store support instant delivery. (Provided by store own logistic or delivery partners)" }, 
            { selected: false, option: "REGULAR_DELIVERY", label: "Regular Delivery", tooltip: "This store support regular delivery. (Provided by store own logistic or delivery partners)" },
            { selected: false, option: "SCHEDULED_DELIVERY", label: "Scheduled Delivery", tooltip: "This store allow scheduled delivery request from customer" },
            { selected: false, option: "STORE_PICKUP", label: "Allow Store Pickup", tooltip: "This store allow customer to pick up item from store" }
        ];

        // -------------------------------------
        // store delivery details
        // -------------------------------------

        this._storesService.getStoreDeliveryDetails(this.storeId).subscribe(
            (response: StoreDeliveryDetails) => {

                let _deliveryType = response ? response.type : "";
                let _allowsStorePickup = response ? response.allowsStorePickup : "";

                this.editStoreForm.get('deliveryType').patchValue(_deliveryType);
                this.editStoreForm.get('allowStorePickup').patchValue(_allowsStorePickup);
            }
        );

        // -------------------------------------
        // store allowed self delivery states
        // -------------------------------------
        
        this._storesService.getSelfDeliveryStateCharges(this.storeId).subscribe(
            (response: StoreSelfDeliveryStateCharges[]) => {
                
                if (response.length) {
                    response.forEach(item => {
                        this._allowedSelfDeliveryStates.push({
                            id: item.id,
                            deliveryStates: item.region_country_state_id,
                            deliveryCharges: item.delivery_charges
                        });
                    });
                } else {
                    this._allowedSelfDeliveryStates = [
                        { deliveryStates: "", deliveryCharges:"" }
                    ];
                }

                this._allowedSelfDeliveryStates.forEach(item => {
                    this.allowedSelfDeliveryStates = this.editStoreForm.get('allowedSelfDeliveryStates') as FormArray;
                    this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
                });
            }
        );
        
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
            
            let symplifiedCountryId = this.editStoreForm.get('regionCountryId').value;
            
            // state (using component variable)
            // INITIALLY (refer below section updateStates(); for changes), get states from symplified backed by using the 3rd party api
            
            // Get states by country Z(using symplified backend)
            this._storesService.getStoreRegionCountryState(symplifiedCountryId).subscribe((response)=>{
                this.statesByCountry = response.data.content;
            });

            // country (using form builder variable)
            // this.editStoreForm.get('regionCountryId').patchValue(symplifiedCountryId.toUpperCase());
            
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

        // set required value that does not appear in register-store.component.html
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
        this.editStoreForm.get('clientId').patchValue(clientId);

        this.editStoreForm.get('isBranch').patchValue(false);
        this.editStoreForm.get('isSnooze').patchValue(false);

    }

    ngAfterViewInit(): void
    {
        setTimeout(() => {
            // this way , we keep _originalAllowedSelfDeliveryStates integrity
            this._originalAllowedSelfDeliveryStates = this._allowedSelfDeliveryStates;
        }, 0);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Clear the form
     */
    clearForm(): void
    {
        // Reset the form
        this.supportNgForm.resetForm();
    }

    /**
     * Send the form
     */
    updateForm(): void
    {

        if(this.hasDeliveryPartnerError === false) {
            this.editStoreForm.get('deliveryPartner').setErrors(null);
        }

        // Do nothing if the form is invalid
        let BreakException = {};
        try {
            Object.keys(this.editStoreForm.controls).forEach(key => {
                const controlErrors: ValidationErrors = this.editStoreForm.get(key).errors;
                if (controlErrors != null) {
                    Object.keys(controlErrors).forEach(keyError => {
                        this.alert = {
                            type   : 'error',
                            message: 'Field ' + key + ' error: ' + keyError
                        }
                        this.isDisplayStatus = true;
                        throw BreakException;
                    });
                }
            });
        } catch (error) {
            return;
        }

        // Hide the alert
        this.isDisplayStatus = false;

        /**
         * 
         * Register Store Section
         * 
         */


        // this will remove the item from the object
        const { allowedSelfDeliveryStates, allowScheduledDelivery, allowStorePickup, 
            deliveryType, deliveryPartner, storeTiming, subdomain
            ,...editStoreBody } = this.editStoreForm.value;
  
        // add domain when sending to backend.. at frontend form call it subdomain
        editStoreBody["domain"] = subdomain + this.domainName;

        // this.editStoreForm.disable();
            
        this._storesService.update(this.storeId, editStoreBody)
            .subscribe((response) => {

                let storeId = response.id;
                
                //get store 

                // ---------------------------
                // Update Store Timing
                // ---------------------------

                storeTiming.forEach((item,i) => {
                    let { isOpen, isBreakTime, ...filteredItem } = item;
                    filteredItem.isOff = !isOpen;
                    
                    if (isBreakTime === false) {
                        filteredItem.breakStartTime = null;
                        filteredItem.breakEndTime = null;
                        
                        this.editStoreForm.get('storeTiming').value[i].breakStartTime = null;
                        this.editStoreForm.get('storeTiming').value[i].breakEndTime = null;

                    } else {
                        this.editStoreForm.get('storeTiming').value[i].breakStartTime = filteredItem.breakStartTime;
                        this.editStoreForm.get('storeTiming').value[i].breakEndTime = filteredItem.breakEndTime;
                    }
                    this._storesService.putTiming(storeId, item.day, filteredItem)
                    .subscribe((response)=>{
                    });
                    
                });

                // ---------------------------
                // Update Store Assets
                // ---------------------------

                let _assets = {};
                const formData = new FormData();
                this.files.forEach(item =>{
                    if (item.selectedFiles !== null){
                        formData.append(item.type,item.selectedFiles[0])
                    }

                    let storeAssetFiles = item.fileSource;

                    if (item.toDelete === true && item.type === 'logo'){
                        this._storesService.deleteAssetsLogo(this.storeId).subscribe(() => {
                            if (_assets) {
                                this._storesService.postAssets(this.storeId, formData, "logo", storeAssetFiles).subscribe(
                                  (event: any) => {
                                    if (event instanceof HttpResponse) {
                                        console.log('Uploaded the file successfully');

                                        // Mark for check
                                        this._changeDetectorRef.markForCheck();
                                    }
                                  },
                                  (err: any) => {
                                      console.error('Could not upload the file');
                                  });
                            }
                        });
                    }
                    if (item.toDelete === true && item.type === 'banner'){
                        this._storesService.deleteAssetsBanner(this.storeId).subscribe(() => {
                            if (_assets) {
                                this._storesService.postAssets(this.storeId, formData, "banner", storeAssetFiles).subscribe(
                                  (event: any) => {
                                    if (event instanceof HttpResponse) {
                                        console.log('Uploaded the file successfully');

                                        // Mark for check
                                        this._changeDetectorRef.markForCheck();
                                    }
                                  },
                                  (err: any) => {
                                      console.error('Could not upload the file');
                                  });
                            }
                        });
                    }
                });

                // ---------------------------
                // Update Store Provider
                // ---------------------------

                let _itemType;
                let _deliveryType;
                if (this.editStoreForm.get('verticalCode').value === "E-Commerce" || this.editStoreForm.get('verticalCode').value === "e-commerce-b2b2c" || this.editStoreForm.get('verticalCode').value === "ECommerce_PK") {
                    // this is actually handled by front end (but incase of hacking)
                    if (deliveryType === "SELF") { 
                        _itemType = null;
                        _deliveryType = deliveryType;
                    } else {
                        _itemType="PARCEL";
                        _deliveryType = "SCHEDULED";
                        console.warn("E-Commerce deliveryType should be SCHEDULED. Current selected deliveryType " + deliveryType) 
                    } 
                } else if (this.editStoreForm.get('verticalCode').value === "FnB" || this.editStoreForm.get('verticalCode').value === "FnB_PK") {
                    // this is actually handled by front end (but incase of hacking)
                    if (deliveryType === "SELF") { 
                        _itemType = null;
                        _deliveryType = deliveryType;
                    } else {
                        _itemType="FOOD";
                        _deliveryType = "ADHOC";
                        console.warn("E-Commerce deliveryType should be ADHOC. Current selected deliveryType " + deliveryType) 
                    } 
                } else {
                    _itemType = "ADHOC";
                    _deliveryType = "SELF";

                    console.error("Unrecogined vertical code at front-end. Need to hardcode new vertical code OR fetched available vertcal-code from backend");
                    alert("Unrecogined vertical code at front-end. Need to hardcode new vertical code OR fetched available vertcal-code from backend");
                }

                const deliveryDetailBody = {
                    allowsStorePickup: allowStorePickup,
                    itemType: _itemType,
                    maxOrderQuantityForBike: 7,
                    storeId: this.storeId,
                    type: _deliveryType // ADHOC or SCHEDULED or SELF
                };

                if (this.editStoreForm.get('deliveryType').value !== "") {
                    this._storesService.putStoreDeliveryDetails(this.storeId, deliveryDetailBody).subscribe(
                        (response) => {
    
                        }
                    );
                } else {
                    this._storesService.postStoreDeliveryDetails(this.storeId, deliveryDetailBody).subscribe(
                        (response) => {
    
                        }
                    );
                }

                if (this.editStoreForm.get('deliveryType').value === "SELF") {

                    // ---------------------------
                    // Create State Delivery Charges
                    // ---------------------------
    
                    for(let i = 0; i < allowedSelfDeliveryStates.length; i++) {
    
                        let selfDeliveryStateBody = {
                            region_country_state_id: allowedSelfDeliveryStates[i].deliveryStates,
                            delivery_charges: allowedSelfDeliveryStates[i].deliveryCharges
                        };
    
                        if (this._originalAllowedSelfDeliveryStates.findIndex(item => item.deliveryStates === allowedSelfDeliveryStates[i].deliveryStates) > -1 && allowedSelfDeliveryStates[i].id) {
                            this._storesService.putSelfDeliveryStateCharges(this.storeId, allowedSelfDeliveryStates[i].id, selfDeliveryStateBody).subscribe(
                                (response) => {
            
                                }
                            );
                        } else {
                            this._storesService.postSelfDeliveryStateCharges(this.storeId, selfDeliveryStateBody).subscribe(
                                (response) => {
                                    this._originalAllowedSelfDeliveryStates.push({
                                        id: response.id,
                                        deliveryStates: response.region_country_state_id,
                                        deliveryCharges: response.delivery_charges
                                    });
                                }
                            );
                        }
                    }

                    // ---------------------------
                    // Delete State Delivery Charges
                    // ---------------------------

                    for(let i = 0; i < this._originalAllowedSelfDeliveryStates.length; i++) {
                        if (allowedSelfDeliveryStates.findIndex(item => item.deliveryStates === this._originalAllowedSelfDeliveryStates[i].deliveryStates) > -1 && this._originalAllowedSelfDeliveryStates[i].id) {
                            // no nothing
                            console.log("Do nothing", this._originalAllowedSelfDeliveryStates[i].deliveryStates)
                        } else {
                            this._storesService.deleteSelfDeliveryStateCharges(this.storeId, this._originalAllowedSelfDeliveryStates[i].id).subscribe(
                                (response) => {
                                    this._originalAllowedSelfDeliveryStates.push({
                                        id: response.id,
                                        deliveryStates: response.region_country_state_id,
                                        deliveryCharges: response.delivery_charges
                                    });
                                }
                            );
                        }
                    }

                } 

                if (this.editStoreForm.get('deliveryType').value === "ADHOC") {

                    // ---------------------------
                    // Provision ADHOC Delivery Provider
                    // ---------------------------


                    console.log("this.editStoreForm.get('deliveryPartner').value ", this.editStoreForm.get('deliveryPartner').value)
                    console.log("this.deliveryPartners ", this.deliveryPartners)

                    this._storesService.deleteStoreRegionCountryDeliveryProviderAll(this.storeId).subscribe(() => {
                        this._storesService.postStoreRegionCountryDeliveryProvider(this.storeId, this.editStoreForm.get('deliveryPartner').value)
                            .subscribe((response) => {
                                
                            });
                    })
                }

                // Navigate to the confirmation required page
                // this._router.navigateByUrl('/stores');
            },
            (response) => {
                // Re-enable the form
                this.editStoreForm.enable();

               

                // Set the alert
                this.alert = {
                    type   : 'error',
                    message: 'Something went wrong, please try again.'
                };

                // Show the alert
                this.isDisplayStatus = true;
            });

        // Show a success message (it can also be an error message)
        // and remove it after 5 seconds
        this.alert = {
            type   : 'success',
            message: 'Store Updated'
        };
        this.isDisplayStatus = true;

        setTimeout(() => {
            this.isDisplayStatus = false;
        }, 7000);

        // Enable the form
        this.editStoreForm.enable();
    }

    updateStates(countryId: string){

        // reset current regionCountryStateId
        this.editStoreForm.get('regionCountryStateId').patchValue("");

        // Get states by country (using symplified backend)
        this._storesService.getStoreRegionCountryState(countryId).subscribe((response)=>{
            this.statesByCountry = response.data.content;
        });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    async checkExistingURL(subdomain: string){
        let url = subdomain + this.domainName;
        let status = await this._storesService.getExistingURL(url);
        if (status === 409 && this.fullDomain !== url){
            this.editStoreForm.get('subdomain').setErrors({domainAlreadyTaken: true});
        }
    }
    
    async checkExistingName(name:string){
        let status = await this._storesService.getExistingName(name);
        if (status === 409 && this.storeName !== name){
            this.editStoreForm.get('name').setErrors({storeNameAlreadyTaken: true});
        }

    }

    updateStoreOpening(day: string){
        let index = this._storeTiming.findIndex(dayList => dayList.day === day);
        this._storeTiming[index].isOpen = !this._storeTiming[index].isOpen;
        this._storeTiming[index].isOff = !this._storeTiming[index].isOff;
    }

    toggleBreakHour (e, i){
        if(e.checked === false){
            this.editStoreForm.get('storeTiming').value[i].breakStartTime = null;
            this.editStoreForm.get('storeTiming').value[i].breakEndTime = null;

            this.editStoreForm.get('storeTiming').value[i].isBreakTime = false;
        } else{
            this.editStoreForm.get('storeTiming').value[i].breakStartTime = "13:00";
            this.editStoreForm.get('storeTiming').value[i].breakEndTime = "14:00";

            this.editStoreForm.get('storeTiming').value[i].isBreakTime = true;
        }
    }

    applyToAll(index){

        let _storeTiming = {
            breakStartTime: this.editStoreForm.get('storeTiming').value[index].breakStartTime,
            breakEndTime: this.editStoreForm.get('storeTiming').value[index].breakEndTime,
            openTime: this.editStoreForm.get('storeTiming').value[index].openTime,
            closeTime: this.editStoreForm.get('storeTiming').value[index].closeTime
        }

        this.editStoreForm.get('storeTiming').value.forEach((item, i) => {
            this.editStoreForm.get('storeTiming').value[i].breakStartTime = _storeTiming.breakStartTime;
            this.editStoreForm.get('storeTiming').value[i].breakEndTime =_storeTiming.breakEndTime;
            this.editStoreForm.get('storeTiming').value[i].openTime =_storeTiming.openTime;
            this.editStoreForm.get('storeTiming').value[i].closeTime =_storeTiming.closeTime;
        })
    }


    addSelfDeliveryState(){

        let selfDeliveryStateItem = {
            deliveryStates: "",
            deliveryCharges: ""
        };

        // push to _allowedSelfDeliveryStates (normal)
        this._allowedSelfDeliveryStates.push(selfDeliveryStateItem);

        // push to allowedSelfDeliveryStates (form)
        this.allowedSelfDeliveryStates = this.editStoreForm.get('allowedSelfDeliveryStates') as FormArray;
        this.allowedSelfDeliveryStates.push(this._formBuilder.group(selfDeliveryStateItem));
    }

    removeSelfDeliveryState(index: number) {
        this._allowedSelfDeliveryStates.splice(index,1);

        // push to allowedSelfDeliveryStates (form)
        this.allowedSelfDeliveryStates = this.editStoreForm.get('allowedSelfDeliveryStates') as FormArray;
        // since backend give full discount tier list .. (not the only one that have been created only)
        this.allowedSelfDeliveryStates.clear();

        // re populate items
        this._allowedSelfDeliveryStates.forEach(item => {
            this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
        });
    }
    
    editSelfDeliveryState(attribute: string, index: number, value){
        // push to _allowedSelfDeliveryStates (normal)
        if (attribute === "deliveryStates") {
            this._allowedSelfDeliveryStates[index].deliveryStates = value;
        } else if (attribute === "deliveryCharges") {
            this._allowedSelfDeliveryStates[index].deliveryCharges = value;
        } else {
            console.error("this should not happen")
        }

        // push to allowedSelfDeliveryStates (form)
        this.allowedSelfDeliveryStates = this.editStoreForm.get('allowedSelfDeliveryStates') as FormArray;
        // since backend give full discount tier list .. (not the only one that have been created only)
        this.allowedSelfDeliveryStates.clear();

        // re populate items
        this._allowedSelfDeliveryStates.forEach(item => {
            this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
        });
    }

    checkCurrDeliveryStates(value){
        let index = this._allowedSelfDeliveryStates.findIndex(item => item.deliveryStates === value);

        return (index > -1) ? true : false; 
    }

    /**
     * 
     * @param event 
     */
    selectFiles(fileType,event: any): void {
      
        // find index of object this.files
        let index = this.files.findIndex(preview => preview.type === fileType);

        // set each of the attributes
        this.files[index].fileSource = null;
        this.files[index].selectedFileName = "";
        this.files[index].selectedFiles = event.target.files;

        if (this.files[index].selectedFiles && this.files[index].selectedFiles[0]) {
            const numberOfFiles = this.files[index].selectedFiles.length;
            for (let i = 0; i < numberOfFiles; i++) {
            const reader = new FileReader();
            
            reader.onload = (e: any) => {
                
                // set this.files[index].delete to false 
                this.files[index].toDelete = true;

                this.files[index].fileSource = e.target.result;

                var image = new Image();
                image.src = e.target.result;

                image.onload = (imageInfo: any) => {
                    this.files[index].selectedImageWidth = imageInfo.path[0].width;
                    this.files[index].selectedImageHeight = imageInfo.path[0].height;

                    this._changeDetectorRef.markForCheck();
                };

                this._changeDetectorRef.markForCheck();                
            };
            // console.log("this.files["+index+"].selectedFiles["+i+"]",this.files[index].selectedFiles[i])
            reader.readAsDataURL(this.files[index].selectedFiles[i]);
            this.files[index].selectedFileName = this.files[index].selectedFiles[i].name;
            }
        }
        this._changeDetectorRef.markForCheck();
    }

    deletefiles(index: number) { 
        this.files[index].toDelete = true;
        this.files[index].fileSource = '';

        this._changeDetectorRef.markForCheck();
    }

    checkDeliveryPartner(){
        // on every change set error to false first (reset state)
        if (this.editStoreForm.get('deliveryType').errors || this.editStoreForm.get('deliveryPartner').errors){
            this.hasDeliveryPartnerError = false; 
        }
        
        // -----------------------------------
        // reset allowedSelfDeliveryStates if user change delivery type
        // -----------------------------------
        
        if (this.editStoreForm.get('deliveryType').value === "SELF") {
            
            // push to allowedSelfDeliveryStates (form)
            this.allowedSelfDeliveryStates = this.editStoreForm.get('allowedSelfDeliveryStates') as FormArray;
            // since backend give full discount tier list .. (not the only one that have been edited only)
            this.allowedSelfDeliveryStates.clear();
            
            // re populate items
            this._allowedSelfDeliveryStates.forEach(item => {
                this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
            });
        }
        
        // then check it again and set if there's an error
        if (this.deliveryPartners.length < 1 && this.editStoreForm.get('deliveryType').value !== "SELF"){
            this.editStoreForm.get('deliveryType').setErrors({noDeliveryPartners: true})
        }
    }
    
    changeTime(i){
        if(this.editStoreForm.get('storeTiming').value[i].openTime >= this.editStoreForm.get('storeTiming').value[i].closeTime ){
            this.timeAlert[i] ="End time range incorrect" ;
        }else{
            this.timeAlert[i] = "" ;
        }   
    }

    changeBreakTime(i, type , e){
        if(this.editStoreForm.get('storeTiming').value[i].breakStartTime >= this.editStoreForm.get('storeTiming').value[i].breakEndTime ){
            this.timeAlert[i] ="Break Hour End time range incorrect" ;
        }else{
            this.timeAlert[i] = "" ;
        }   
    }
}