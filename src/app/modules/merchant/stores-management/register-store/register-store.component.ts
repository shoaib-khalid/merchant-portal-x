import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { RegisterStoreValidationService } from 'app/modules/merchant/stores-management/register-store/register-store.validation.service';
import { Observable, Subject } from 'rxjs';
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
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { NgxGalleryOptions, NgxGalleryImage, NgxGalleryAnimation } from 'ngx-gallery-9';
import { UserService } from 'app/core/user/user.service';
import { Client } from 'app/core/user/user.types';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { takeUntil } from 'rxjs/operators';

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

    galleryOptionsBannerDesktop: NgxGalleryOptions[] = [];
    galleryOptionsBannerMobile: NgxGalleryOptions[] = [];

    verticalStepperForm: FormGroup;

    // display error
    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };
    isDisplayStatus: boolean = false;

    currentScreenSize: string[] = [];

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    
    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _storesService: StoresService,
        private _jwt: JwtService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _localeService: LocaleService,
        private _userService: UserService,
        private _chooseVerticalService: ChooseVerticalService,
        private _router: Router,
        private _route: ActivatedRoute,
        private _fuseConfirmationService: FuseConfirmationService,
        private _domSanitizer: DomSanitizer,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
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
            // User service
            // -------------------------

            // get client info from (user service)
            // this is to get the current location by using 3rd party api service

            this._userService.client$.subscribe((response: Client)=> {
                let symplifiedCountryId = response['data'].regionCountry.id;

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
                    
            //----------------
            //  Start Time
            //----------------
            let _itemOpenTimeHour = item.openTime.split(":")[0];
            if (item.openTime.split(":")[0] > 12) {
                _itemOpenTimeHour = _itemOpenTimeHour - 12;
                _itemOpenTimeHour = ((_itemOpenTimeHour < 10) ? '0' : '') + _itemOpenTimeHour;    
            }                    

            let _itemOpenTimeMinute = item.openTime.split(":")[1];

            let _itemOpenTimeAMPM : 'AM' | 'PM';
            if (item.openTime.split(":")[0] > 12) {
                _itemOpenTimeAMPM = "PM";
            } else {
                _itemOpenTimeAMPM = "AM";
            }

            let _item = item;
            _item["openTime"] = new TimeSelector(_itemOpenTimeHour,_itemOpenTimeMinute, _itemOpenTimeAMPM);

            //----------------
            //    End Time
            //----------------
            let _itemCloseTimeHour = item.closeTime.split(":")[0];
            if (item.closeTime.split(":")[0] > 12) {
                _itemCloseTimeHour = _itemCloseTimeHour - 12;
                _itemCloseTimeHour = ((_itemCloseTimeHour < 10) ? '0' : '') + _itemCloseTimeHour;    
            }

            let _itemCloseTimeMinute = item.closeTime.split(":")[1];

            let _itemCloseTimeAMPM : 'AM' | 'PM';
            if (item.closeTime.split(":")[0] > 12) {
                _itemCloseTimeAMPM = "PM";
            } else {
                _itemCloseTimeAMPM = "AM";
            }

            _item["closeTime"] = new TimeSelector(_itemCloseTimeHour,_itemCloseTimeMinute, _itemCloseTimeAMPM);

            //----------------
            //Break Start Time
            //----------------                    
            let _itemBreakOpenTimeHour = (item.breakStartTime && item.breakStartTime !== null) ? item.breakStartTime.split(":")[0] : "--";
            if (item.breakStartTime && item.breakStartTime !== null && item.breakStartTime.split(":")[0] > 12) {
                _itemBreakOpenTimeHour = _itemBreakOpenTimeHour - 12;
                _itemBreakOpenTimeHour = ((_itemBreakOpenTimeHour < 10) ? '0' : '') + _itemBreakOpenTimeHour;    
            }

            let _itemBreakOpenTimeMinute = (item.breakStartTime && item.breakStartTime !== null) ? item.breakStartTime.split(":")[1] : "--";

            let _itemBreakOpenTimeAMPM : 'AM' | 'PM' | '--';
            if (item.breakStartTime && item.breakStartTime !== null && item.breakStartTime.split(":")[0] > 12) {
                _itemBreakOpenTimeAMPM = (item.breakStartTime && item.breakStartTime !== null) ? "PM" : "--";
            } else {
                _itemBreakOpenTimeAMPM = (item.breakStartTime && item.breakStartTime !== null) ? "AM": "--";
            }
            
            _item["breakStartTime"] = new TimeSelector(_itemBreakOpenTimeHour,_itemBreakOpenTimeMinute, _itemBreakOpenTimeAMPM);

            //--------------
            //Break End Time
            //--------------
            let _itemBreakCloseTimeHour = (item.breakEndTime && item.breakEndTime !== null) ? item.breakEndTime.split(":")[0] : "--";
            if (item.breakEndTime && item.breakEndTime !== null && item.breakEndTime.split(":")[0] > 12) {
                _itemBreakCloseTimeHour = _itemBreakCloseTimeHour - 12;
                _itemBreakCloseTimeHour = ((_itemBreakCloseTimeHour < 10) ? '0' : '') + _itemBreakCloseTimeHour;  
            }

            let _itemBreakeCloseTimeMinute = (item.breakEndTime && item.breakEndTime !== null) ? item.breakEndTime.split(":")[1] : "--";

            let _itemBreakCloseTimeAMPM : 'AM' | 'PM' | '--';
            
            if (item.breakEndTime && item.breakEndTime !== null && item.breakEndTime.split(":")[0] > 12) {
                _itemBreakCloseTimeAMPM = (item.breakEndTime && item.breakEndTime !== null) ? "PM" : "--";
            } else {
                _itemBreakCloseTimeAMPM = (item.breakEndTime && item.breakEndTime !== null) ? "AM" : "--";
            }

            _item["breakEndTime"] = new TimeSelector(_itemBreakCloseTimeHour,_itemBreakeCloseTimeMinute, _itemBreakCloseTimeAMPM);                    

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
                description: "Logo",
                type: "LogoUrl",
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "500", 
                recommendedImageHeight: "500", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: [],
                toAdd:[],
                isMultiple: false,
                galleryImages: []
            },
            { 
                description: "BannerDesktop",
                type: "BannerDesktopUrl", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "1110", 
                recommendedImageHeight: "250", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: [],
                toAdd:[],
                isMultiple: true,
                galleryImages: []
            },
            { 
                description: "BannerMobile",
                type: "BannerMobileUrl",
                fileSource: null, 
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "950", 
                recommendedImageHeight: "260", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: [],
                toAdd:[],
                isMultiple: true,
                galleryImages: []
            },
            { 
                description: "Favicon",
                type: "FaviconUrl",
                fileSource: null, 
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "950", 
                recommendedImageHeight: "260", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: [],
                toAdd:[],
                isMultiple: false,
                galleryImages: []
            },
        ];
        
        // initialise gallery
        // set galleryOptions
        this.galleryOptionsBannerDesktop = [
            {
                width: '290px',
                height: '290px',
                thumbnailsColumns: 3,
                imageAnimation: NgxGalleryAnimation.Slide,
                thumbnailsArrows: true,
                // previewDownload: true,
                imageArrowsAutoHide: true, 
                thumbnailsArrowsAutoHide: true,
                thumbnailsAutoHide: false,
                thumbnailActions: [
                    {
                        icon: 'fa fa-times-circle',
                        onClick: (event, index) => {
                            
                            this.deleteBannerDesktop(event, index)
                        },
                    }
                ],
                // "imageSize": "contain",
                "previewCloseOnClick": true, 
                "previewCloseOnEsc": true,
                // "thumbnailsRemainingCount": true
            },
            // max-width 767 Mobile configuration
            {
                breakpoint: 767,
                thumbnailsColumns: 2,
                thumbnailsAutoHide: false,
                width: '290px',
                height: '290px',
                imagePercent: 100,
                thumbnailsPercent: 30,
                thumbnailsMargin: 10,
                thumbnailMargin: 5,
                thumbnailActions: [
                    {
                        icon: 'fa fa-times-circle',
                        onClick: () => {},
                    }
                ]
            }
        ];

        this.galleryOptionsBannerMobile = [
            {
                width: '290px',
                height: '290px',
                thumbnailsColumns: 3,
                imageAnimation: NgxGalleryAnimation.Slide,
                thumbnailsArrows: true,
                // previewDownload: true,
                imageArrowsAutoHide: true, 
                thumbnailsArrowsAutoHide: true,
                thumbnailsAutoHide: false,
                thumbnailActions: [
                    {
                        icon: 'fa fa-times-circle',
                        onClick: (event, index) => {
                            
                            this.deleteBannerMobile(event, index)
                        },
                    }
                ],
                // "imageSize": "contain",
                "previewCloseOnClick": true, 
                "previewCloseOnEsc": true,
                // "thumbnailsRemainingCount": true
            },
            // max-width 767 Mobile configuration
            {
                breakpoint: 767,
                thumbnailsColumns: 3,
                thumbnailsAutoHide: true,
                width: '290px',
                height: '290px',
                imagePercent: 100,
                thumbnailsPercent: 30,
                thumbnailsMargin: 10,
                thumbnailMargin: 5,
                thumbnailActions: [
                    {
                        icon: 'fa fa-times-circle',
                        onClick: () => {},
                    }
                ]
            }
        ];

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {               

                this.currentScreenSize = matchingAliases;                

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

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
     * Send the form
     */
    sendForm(): void
    {   
        // Hide the alert
        this.isDisplayStatus = false;

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

        // -------------------------------------
        //        Register Store Section
        // -------------------------------------

        this._storesService.post(createStoreBody)
            .subscribe((response) => {

                this.storeId = response.data.id;
                                  
                // ---------------------------
                //    Create Store Timing
                // ---------------------------                
                
                storeTimingBody.forEach(item => {
                    let { isOpen, isBreakTime,  ...filteredItem } = item;

                // Start Time if PM read 24hrs format
                let startTime = filteredItem.openTime;
                let _startTime;
        
                if (startTime.timeAmPm === "PM") {
                    _startTime = parseInt(startTime.timeHour) + 12;
                } else {
                    _startTime = startTime.timeHour;
                }

                // End Time if PM read 24hrs format
                let endTime = filteredItem.closeTime;
                let _endTime;

                if (endTime.timeAmPm === "PM") {
                    _endTime = parseInt(endTime.timeHour) + 12;
                } else {
                    _endTime = endTime.timeHour;
                }

                // Break Start Time if PM read 24hrs format
                let breakStartTime = filteredItem.breakStartTime;
                let _breakStartTime;
        
                if (breakStartTime.timeAmPm !== null && breakStartTime.timeAmPm === "PM") {
                    _breakStartTime = parseInt(breakStartTime.timeHour) + 12;
                } else {
                    _breakStartTime = breakStartTime.timeHour;
                }

                // Break End Time if PM read 24hrs format
                let breakEndTime = filteredItem.breakEndTime;
                let _breakendTime;
        
                if (breakEndTime.timeAmPm !== null && breakEndTime.timeAmPm === "PM") {
                    _breakendTime = parseInt(breakEndTime.timeHour) + 12;
                } else {
                    _breakendTime = breakEndTime.timeHour;
                }
                
                const _filteredItem = { 
                    breakEndTime: _breakendTime + ":" + filteredItem.breakEndTime.timeMinute,
                    breakStartTime: _breakStartTime + ":" + filteredItem.breakStartTime.timeMinute,
                    closeTime: _endTime + ":" + filteredItem.closeTime.timeMinute,
                    day: filteredItem.day,
                    isOff: filteredItem.isOff,
                    openTime: _startTime + ":" + filteredItem.openTime.timeMinute,
                    storeId: filteredItem.storeId
                }
                _filteredItem.isOff = !isOpen;
                
                if (isBreakTime === false) {
                    _filteredItem.breakStartTime = null;
                    _filteredItem.breakEndTime = null;
                    filteredItem.breakStartTime.timeAmPm = null;
                    filteredItem.breakEndTime.timeAmPm = null;
                    
                    this.createStoreForm.get('step4').get('storeTiming').value.breakStartTime = null;
                    this.createStoreForm.get('step4').get('storeTiming').value.breakEndTime = null;
                    
                } else {
                    this.createStoreForm.get('step4').get('storeTiming').value.breakStartTime = _filteredItem.breakStartTime;
                    this.createStoreForm.get('step4').get('storeTiming').value.breakEndTime = _filteredItem.breakEndTime;
                }

                this._storesService.postTiming(this.storeId, _filteredItem)
                    .subscribe((response)=>{});
                });

                // manual set store timing to new created store at service
                this._storesService.setTimingToStore(this.storeId, this._storeTiming).subscribe(()=>{
        
                });

                // ---------------------------
                //    Create Store Assets
                // ---------------------------

                this.files.forEach(item =>{
                    
                    //Logo update using item.selected files
                    if (item.type === 'LogoUrl' && item.selectedFiles){

                        let formData = new FormData();
                        formData.append('assetFile', item.selectedFiles[0]);
                        formData.append('assetType',item.type);
                        formData.append('assetDescription',item.description);

                        this._storesService.postAssets(this.storeId, "LogoUrl", formData,"Logo").subscribe(
                            (event: any) => {
                            if (event instanceof HttpResponse) {
                                console.info('Uploaded the file successfully');

                                this.files[3].assetId = event["id"];

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }

                    // Favicon update using item.selectedFiles
                    if (item.type === 'FaviconUrl' && item.selectedFiles){
                        
                        let formData = new FormData();
                        formData.append('assetFile',item.selectedFiles[0]);
                        formData.append('assetType',item.type);
                        formData.append('assetDescription',item.description);

                        this._storesService.postAssets(this.storeId, "FaviconUrl", formData,"Favicon").subscribe(
                            (event: any) => {
                            if (event instanceof HttpResponse) {
                                console.info('Uploaded the file successfully');


                                this.files[3].assetId = event["id"];

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }
                    if(item.type === 'BannerDesktopUrl') {
                        // toDelete
                        item.toDelete.forEach(assetId => {
                            this._storesService.deleteAssets(this.storeId, assetId).subscribe(
                                (event: any) => {
                                if (event instanceof HttpResponse) {
                                    console.info('Uploaded the file successfully');
            
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                }
                                },
                                (err: any) => {
                                    console.error('Could not upload the file');
                            });
                        });
                        // toAdd
                        item.toAdd.forEach(selectedFiles => {
        
                            let formData = new FormData();
                            formData.append('assetFile',selectedFiles[0]);
                            formData.append('assetType',item.type);
                            formData.append('assetDescription',item.description);
        
                            this._storesService.postAssets(this.storeId, "BannerDesktopUrl", formData,"BannerDesktop").subscribe(
                                (event: any) => {
                                if (event instanceof HttpResponse) {
                                    console.info('Uploaded the file successfully');
            
                                    this.files[1].assetId = event["id"];
            
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                }
                                },
                                (err: any) => {
                                    console.error('Could not upload the file');
                                });
                        });
                        
                    }
                    if(item.type === 'BannerMobileUrl') {
                        // toDelete
                        item.toDelete.forEach(assetId => {
                            this._storesService.deleteAssets(this.storeId, assetId).subscribe(
                                (event: any) => {
                                if (event instanceof HttpResponse) {
                                    console.info('Uploaded the file successfully');
            
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                }
                                },
                                (err: any) => {
                                    console.error('Could not upload the file');
                            });
                        });
                        // toAdd
                        item.toAdd.forEach(selectedFiles => {
        
                            let formData = new FormData();
                            formData.append('assetFile',selectedFiles[0]);
                            formData.append('assetType',item.type);
                            formData.append('assetDescription',item.description);
        
                            this._storesService.postAssets(this.storeId, "BannerMobileUrl", formData,"BannerMobile").subscribe(
                                (event: any) => {
                                if (event instanceof HttpResponse) {
                                    console.info('Uploaded the file successfully');
            
                                    this.files[1].assetId = event["id"];
            
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                }
                                },
                                (err: any) => {
                                    console.error('Could not upload the file');
                                });
                        });
                    }
                });

                // ---------------------------
                //    Create Store Provider
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
    // ------------------------------------------------------------------------------
    //                            Delivery Public Method
    // ------------------------------------------------------------------------------
    
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

    checkDeliveryPartner(){
        // on every change set error to false first (reset state)
        if (this.createStoreForm.get('step3').get('deliveryType').errors || this.createStoreForm.get('step3').get('deliveryPartner').errors){
            this.createStoreForm.get('step3').get('deliveryPartner').setErrors(null);
        }

        // ------------------------------------------------------------
        // reset allowedSelfDeliveryStates if user change delivery type
        // ------------------------------------------------------------

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
    
    // ------------------------------------------------------------------------------
    //                              Assets Public Method
    // ------------------------------------------------------------------------------

   /**
    * 
    * @param event 
    */
    selectFiles(fileType,event: any): void {

        // find index of object this.files
        let index = this.files.findIndex(preview => preview.type === fileType);
        
        if (event.target.files.length > 0) {
            // set each of the attributes
            this.files[index].fileSource = null;
            this.files[index].selectedFileName = "";
            this.files[index].selectedFiles = event.target.files;
        }
        
        let maxSize = 2600000;
        var maxSizeInMB = (maxSize / (1024*1024)).toFixed(2);

        if (this.files[index].fileSource && this.files[index].selectedFiles[0].size > maxSize ){
            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Image size limit',
                message: 'Your uploaded image is exceeds the maximum size of ' + maxSizeInMB + ' MB !',
                icon: {
                    show: true,
                    name: "image_not_supported",
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

                if (this.files[index].isMultiple) {
                    if (index === 1) {
                        this.files[1].fileSource = e.target.result;
                        this.files[1].toAdd.push(event.target.files);
                        
                        if(this.files[1].galleryImages.length < 3){
                            
                            this.files[1].galleryImages.unshift({
                                small           : '' + e.target.result,
                                medium          : '' + e.target.result,
                                big             : '' + e.target.result
                            });
                        }
                        this._changeDetectorRef.markForCheck();

                    } else if (index === 2) {
                        this.files[2].fileSource = e.target.result;
                        this.files[2].toAdd.push(event.target.files);

                        if(this.files[2].galleryImages.length < 3){

                            this.files[2].galleryImages.unshift({
                                small   : '' + e.target.result,
                                medium  : '' + e.target.result,
                                big     : '' + e.target.result,

                            });
                        }
                        this._changeDetectorRef.markForCheck();

                    }
                } else {
                    this.files[index].fileSource = e.target.result;

                    var image = new Image();
                    image.src = e.target.result;
    
                    image.onload = (imageInfo: any) => {
                        this.files[index].selectedImageWidth = imageInfo.path[0].width;
                        this.files[index].selectedImageHeight = imageInfo.path[0].height;
    
                        this._changeDetectorRef.markForCheck();
                    };
                }
                
                this._changeDetectorRef.markForCheck();                
            };
            reader.readAsDataURL(this.files[index].selectedFiles[i]);
            this.files[index].selectedFileName = this.files[index].selectedFiles[i].name;
            }
        }
        this._changeDetectorRef.markForCheck();
    }


    createImageFromBlob(image: Blob) {
        let reader = new FileReader(); //you need file reader for read blob data to base64 image data.
        return  reader.readAsDataURL(image);
    }

    deleteBannerDesktop(e, index){
        let assetId = this.files[1].galleryImages[index].assetId;

        this.files[1].toDelete.push(assetId);
        this.files[1].galleryImages.splice(index,1);
        if(this.files[1].galleryImages.length < 1){
            this.files[1].fileSource = null
        }
    }

    deleteBannerMobile(e, index){
        let assetId = this.files[2].galleryImages[index].assetId;

        this.files[2].toDelete.push(assetId);
        this.files[2].galleryImages.splice(index,1)
        if(this.files[2].galleryImages.length < 1){
            this.files[2].fileSource = null
        }
    }

    deletefiles(index: number) { 
        this.files[index].toDelete = true;
        this.files[index].fileSource = '';
        this.files[index].selectedFiles = '';

        this._changeDetectorRef.markForCheck();
    }

    // ------------------------------------------------------------------------------
    //                     Store Timing Public Method Section
    // ------------------------------------------------------------------------------


    updateStoreOpening(day: string){
        let index = this._storeTiming.findIndex(dayList => dayList.day === day);
        this._storeTiming[index].isOpen = !this._storeTiming[index].isOpen;
        this._storeTiming[index].isOff = !this._storeTiming[index].isOff;
        this._storeTiming[index].isBreakTime = this._storeTiming[index].isOpen;
        if( this._storeTiming[index].isBreakTime === false){
            this._storeTiming[index].breakStartTime.timeHour = "--";
            this._storeTiming[index].breakStartTime.timeMinute = "--";
            this._storeTiming[index].breakStartTime.timeAmPm = "--";

            this._storeTiming[index].breakEndTime.timeHour = "--";
            this._storeTiming[index].breakEndTime.timeMinute = "--";
            this._storeTiming[index].breakEndTime.timeAmPm = "--";
        } else {
            this._storeTiming[index].breakStartTime.timeHour = "01";
            this._storeTiming[index].breakStartTime.timeMinute = "00";
            this._storeTiming[index].breakStartTime.timeAmPm = "PM";

            this._storeTiming[index].breakEndTime.timeHour = "02";
            this._storeTiming[index].breakEndTime.timeMinute = "00";
            this._storeTiming[index].breakEndTime.timeAmPm = "PM";
        }

        this.storeTiming.clear();
        this._storeTiming.forEach(item => {
            this.storeTiming = this.createStoreForm.get('step4').get('storeTiming') as FormArray;
            this.storeTiming.push(this._formBuilder.group(item));
        }); 
    }

    toggleBreakHour (e, i){

        let storeTiming = this.createStoreForm.get('step4').get('storeTiming').value;

        if(e.checked === false){

            storeTiming[i].breakStartTime.timeHour = "--";
            storeTiming[i].breakStartTime.timeMinute = "--";
            storeTiming[i].breakStartTime.timeAmPm = "--"

            storeTiming[i].breakEndTime.timeHour = "--";
            storeTiming[i].breakEndTime.timeMinute = "--";
            storeTiming[i].breakEndTime.timeAmPm = "--"

            this.createStoreForm.get('step4').get('storeTiming').patchValue(storeTiming);
            this.createStoreForm.get('step4').get('storeTiming').value[i].isBreakTime = false;
        } else{
            storeTiming[i].breakStartTime.timeHour = "01";
            storeTiming[i].breakStartTime.timeMinute = "00";
            storeTiming[i].breakStartTime.timeAmPm = "PM"

            storeTiming[i].breakEndTime.timeHour = "02";
            storeTiming[i].breakEndTime.timeMinute = "00";
            storeTiming[i].breakEndTime.timeAmPm = "PM"

            this.createStoreForm.get('step4').get('storeTiming').patchValue(storeTiming);
            this.createStoreForm.get('step4').get('storeTiming').value[i].isBreakTime = true;
        }
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    applyToAll(index){

        let storeTiming = this.createStoreForm.get('step4').get('storeTiming').value

        let _storeTiming = {
            breakStartTimeHour: storeTiming[index].breakStartTime.timeHour,
            breakStartTimeMinute: storeTiming[index].breakStartTime.timeMinute,
            breakStartTimeAmPm: storeTiming[index].breakStartTime.timeAmPm,

            breakEndTimeHour: storeTiming[index].breakEndTime.timeHour,
            breakEndTimeMinute: storeTiming[index].breakEndTime.timeMinute,
            breakEndTimeAmPm: storeTiming[index].breakEndTime.timeAmPm,

            openTime: storeTiming[index].openTime,
            closeTime: storeTiming[index].closeTime,

            breakToggle: storeTiming[index].isBreakTime
        } 

        this.createStoreForm.get('step4').get('storeTiming').value.forEach((item, i) => {
            storeTiming[i].breakStartTime.timeHour = _storeTiming.breakStartTimeHour;
            storeTiming[i].breakStartTime.timeMinute = _storeTiming.breakStartTimeMinute;
            storeTiming[i].breakStartTime.timeAmPm = _storeTiming.breakStartTimeAmPm;

            storeTiming[i].breakEndTime.timeHour =_storeTiming.breakEndTimeHour;
            storeTiming[i].breakEndTime.timeMinute =_storeTiming.breakEndTimeMinute;
            storeTiming[i].breakEndTime.timeAmPm =_storeTiming.breakEndTimeAmPm;

            storeTiming[i].openTime =_storeTiming.openTime;
            storeTiming[i].closeTime =_storeTiming.closeTime;

            storeTiming[i].isBreakTime = _storeTiming.breakToggle;

        })
        this.createStoreForm.get('step4').get('storeTiming').patchValue(storeTiming);
    }

    changeTime(i, type , e){
        //Working Hour Start Time
        let startTime = this.createStoreForm.get('step4').get('storeTiming').value[i].openTime;
        let _startTime;

        if (startTime.timeAmPm === "PM") {
            _startTime = parseInt(startTime.timeHour) + 12;
        } else {
            _startTime = startTime.timeHour;
        }
        const workingHourStartTime = new Date();
        workingHourStartTime.setHours(_startTime,startTime.timeMinute,0);

        //Working Hour End Time
        let endTime = this.createStoreForm.get('step4').get('storeTiming').value[i].closeTime;
        let _endTime;
    
        if (endTime.timeAmPm === "PM") {
            _endTime = parseInt(endTime.timeHour) + 12;
        } else {
            _endTime = endTime.timeHour;
        }        
        const workingHourEndTime = new Date();
        workingHourEndTime.setHours(_endTime,endTime.timeMinute,0);
        
        //working Hour Display Error
        if( workingHourStartTime >= workingHourEndTime ){            
            this.timeAlert[i] ="End time range incorrect" ;
        }else{
            this.timeAlert[i] = " " ;
        }      
    }

    changeBreakTime(i, type , e){
        //Break Hour Start Time
        let breakStartTime = this.createStoreForm.get('step4').get('storeTiming').value[i].breakStartTime;
        let _breakStartTime;

        if (breakStartTime.timeAmPm === "PM") {
            _breakStartTime = parseInt(breakStartTime.timeHour) + 12;
        } else {
            _breakStartTime = breakStartTime.timeHour;
        }
        const breakHourStartTime = new Date();
        breakHourStartTime.setHours(_breakStartTime,breakStartTime.timeMinute,0);

        //Break hour End Time
        let breakEndTime = this.createStoreForm.get('step4').get('storeTiming').value[i].breakEndTime;
        let _breakEndTime;
    
        if (breakEndTime.timeAmPm === "PM") {
            _breakEndTime = parseInt(breakEndTime.timeHour) + 12;
        } else {
            _breakEndTime = breakEndTime.timeHour;
        }        
        const breakHourEndTime = new Date();
        breakHourEndTime.setHours(_breakEndTime,breakEndTime.timeMinute,0);

        //Display Error
        if( breakHourStartTime >= breakHourEndTime ){
            this.timeAlert[i] ="Break Hour End time range incorrect" ;
        }else{
            this.timeAlert[i] = " " ;
        }      
    }
}