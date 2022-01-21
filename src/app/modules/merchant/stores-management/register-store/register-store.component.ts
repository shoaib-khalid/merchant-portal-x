import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { RegisterStoreValidationService } from 'app/modules/merchant/stores-management/register-store/register-store.validation.service';
import { Observable } from 'rxjs';
import { LocaleService } from 'app/core/locale/locale.service';
import { Locale } from 'app/core/locale/locale.types';
import { StoresService } from 'app/core/store/store.service';
import { Store, StoreRegionCountries, CreateStore, StoreAssets, StoreDeliveryProvider } from 'app/core/store/store.types';
import { ActivatedRoute, Router } from '@angular/router';
import { JwtService } from 'app/core/jwt/jwt.service';
import { debounce } from 'lodash';
import { HttpResponse } from '@angular/common/http';
import { ChooseVerticalService } from '../choose-vertical/choose-vertical.service';
import { FuseAlertType } from '@fuse/components/alert';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
    selector     : 'register-store-page',
    templateUrl  : './register-store.component.html',
    styles       : ['.ql-container { height: 156px; }'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class RegisterStoreComponent implements OnInit
{
    @ViewChild('supportNgForm') supportNgForm: NgForm;

    storeId: string;

    // display Errors
    createStoreCondition: any = {
        error: null,
        errorTitle: null,
        errorDesc: null
    };

    domainName:string;

    createStoreForm: FormGroup;
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

    // Allowed Self Delivery States
    _allowedSelfDeliveryStates: any;
    allowedSelfDeliveryStates: FormArray;

    // Store Timing
    _storeTiming: any;
    storeTiming: FormArray;

    // Image part
    
    progressInfos: any[] = [];
    message: string[] = [];
    
    files: any;
    timeAlert: any = [];
    disableForm: boolean = false;

    verticalStepperForm: FormGroup;

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
        private _route: ActivatedRoute,
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
        // Vertical stepper form
        this.createStoreForm = this._formBuilder.group({
            step1: this._formBuilder.group({
                name                : ['', Validators.required],
                subdomain           : ['',[Validators.required, Validators.minLength(4), Validators.maxLength(15), RegisterStoreValidationService.domainValidator]],
                address             : ['', Validators.required],
                storeDescription    : ['', [Validators.required, Validators.maxLength(100)]],
                city                : ['', Validators.required],
                regionCountryStateId: ['', Validators.required],
                email               : ['', [Validators.required, Validators.email]],
                phoneNumber         : ['', RegisterStoreValidationService.phonenumberValidator],
                postcode            : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), RegisterStoreValidationService.postcodeValidator]],
                regionCountryId     : ['', Validators.required],
                paymentType         : ['', Validators.required],
            }),
            step3: this._formBuilder.group({
                // Delivery Provider
                deliveryType             : ['', Validators.required],
                // Delivery Partner
                deliveryPartner          : ['', Validators.required],
                // Allowed Self Delivery States
                allowedSelfDeliveryStates: this._formBuilder.array([]),
                // Else
                allowScheduledDelivery   : [false],
                allowStorePickup         : [false],

                pushNotifications: ['everything', Validators.required]
            }),
            step4: this._formBuilder.group({
                // Store Timing
                storeTiming: this._formBuilder.array([]),
                isSnooze   : [false],
            }),
            clientId                : [''],
            serviceChargesPercentage: [0],
            verticalCode            : [''],
            isBranch                : [false],
        });
        // Create the support form
        // this.createStoreForm = this._formBuilder.group({
        //     // Main Store Section
        //     // name               : ['', Validators.required],
        //     // city               : ['', Validators.required],
        //     // address            : ['', Validators.required],
        //     // postcode           : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), RegisterStoreValidationService.postcodeValidator]],
        //     // storeDescription   : ['', [Validators.required, Validators.maxLength(100)]],
        //     // email              : ['', [Validators.required, Validators.email]],
        //     // clientId           : [''],
        //     // subdomain             : ['',[Validators.required, Validators.minLength(4), Validators.maxLength(15), RegisterStoreValidationService.domainValidator]],
        //     // regionCountryId: ['', Validators.required],
        //     // regionCountryStateId: ['', Validators.required],
        //     // phoneNumber        : ['', RegisterStoreValidationService.phonenumberValidator],
        //     // serviceChargesPercentage: [0],
        //     // verticalCode: [''],
        //     // paymentType        : ['', Validators.required],
            
        //     // Store Timing
        //     // storeTiming: this._formBuilder.array([]),

        //     // Allowed Self Delivery States
        //     // allowedSelfDeliveryStates: this._formBuilder.array([]),

        //     // Delivery Provider
        //     // deliveryType       : ['', Validators.required],

        //     // Delivery Partner
        //     // deliveryPartner      : ['', Validators.required],
            
        //     // Else
        //     // allowScheduledDelivery : [false],
        //     // allowStorePickup : [false],
        //     // isBranch: [false],
        //     // isSnooze: [false],
        // });

        // Reason why we put everyting under get vertical code by paramMap is because
        // we need the verticalCode before we need to query getStoreDeliveryProvider which require verticalCode

        // -------------------------
        // Get vertical code by paramMap
        // -------------------------

        this._route.paramMap.subscribe( paramMap => {

            let _verticalCode = paramMap.get('vertical-code');
            this.createStoreForm.get('verticalCode').patchValue(_verticalCode);

            // -------------------------
            // Choose Vertical service
            // -------------------------      
            this._chooseVerticalService.getVerticalById(_verticalCode)
                .subscribe((response) => {
                    this.domainName = "." + response.domain;
                });

            // -------------------------
            // Locale service
            // -------------------------
    
            // get locale info from (locale service)
            // this is to get the current location by using 3rd party api service
            this._localeService.locale$.subscribe((response: Locale)=>{
                
                let symplifiedCountryId = response.symplifiedCountryId;

                // check if vertical selected is valid for selected country
                if ((_verticalCode === "ECommerce_PK" || _verticalCode === "FnB_PK") && symplifiedCountryId === "PAK") {
                    this.createStoreCondition.error = null;
                } else if ((_verticalCode === 'E-Commerce' || _verticalCode === 'e-commerce-b2b2c' || _verticalCode === 'FnB') && symplifiedCountryId === "MYS") {
                    this.createStoreCondition.error = null;
                } else {
                    this.createStoreCondition.error = "VERTICAL-ERROR";
                    this.createStoreCondition.errorTitle = "Vertical Error";
                    this.createStoreCondition.errorDesc = "This vertical is not available at your country, please choose another vertical";
                    let message = symplifiedCountryId ? "Vertical code: " + _verticalCode + " is not available for " + symplifiedCountryId + " country" : "Missing region country id";
                    console.error(message)
                }
                
                // state (using component variable)
                // INITIALLY (refer below section updateStates(); for changes), get states from symplified backed by using the 3rd party api
                
                // -------------------------
                // States By Country
                // -------------------------
    
                // Get states by country (using symplified backend)
                this._storesService.getStoreRegionCountryState(symplifiedCountryId).subscribe((response)=>{
                    this.statesByCountry = response.data.content;
                });
    
                // country (using form builder variable)
                this.createStoreForm.get('step1').get('regionCountryId').patchValue(symplifiedCountryId.toUpperCase());
        
                // -------------------------------------
                // Delivery Partner
                // -------------------------------------
    
                let _regionCountryId = symplifiedCountryId.toUpperCase();
                let _deliveryType;

                if (_verticalCode === "FnB" || _verticalCode === "FnB_PK") {
                    _deliveryType = "ADHOC";
                } else if (_verticalCode === 'E-Commerce' || _verticalCode === 'e-commerce-b2b2c' || _verticalCode === 'ECommerce_PK') {
                    _deliveryType = "SCHEDULED";
                } else {
                    console.error("Invalid vertical code: ", _verticalCode)
                }

                this._storesService.getStoreDeliveryProvider({deliveryType: _deliveryType, regionCountryId: _regionCountryId}).subscribe(
                    (response: StoreDeliveryProvider[]) => {
                        // reset this.deliveryPartners first to initial state
                        this.deliveryPartners = [];
                        // push the data into array
                        response.forEach(item => {
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
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        });

        // check total of stores this account have
        this._storesService.stores$.subscribe((response)=>{
            if (response.length && response.length > 4) {
                this.createStoreCondition.error = "MAX-STORES";
                this.createStoreCondition.errorTitle = "Maximum store creation has been reached";
                this.createStoreCondition.errorDesc = "You have reached the maximum allowed store creation";
            }
        })
        
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

        // -------------------------
        // store timing
        // -------------------------

        this._storeTiming = [
            { day: "Monday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true, isBreakTime: true },
            { day: "Tuesday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true, isBreakTime: true },
            { day: "Wednesday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true, isBreakTime: true },
            { day: "Thursday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true, isBreakTime: true },
            { day: "Friday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true, isBreakTime: true },
            { day: "Saturday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: true, isOpen: false, isBreakTime: true },
            { day: "Sunday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: true, isOpen: false, isBreakTime: true },
        ];

        this._storeTiming.forEach(item => {
            this.storeTiming = this.createStoreForm.get('step4').get('storeTiming') as FormArray;
            this.storeTiming.push(this._formBuilder.group(item));
        });        
        
        // -------------------------------------
        // store allowed self delivery states
        // -------------------------------------

        this._allowedSelfDeliveryStates = [
            { deliveryStates: "", deliveryCharges:"" }
        ];
        
        this._allowedSelfDeliveryStates.forEach(item => {
            this.allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates') as FormArray;
            this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
        });
        
        // -------------------------------------
        // delivery fulfillment
        // -------------------------------------

        this.deliveryFullfilment = [
            { selected: false, option: "INSTANT_DELIVERY", label: "Instant Delivery", tooltip: "This store support instant delivery. (Provided by store own logistic or delivery partners)" }, 
            { selected: false, option: "REGULAR_DELIVERY", label: "Regular Delivery", tooltip: "This store support regular delivery. (Provided by store own logistic or delivery partners)" },
            { selected: false, option: "SCHEDULED_DELIVERY", label: "Scheduled Delivery", tooltip: "This store allow scheduled delivery request from customer" },
            { selected: false, option: "STORE_PICKUP", label: "Allow Store Pickup", tooltip: "This store allow customer to pick up item from store" }
        ];

        // -------------------------------------
        // Logo and banner
        // -------------------------------------

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

        // Get allowed store countries 
        // this only to get list of country in symplified backend
        this._storesService.storeRegionCountries$.subscribe((response: StoreRegionCountries[])=>{
            response.forEach((country: StoreRegionCountries) => {
                this.countriesList.push(country);
            });
        });

        // set required value that does not appear in register-store.component.html
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
        this.createStoreForm.get('clientId').patchValue(clientId);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Clear the form
     */
    // clearForm(): void
    // {
    //     // Reset the form
    //     this.supportNgForm.resetForm();
    // }

    /**
     * Send the form
     */
    sendForm(): void
    {     
        
        // Do nothing if the form is invalid
        // let BreakException = {};
        // try {
        //     Object.keys(this.createStoreForm.controls).forEach(key => {
        //         const controlErrors: ValidationErrors = this.createStoreForm.get(key).errors;
        //         if (controlErrors != null) {
        //             Object.keys(controlErrors).forEach(keyError => {
        //                 this.alert = {
        //                     type   : 'error',
        //                     message: 'Field ' + key + ' error: ' + keyError
        //                 }
        //                 this.isDisplayStatus = true;
        //                 throw BreakException;
        //             });
        //         }
        //     });
        // } catch (error) {
        //     return;
        // }
    
        // if (this.isDisplayStatus === true){
        //   return;
        // }

        // Hide the alert
        this.isDisplayStatus = false;

        // this will remove the item from the object
        // const { allowedSelfDeliveryStates, allowScheduledDelivery, allowStorePickup, 
        //         deliveryType, deliveryPartner, storeTiming, subdomain
        //         ,...createStoreBody}  = this.createStoreForm.value;


        const { subdomain ,...createStoreBody} = this.createStoreForm.get('step1').value; 
        const storeTimingBody = this.createStoreForm.get('step4').get('storeTiming').value;
        const deliveryType = this.createStoreForm.get('step3').get('deliveryType').value;
        const allowStorePickup = this.createStoreForm.get('step3').get('allowStorePickup').value;
        const allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates').value;
        const deliveryPartner = this.createStoreForm.get('step3').get('deliveryPartner').value;        

        // add domain when sending to backend.. at frontend form call it subdomain
        createStoreBody["domain"] =  this.createStoreForm.get('step1').get('subdomain').value + this.domainName;
        createStoreBody["clientId"] = this.createStoreForm.get('clientId').value;
        createStoreBody["isBranch"] = this.createStoreForm.get('isBranch').value;
        createStoreBody["isSnooze"] = this.createStoreForm.get('step4').get('isSnooze').value;
        createStoreBody["serviceChargesPercentage"] = this.createStoreForm.get('serviceChargesPercentage').value;
        createStoreBody["verticalCode"] = this.createStoreForm.get('verticalCode').value;
            
        // Disable the form
        this.createStoreForm.disable();


        // ---------------------------
        // Register Store Section
        // ---------------------------

        this._storesService.post(createStoreBody)
            .subscribe((response) => {

                this.storeId = response.data.id;
                                  

                // ---------------------------
                // Create Store Timing
                // ---------------------------                
                
                storeTimingBody.forEach(item => {
                    let { isOpen, isBreakTime,  ...filteredItem } = item;
                    this._storesService.postTiming(this.storeId, filteredItem)
                        .subscribe((response)=>{});
                });

                // manual set store timing to new created store at service
                this._storesService.setTimingToStore(this.storeId, this._storeTiming).subscribe(()=>{
        
                });

                // ---------------------------
                // Create Store Assets
                // ---------------------------

                this.files.forEach(item =>{
                    
                    let formData = new FormData();
                    if (item.selectedFiles !== null){
                        formData.append(item.type,item.selectedFiles[0])
                    }

                    let storeAssetFiles = item.fileSource;

                    if (item.toDelete === true && item.type === 'logo'){
                        this._storesService.deleteAssetsLogo(this.storeId).subscribe(() => {
                            // console.log("storeAssetFiles: ", "'"+storeAssetFiles+"'")
                            if (storeAssetFiles && storeAssetFiles !== "") {
                                this._storesService.postAssets(this.storeId, formData, "logo", storeAssetFiles).subscribe(
                                    (event: any) => {
                                    if (event instanceof HttpResponse) {
                                        console.log('Uploaded the file successfully');
        
                                        // Mark for check
                                        this._changeDetectorRef.markForCheck();
                                    }
                                    },
                                    (err: any) => {
                                        console.error('Could not upload the logo file');
                                    });
                            }
                        });
                    }
                    if (item.toDelete === true && item.type === 'banner'){  
                        this._storesService.deleteAssetsBanner(this.storeId).subscribe(() => {
                            // console.log("storeAssetFiles 1: ", "'"+storeAssetFiles+"'")
                            if (storeAssetFiles && storeAssetFiles !== ""){
                                this._storesService.postAssets(this.storeId, formData, "banner", storeAssetFiles).subscribe(
                                    (event: any) => {
                                    if (event instanceof HttpResponse) {
                                        console.log('Uploaded the file successfully');
        
                                        // Mark for check
                                        this._changeDetectorRef.markForCheck();
                                    }
                                },
                                (err: any) => {
                                        console.error('Could not upload the banner file');
                                    });
                            }
                        });
                    }
                    if (item.toDelete === true && item.type === 'bannerMobile'){
                        this._storesService.deleteAssetsBannerMobile(this.storeId).subscribe(() => {
                            // console.log("storeAssetFiles 2: ", "'"+storeAssetFiles+"'")
                            if (storeAssetFiles && storeAssetFiles !== ""){
                                this._storesService.postAssets(this.storeId, formData, "bannerMobile", storeAssetFiles).subscribe(
                                    (event: any) => {
                                    if (event instanceof HttpResponse) {
                                        console.log('Uploaded the file successfully');
        
                                        // Mark for check
                                        this._changeDetectorRef.markForCheck();
                                    }
                                    },
                                    (err: any) => {
                                        console.error('Could not upload the bannerMobile file');
                                    });
                            }
                        });
                    }
                });

                // ---------------------------
                // Create Store Provider
                // ---------------------------

                let _itemType;
                let _deliveryType;
                if (this.createStoreForm.get('verticalCode').value === "E-Commerce" || this.createStoreForm.get('verticalCode').value === "e-commerce-b2b2c" || this.createStoreForm.get('verticalCode').value === "ECommerce_PK") {
                    // this is actually handled by front end (but incase of hacking)
                    if (deliveryType === "SELF") { 
                        _itemType = null;
                        _deliveryType = deliveryType;
                    } else {
                        _itemType="PARCEL";
                        _deliveryType = "SCHEDULED";
                        console.warn("E-Commerce deliveryType should be SCHEDULED. Current selected deliveryType " + deliveryType) 
                    } 
                } else if (this.createStoreForm.get('verticalCode').value === "FnB" || this.createStoreForm.get('verticalCode').value === "FnB_PK") {
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
                    _itemType = null;
                    _deliveryType = "SELF";
                }

                const deliveryDetailBody = {
                    allowsStorePickup: allowStorePickup,
                    itemType: _itemType,
                    maxOrderQuantityForBike: 7,
                    storeId: this.storeId,
                    type: _deliveryType // ADHOC or SCHEDULED or SELF
                };

                this._storesService.postStoreDeliveryDetails(this.storeId, deliveryDetailBody).subscribe(
                    (response) => {

                    }
                );

                if (deliveryType === "SELF") {

                    // ---------------------------
                    // Create State Delivery Charges
                    // ---------------------------
    
                    for(let i = 0; i < allowedSelfDeliveryStates.length; i++) {
    
                        let selfDeliveryStateBody = {
                            region_country_state_id: allowedSelfDeliveryStates[i].deliveryStates,
                            delivery_charges: allowedSelfDeliveryStates[i].deliveryCharges
                        };
    
                        this._storesService.postSelfDeliveryStateCharges(this.storeId, selfDeliveryStateBody).subscribe(
                            (response) => {
        
                            }
                        );
                    }
                } 

                if (deliveryType === "ADHOC") {

                    // ---------------------------
                    // Provision ADHOC Delivery Provider
                    // ---------------------------

                    this._storesService.postStoreRegionCountryDeliveryProvider(this.storeId, deliveryPartner)
                        .subscribe((response) => {
                            
                        });
                }

            },
        );

        // Show a success message (it can also be an error message)
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Store Created',
            message: 'Your have successfully create store',
            icon: {
                show: true,
                name: "heroicons_outline:clipboard-check",
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
            this.isDisplayStatus = false;

            // Navigate to the confirmation required page
            this._router.navigateByUrl('/stores');
        }, 1000);
    }

    updateStates(countryId: string){

        // reset current regionCountryStateId
        this.createStoreForm.get('step1').get('regionCountryStateId').patchValue("");

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
        if (status === 409){
            this.createStoreForm.get('step1').get('subdomain').setErrors({domainAlreadyTaken: true});
        }
    }
    
    async checkExistingName(name:string){
        let status = await this._storesService.getExistingName(name);
        if (status ===409){
            this.createStoreForm.get('step1').get('name').setErrors({storeNameAlreadyTaken: true});
        }

    }

    updateStoreOpening(day: string){
        let index = this._storeTiming.findIndex(dayList => dayList.day === day);
        this._storeTiming[index].isOpen = !this._storeTiming[index].isOpen;
        this._storeTiming[index].isOff = !this._storeTiming[index].isOff;

        this.storeTiming.clear();
        this._storeTiming.forEach(item => {
            this.storeTiming = this.createStoreForm.get('step4').get('storeTiming') as FormArray;
            this.storeTiming.push(this._formBuilder.group(item));
        }); 
    }

    toggleBreakHour (e, i){
        if(e.checked === false){
            this.createStoreForm.get('step4').get('storeTiming').value[i].breakStartTime = null;
            this.createStoreForm.get('step4').get('storeTiming').value[i].breakEndTime = null;

            this.createStoreForm.get('step4').get('storeTiming').value[i].isBreakTime = false;
        } else{
            this.createStoreForm.get('step4').get('storeTiming').value[i].breakStartTime = "13:00";
            this.createStoreForm.get('step4').get('storeTiming').value[i].breakEndTime = "14:00";

            this.createStoreForm.get('step4').get('storeTiming').value[i].isBreakTime = true;
        }
    }

    applyToAll(index){

        let _storeTiming = {
            breakStartTime: this.createStoreForm.get('step4').get('storeTiming').value[index].breakStartTime,
            breakEndTime: this.createStoreForm.get('step4').get('storeTiming').value[index].breakEndTime,
            openTime: this.createStoreForm.get('step4').get('storeTiming').value[index].openTime,
            closeTime: this.createStoreForm.get('step4').get('storeTiming').value[index].closeTime
        }

        this.createStoreForm.get('step4').get('storeTiming').value.forEach((item, i) => {
            this.createStoreForm.get('step4').get('storeTiming').value[i].breakStartTime = _storeTiming.breakStartTime;
            this.createStoreForm.get('step4').get('storeTiming').value[i].breakEndTime =_storeTiming.breakEndTime;
            this.createStoreForm.get('step4').get('storeTiming').value[i].openTime =_storeTiming.openTime;
            this.createStoreForm.get('step4').get('storeTiming').value[i].closeTime =_storeTiming.closeTime;
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
        this.allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates') as FormArray;
        this.allowedSelfDeliveryStates.push(this._formBuilder.group(selfDeliveryStateItem));
    }

    removeSelfDeliveryState(index: number) {
        this._allowedSelfDeliveryStates.splice(index,1);

        // push to allowedSelfDeliveryStates (form)
        this.allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates') as FormArray;
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
        this.allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates') as FormArray;
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
     * tahu la
     * @param event 
     */

    selectFiles(fileType,event: any): void {

    // find index of object this.files
    let index = this.files.findIndex(preview => preview.type === fileType);

    // set each of the attributes
    this.files[index].fileSource = null;
    this.files[index].selectedFileName = "";
    this.files[index].selectedFiles = event.target.files;    
        
        let maxSize = 2600000;
        if (this.files[index].selectedFiles[0].size > maxSize ){
            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Image size limit',
                message: 'Your uploaded image is exceeds the maximum size of ' + maxSize + ' bytes ! Please choose image with size below of ' + maxSize + ' bytes',
                icon: {
                    show: true,
                    name: "heroicons_outline:exclamation",
                    color: "warn"
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
            return;
        }

        if (this.files[index].selectedFiles && this.files[index].selectedFiles[0] && this.files[index].selectedFiles[0].size < maxSize ) {
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
        if (this.createStoreForm.get('step3').get('deliveryType').errors || this.createStoreForm.get('step3').get('deliveryPartner').errors){
            this.createStoreForm.get('step3').get('deliveryPartner').setErrors(null);
        }

        // -----------------------------------
        // reset allowedSelfDeliveryStates if user change delivery type
        // -----------------------------------

        if (this.createStoreForm.get('step3').get('deliveryType').value === "SELF") {

            // push to allowedSelfDeliveryStates (form)
            this.allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates') as FormArray;
            // since backend give full discount tier list .. (not the only one that have been created only)
            this.allowedSelfDeliveryStates.clear();
            
            // re populate items
            this._allowedSelfDeliveryStates.forEach(item => {
                this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
            });
        }

        // then check it again and set if there's an error
        if (this.deliveryPartners.length < 1 && this.createStoreForm.get('step3').get('deliveryType').value !== "SELF"){
            this.createStoreForm.get('step3').get('deliveryType').setErrors({noDeliveryPartners: true})
        }
    }

    changeTime(i, type , e){
        // console.log("i : type : e =", i + " : " + type + " : " + e.target.value);
        // console.log("tegok object: ", this.createStoreForm.get('storeTiming').value[i])
        // console.log("tengok event: ", e.target.value)
        // console.log("hari",this.createStoreForm.get('storeTiming').value[i].day)
        if(this.createStoreForm.get('step4').get('storeTiming').value[i].openTime >= this.createStoreForm.get('step4').get('storeTiming').value[i].closeTime ){
            this.timeAlert[i] ="End time range incorrect" ;
        }else{
            this.timeAlert[i] = "" ;
        }   
    }

    changeBreakTime(i, type , e){
        if(this.createStoreForm.get('step4').get('storeTiming').value[i].breakStartTime >= this.createStoreForm.get('step4').get('storeTiming').value[i].breakEndTime ){
            this.timeAlert[i] ="Break Hour End time range incorrect" ;
        }else{
            this.timeAlert[i] = "" ;
        }   
    }
}