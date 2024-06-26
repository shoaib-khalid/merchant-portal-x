import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { RegisterStoreValidationService } from 'app/modules/merchant/stores-management/register-store/register-store.validation.service';
import { BehaviorSubject, forkJoin, Observable, ReplaySubject, Subject, take } from 'rxjs';
import { StoresService } from 'app/core/store/store.service';
import { Store, StoreRegionCountries, CreateStore, StoreAssets, StoreDeliveryProvider, StoreDeliveryPeriod } from 'app/core/store/store.types';
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
import { debounceTime, map, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { Platform } from 'app/core/platform/platform.types';
import { PlatformService } from 'app/core/platform/platform.service';
import { AuthService } from 'app/core/auth/auth.service';
import { Loader } from '@googlemaps/js-api-loader';
import { GoogleKey } from '../edit-store/edit-store.types';
import { City } from '../edit-store/store-delivery/store-delivery.types';
import { StoresDeliveryService } from '../edit-store/store-delivery/store-delivery.service';
import { MatSelect } from '@angular/material/select';
import { MatStepper } from '@angular/material/stepper';
import { environment } from 'environments/environment';

@Component({
    selector     : 'register-store-page',
    templateUrl  : './register-store.component.html',
    styles       : [
        `.ql-container { height: 156px; }
        .map {
            width: 50vw;
            height: 50vh;
        }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class RegisterStoreComponent implements OnInit
{
    @ViewChild('supportNgForm') supportNgForm: NgForm;
    @ViewChild('verticalStepper') stepper: MatStepper;

    platform: Platform;

    storeId: string;

    isAlwaysOpen: boolean = true;

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
    
    storeStateCities$: Observable<City[]>;
    storeStateCities: string[] = [];

    /** control for the selected bank for multi-selection */
    public regionCountryStateCities: FormControl = new FormControl();
    private _onDestroy = new Subject<void>();
    public filteredCities: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
    @ViewChild('stateCitySelector') stateCitySelector: MatSelect;

    deliveryFulfilment: any;
    deliveryPartners: StoreDeliveryProvider[] = [];
    deliveryPartnerTypes: any = [];

    // Allowed Self Delivery States
    _allowedSelfDeliveryStates: any;
    allowedSelfDeliveryStates: FormArray;

    // Delivery Periods Fulfilment
    _deliveryPeriods: StoreDeliveryPeriod[] = [];
    deliveryPeriods: FormArray;

    // Store Timing
    _storeTiming: any;
    storeTiming: FormArray;

    // Image part  
    progressInfos: any[] = [];
    message: string[] = [];
    
    files: {
        description: string,
        type: string,
        fileSource: any,
        selectedFileName: string, 
        selectedFiles: any, 
        recommendedImageWidth: string, 
        recommendedImageHeight: string, 
        selectedImageWidth: string, 
        selectedImageHeight: string,
        toDelete: any,
        toAdd:any[],
        isMultiple: boolean,
        galleryImages: any[],
        assetId: string
    }[];
    timeAlert: any = [];
    invalidTime: boolean = false;
    disableForm: boolean = false;

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

    countryCode: string;
    currencySymbol: string;
    dialingCode: string;

    //GOOGLE MAPS
    private map: google.maps.Map;
    location :any;
    center!: google.maps.LatLngLiteral;
    displayLat:any;
    displayLong:any;

    //string interpolationdoesnt-update-on-eventListener hence need to use behaviour subject
    displayLatitude: BehaviorSubject<string> = new BehaviorSubject<string>('');
    displayLongtitude: BehaviorSubject<string> = new BehaviorSubject<string>('');
    storeCreationError: boolean = false;
    customDomain: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _storesService: StoresService,
        private _jwt: JwtService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _userService: UserService,
        private _chooseVerticalService: ChooseVerticalService,
        private _router: Router,
        private _route: ActivatedRoute,
        private _platformsService: PlatformService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _authService: AuthService,
        private _domSanitizer: DomSanitizer,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _storeDeliveryService: StoresDeliveryService
    )
    {
        this.checkExistingURL = debounce(this.checkExistingURL, 300);
        this.checkExistingName = debounce(this.checkExistingName, 300);
        this.checkPrefix = debounce(this.checkPrefix, 300);
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
                // storePrefix         : ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
                storePrefix         : [''],
                subdomain           : ['', [Validators.required, Validators.minLength(4), Validators.maxLength(63), RegisterStoreValidationService.domainValidator]],
                storeDescription    : ['', [Validators.maxLength(200)]],
                displayAddress      : [''],
                email               : ['', [Validators.required, Validators.email]],
                phoneNumber         : ['', [RegisterStoreValidationService.phonenumberValidator, Validators.minLength(5), Validators.maxLength(30)]],
                paymentType         : ['ONLINEPAYMENT', Validators.required],
            }),
            step3: this._formBuilder.group({

                address             : ['', Validators.required],
                city                : ['', Validators.required],
                regionCountryId     : ['', Validators.required],
                postcode            : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), RegisterStoreValidationService.postcodeValidator]],
                regionCountryStateId: ['', Validators.required],

                // Delivery Provider
                deliveryType             : ['', Validators.required],
                // Delivery deliverySpType for adhoc
                deliverySpType          : ['', Validators.required],
                // Allowed Self Delivery States
                allowedSelfDeliveryStates: this._formBuilder.array([]),
                // Delivery Periods
                deliveryPeriods          : this._formBuilder.group({ 
                        values      : this._formBuilder.array([]),
                        validation  : ['', RegisterStoreValidationService.requiredAtLeastOneValidator]
                }),
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

        // Disable 
        this.createStoreForm.get('step1').get('paymentType').disable({ onlySelf: true, emitEvent: false });

        this.setInitialValue();

        // set initial selection
        this.regionCountryStateCities.setValue([]);
        // load the initial bank list
        // this.filteredCities.next(this.cities.slice());

        this.regionCountryStateCities.valueChanges
            .pipe(takeUntil(this._onDestroy), debounceTime(300))
            .subscribe((result) => {                
                // Get states by country Z(using symplified backend)
                this._storeDeliveryService.getStoreRegionCountryStateCity(result , this.createStoreForm.get('step3.regionCountryStateId').value, this.countryCode)
                .subscribe((response)=>{
                    // Get the products
                    this.storeStateCities$ = this._storeDeliveryService.cities$;                    

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            });

        this.createStoreForm.get('step3.regionCountryStateId').valueChanges
            .pipe(takeUntil(this._onDestroy), debounceTime(300))
            .subscribe((result) => {
                
                // reset city form
                this.createStoreForm.get('step3.city').patchValue(null);

                // Get states by country Z(using symplified backend)
                this._storeDeliveryService.getStoreRegionCountryStateCity(null,this.createStoreForm.get('step3.regionCountryStateId').value, this.countryCode)
                .subscribe((response)=>{
                    // Get the products
                    this.storeStateCities$ = this._storeDeliveryService.cities$;                    

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
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

            this._userService.client$
            .pipe(takeUntil(this._onDestroy))
            .subscribe((response: Client)=> {

                if (response) {

                    if (response.email)
                        this.createStoreForm.get('step1').get('email').patchValue(response.email);
    
                    if (response.regionCountry) {
    
                        let symplifiedCountryId = response.regionCountry.id;
    
                        let symplifiedCountryStateId = this.createStoreForm.get('step3.regionCountryStateId').value;
    
                        this.countryCode = symplifiedCountryId;
    
        
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
                        this._storesService.getStoreRegionCountryState(symplifiedCountryId)
                        .subscribe((response)=>{
                            this.statesByCountry = response.data.content;
                            
                        });
    
                        // Get city by state
                        this._storeDeliveryService.getStoreRegionCountryStateCity(null,symplifiedCountryStateId, this.countryCode)
                        .subscribe((response)=>{
                            // Get the products
                            this.storeStateCities$ = this._storeDeliveryService.cities$;                        
    
                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                        });
            
                        // country (using form builder variable)
                        this.createStoreForm.get('step3').get('regionCountryId').patchValue(symplifiedCountryId.toUpperCase());
        
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
    
                        // ----------------------
                        // Get All Available Store Delivery Provider
                        // ----------------------
        
                        this._storesService.getStoreDeliveryProvider({deliveryType: _deliveryType, regionCountryId: _regionCountryId})
                        .subscribe((response: StoreDeliveryProvider[]) => {
                                // reset this.deliveryPartners first to initial state
                                this.deliveryPartners = [];
                                this.deliveryPartners = response;                            
    
                                // filter delivery fulfilment aka delivery period
                                this.deliveryPartnerTypes = [ ...new Set(this.deliveryPartners.map(item => item.fulfilment))];
    
                                // Set deliveryPeriods
                                this.deliveryPeriods = this.createStoreForm.get('step3').get('deliveryPeriods').get('values') as FormArray;
    
                                // check changes
                                this.checkDeliveryPartner();
    
                                // -------------------------------------
                                // delivery period fulfilment
                                // -------------------------------------
    
                                this._storesService.getDeliveryPeriod(null)
                                    .subscribe((response: StoreDeliveryPeriod[]) => {
                                        this._deliveryPeriods = response;
                                    
                                        this._deliveryPeriods.forEach(item => {
    
                                            // find delivery provider for each delviery period
                                            let deliveryPartners = this.deliveryPartners.map(element => { 
                                                if (element.fulfilment === item.deliveryPeriod) {
                                                    return element;
                                                } else {
                                                    return null;
                                                }
                                            });
    
                                            // remove undefined
                                            // deliveryPartners.filter(n => n);
                                            
                                            let _deliveryProviders = this._formBuilder.array(deliveryPartners.filter(n => n));
                            
                                            // set empty array for each delivery period of deliveryProviders
                                            Object.assign(item, { deliveryProviders: _deliveryProviders });
    
                                            // this.deliveryPeriods = this.createStoreForm.get('step3').get('deliveryPeriods').get('values') as FormArray;
                                            
                                            // attacted delivery provider to delivery period
                                            this.deliveryPeriods.push(this._formBuilder.group(item));
    
                                            // Mark for check
                                            this._changeDetectorRef.markForCheck();
                                        });
                                    
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                });
    
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                        );
                    }
    
                    // -------------------------
                    // Set Dialing code
                    // -------------------------
                    
                    let countryId = response.countryId;
                    switch (countryId) {
                        case 'MYS':
                            this.dialingCode = '+60';
                            this.createStoreForm.get('step3').get('regionCountryStateId').patchValue('Selangor');
                            break;
                        case 'PAK':
                            this.dialingCode = '+92';
                            this.createStoreForm.get('step3').get('regionCountryStateId').patchValue('Federal');
                            break;
                        default:
                            break;
                    }
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        });

        // check total of stores this account have
        this._storesService.stores$
        .pipe(takeUntil(this._onDestroy))
        .subscribe((response)=>{
            if (response.length && response.length > 11) {
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
        // delivery fulfilment
        // -------------------------------------

        this.deliveryFulfilment = [
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
                galleryImages: [],
                assetId: null
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
                galleryImages: [],
                assetId: null
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
                galleryImages: [],
                assetId: null
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
                galleryImages: [],
                assetId: null
            },
            { 
                description: "CoverImage",
                type: "CoverImageUrl",
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
                galleryImages: [],
                assetId: null
            }
        ];
        
        // initialise gallery
        // set galleryOptions
        this.galleryOptionsBannerDesktop = [
            {
                preview: false,
                imageArrows: true,
                width: '780px',
                height: '210px',
                thumbnailsColumns: 3,
                imageAnimation: NgxGalleryAnimation.Slide,
                thumbnailsArrows: true,
                imageArrowsAutoHide: false, 
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
                thumbnailsColumns: 3,
                thumbnailsAutoHide: false,
                width: '280px',
                height: '210px',
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
                preview: false,
                imageArrows: true,
                width: '310px',
                height: '210px',
                thumbnailsColumns: 3,
                imageAnimation: NgxGalleryAnimation.Slide,
                thumbnailsArrows: true,
                imageArrowsAutoHide: false, 
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
                thumbnailsAutoHide: false,
                width: '280px',
                height: '210px',
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

        // Subscribe to platform data
        this._platformsService.platform$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((platform: Platform) => {
                this.platform = platform;
            });

        // Get allowed store countries 
        // this only to get list of country in symplified backend
        this._storesService.storeRegionCountries$.subscribe((response: StoreRegionCountries[])=>{
            response.forEach((country: StoreRegionCountries) => {
                this.countriesList.push(country);

                if (country.id === this.countryCode) {
                    this.currencySymbol = country.currencySymbol;
                }
            });
        });

        // set required value that does not appear in register-store.component.html
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;
        this.createStoreForm.get('clientId').patchValue(clientId);

        
        setTimeout(() => {
            //Initialise google maps
            let loader = new Loader({
                apiKey: environment.googleMapsAPIKey,
                libraries: ['places']
                
                })
    
            //hardcode value
            this.displayLat = 0;
            this.displayLong = 0;
    
            this.location = {
                lat: this.displayLat,
                lng: this.displayLong,
            };
    
            this.displayLatitude.next(this.displayLat.toString());
            this.displayLongtitude.next(this.displayLong.toString());

            loader.load().then(() => {
                
                this.map = new google.maps.Map(document.getElementById("map-create"), {
                    center: this.location,
                    zoom: 15,
                    mapTypeControl:false,
                    streetViewControl:false,//Removing the pegman from map
                    // styles: styles,
                    mapTypeId: "roadmap",
                })
        
                const initialMarker = new google.maps.Marker({
                position: this.location,
                map: this.map,
                });
    
                //use for when user mark other location
                let markers: google.maps.Marker[] = [];
              
                // Configure the click listener.
                this.map.addListener("click", (event) => {
                    
                    // this.storeDeliveryForm.markAsDirty();
                    //to be display coordinate
                    let coordinateClickStringify = JSON.stringify(event.latLng);
                    let coordinateClickParse = JSON.parse(coordinateClickStringify);
            
                    this.location = {
                        lat: coordinateClickParse.lat,
                        lng: coordinateClickParse.lng,
                    };
    
                    // Clear out the old markers.
                    markers.forEach((marker) => {
                    marker.setMap(null);
                    });
                    markers = [];
        
                    // Clear out the init markers1.
                    initialMarker.setMap(null);
        
                    // Create a marker for each place.
                    markers.push(
                    new google.maps.Marker({
                        map:this.map,
                        // icon,
                        position: event.latLng,
                    })
                    );
                    this.displayLatitude.next(coordinateClickParse.lat);
                    this.displayLongtitude.next(coordinateClickParse.lng);
                
                });
    
                //Trigger when click Relocate
                let geocoder: google.maps.Geocoder;
                const relocatebutton = document.getElementById("relocate-button") as HTMLInputElement;
                // const submitButton =  document.getElementById("submit-btn");
                geocoder = new google.maps.Geocoder();
                relocatebutton.addEventListener("click", (e) =>{
                    geocoder
                    .geocode({ address: this.createStoreForm.get('step3').get('address').value})
                    .then((result) => {
                        const { results } = result;
            
                        //to be display coordinate
                        let coordinateAddressStringify = JSON.stringify(results[0].geometry.location);
                        let coordinateAddressParse = JSON.parse(coordinateAddressStringify);
            
                        this.location = {
                        lat: coordinateAddressParse.lat,
                        lng: coordinateAddressParse.lng,
                        };
    
                        //to be display at front in string
                        this.displayLatitude.next(coordinateAddressParse.lat);
                        this.displayLongtitude.next(coordinateAddressParse.lng);
            
                        // Clear out the old markers.
                        markers.forEach((marker) => {
                            marker.setMap(null);
                        });
                        markers = [];
            
                        // Clear out the init markers1.
                        initialMarker.setMap(null);
            
                        // Create a marker for each place.
                        markers.push(
                            new google.maps.Marker({
                            map:this.map,
                            // icon,
                            position: results[0].geometry.location,
                            })
                        );
                        const bounds1 = new google.maps.LatLngBounds();
            
                        bounds1.extend(results[0].geometry.location);
            
                        this.map.fitBounds(bounds1);
                        
                        return results;
                    })
                    .catch((e) => {
                        alert("Geocode was not successful for the following reason: " + e);
                    });
    
                    
                });
        
                
            });        
        }, 1000);
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

        let BreakException = {};

        const { subdomain ,...createStoreBody} = this.createStoreForm.get('step1').value; 
        const storeTimingBody = this.createStoreForm.get('step4').get('storeTiming').value;
        const deliveryType = this.createStoreForm.get('step3').get('deliveryType').value;
        const allowStorePickup = this.createStoreForm.get('step3').get('allowStorePickup').value;
        const allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates').value;
        const deliverySpType = this.createStoreForm.get('step3').get('deliverySpType').value;        

        // add domain when sending to backend.. at frontend form call it subdomain
        // createStoreBody["domain"] =  this.createStoreForm.get('step1').get('subdomain').value + this.domainName;
        createStoreBody["domain"] = this.customDomain ? subdomain : subdomain + this.domainName;

        createStoreBody["clientId"] = this.createStoreForm.get('clientId').value;
        createStoreBody["isBranch"] = this.createStoreForm.get('isBranch').value;
        createStoreBody["isSnooze"] = this.createStoreForm.get('step4').get('isSnooze').value;
        createStoreBody["serviceChargesPercentage"] = this.createStoreForm.get('serviceChargesPercentage').value;
        createStoreBody["verticalCode"] = this.createStoreForm.get('verticalCode').value;
        
        createStoreBody["address"] = this.createStoreForm.get('step3').get('address').value;
        createStoreBody["city"] = this.createStoreForm.get('step3').get('city').value;
        createStoreBody["regionCountryId"] = this.createStoreForm.get('step3').get('regionCountryId').value;
        createStoreBody["postcode"] = this.createStoreForm.get('step3').get('postcode').value;
        createStoreBody["regionCountryStateId"] = this.createStoreForm.get('step3').get('regionCountryStateId').value;

        createStoreBody["latitude"] = this.location.lat.toFixed(6);
        createStoreBody["longitude"] = this.location.lng.toFixed(6);
        createStoreBody["paymentType"] = 'ONLINEPAYMENT';

        // Disable the form
        this.createStoreForm.disable();

        // -------------------------------------
        //        Register Store Section
        // -------------------------------------
        this._storesService.post(createStoreBody)
            .subscribe(async (response) => {

                this.storeId = response.data.id;
                this.storeCreationError = false;

                // ---------------------------
                //    Create Store Timing
                // --------------------------- 
                await this.createStoreTiming(storeTimingBody)
                    .then(result => {
                    })
                    .catch(err => { 
                        console.error('FAILED [create store timing]- ', err);
                        this.storeCreationError = true;
                    })

                // ---------------------------
                //    Create Store Assets
                // ---------------------------
                await this.createStoreAssets(this.files)
                    .then(result => {
                    })
                    .catch(err => { 
                        console.error('FAILED [create store assets]- ', err);
                        this.storeCreationError = true;
                    })

                // ---------------------------
                //    Create Store Provider
                // ---------------------------
                await this.createStoreProvider(deliveryType, allowStorePickup)
                    .then(result => {
                    })
                    .catch(err => { 
                        console.error('FAILED [create store provider]- ', err);
                        this.storeCreationError = true;
                    })

                // ---------------------------
                //     Provision SELF 
                // ---------------------------
                if (deliveryType === "SELF") {
                    await this.provisionSELF(allowedSelfDeliveryStates)
                        .then(result => {
                        })
                        .catch(err => { 
                            console.error('FAILED [provision SELF]- ', err);
                            this.storeCreationError = true;
                        })
                } 

                // ---------------------------
                // Provision ADHOC 
                // ---------------------------
                if (deliveryType === "ADHOC") {
                    await this.provisionADHOC(deliverySpType)
                        .then(result => {
                        })
                        .catch(err => { 
                            console.error('FAILED [provision ADHOC]- ', err);
                            this.storeCreationError = true;
                        })
                }

                // ---------------------------
                // Provision SCHEDULED
                // ---------------------------
                if (deliveryType === "SCHEDULED") {
                    await this.provisionSCHEDULED()
                        .then(result => {
                        })
                        .catch(err => { 
                            console.error('FAILED [provision SCHEDULED]- ', err);
                            this.storeCreationError = true;
                        })
                }

                await this.storeCreationStatus(this.storeCreationError);

            })        
    }

    async createStoreTiming(storeTimingBody) {
        let promise = new Promise(async (resolve, reject) => {

            let error = false;

            let filteredItemsArr = [];

            for (let index = 0; index < storeTimingBody.length && (error === false); index++) {
                const item = storeTimingBody[index];

                let { isOpen, isBreakTime,  ...filteredItem } = item;

                // Start Time if PM read 24hrs format
                let startTime = filteredItem.openTime;
                let _startTime;
        
                if (startTime.timeAmPm === "PM" && startTime.timeHour !== "12") {
                    _startTime = parseInt(startTime.timeHour) + 12;
                } else if (startTime.timeAmPm === "AM" && startTime.timeHour === "12") {
                    _startTime = parseInt(startTime.timeHour) - 12;
                } else {
                    _startTime = startTime.timeHour;
                }

                // End Time if PM read 24hrs format
                let endTime = filteredItem.closeTime;
                let _endTime;

                if (endTime.timeAmPm === "PM" && endTime.timeHour !== "12") {
                    _endTime = parseInt(endTime.timeHour) + 12;
                } else if (endTime.timeAmPm === "AM" && endTime.timeHour === "12") {
                    _endTime = parseInt(endTime.timeHour) - 12;
                } else {
                    _endTime = endTime.timeHour;
                }

                // Break Start Time if PM read 24hrs format
                let breakStartTime = filteredItem.breakStartTime;
                let _breakStartTime;
        
                if (breakStartTime.timeAmPm === "PM" && breakStartTime.timeHour !== "12") {
                    _breakStartTime = parseInt(breakStartTime.timeHour) + 12;
                } else if (breakStartTime.timeAmPm === "AM" && breakStartTime.timeHour === "12") {
                    _breakStartTime = parseInt(breakStartTime.timeHour) - 12;
                } else {
                    _breakStartTime = breakStartTime.timeHour;
                }

                // Break End Time if PM read 24hrs format
                let breakEndTime = filteredItem.breakEndTime;
                let _breakendTime;
        
                if (breakEndTime.timeAmPm === "PM" && breakEndTime.timeHour !== "12") {
                    _breakendTime = parseInt(breakEndTime.timeHour) + 12;
                } else if (breakEndTime.timeAmPm === "AM" && breakEndTime.timeHour === "12") {
                    _breakendTime = parseInt(breakEndTime.timeHour) - 12;
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

                filteredItemsArr.push(_filteredItem);
            }

            // ---------------------------
            //    Create Store Timing
            // ---------------------------

            await this._storesService.postTimingBulk(this.storeId, filteredItemsArr).toPromise()
                .catch(err => {
                    reject('Error in postTiming')
                    error = true;
                })
                
            // manual set store timing to new created store at service (ngarut)
            this._storesService.setTimingToStore(this.storeId, this._storeTiming).subscribe(()=>{});
            resolve("done")
        });
        return promise;
    }

    async createStoreAssets(files) {
        let promise = new Promise(async (resolve, reject) => {

            let error = false;

            for (let index = 0; index < files.length && (error === false); index++) {
                const item = files[index];

                //Logo update using item.selected files
                if ( item.type === 'LogoUrl' && item.selectedFiles ){

                    let formData = new FormData();
                    formData.append('assetFile', item.selectedFiles[0]);
                    formData.append('assetType',item.type);
                    formData.append('assetDescription',item.description);


                    await this._storesService.postAssets(this.storeId, "LogoUrl", formData,"Logo").toPromise()
                        .then( event => {
                            if (event instanceof HttpResponse) {
                                console.info('Uploaded the file successfully');
    
                                this.files[3].assetId = event["id"];
    
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                        })
                        .catch(err => {
                            reject('Error in postAssets (LogoUrl)')
                            error = true;
                        })
                }
                // Favicon update using item.selectedFiles
                if ( item.type === 'FaviconUrl' && item.selectedFiles ){
                    
                    let formData = new FormData();
                    formData.append('assetFile',item.selectedFiles[0]);
                    formData.append('assetType',item.type);
                    formData.append('assetDescription',item.description);

                    await this._storesService.postAssets(this.storeId, "FaviconUrl", formData,"Favicon").toPromise()
                        .then( event => {
                            if (event instanceof HttpResponse) {
                                console.info('Uploaded the file successfully');
    
                                this.files[3].assetId = event["id"];
    
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                        })
                        .catch(err => {
                            reject('Error in postAssets (FaviconUrl)')
                            error = true;
                        })
                }
                // BannerDesktopUrl update using item.selectedFiles
                if ( item.type === 'BannerDesktopUrl' ) {
                    // toDelete
                    // for (let index = 0; index < item.toDelete.length; index++) {
                    //     const assetId = item.toDelete[index];

                    //     await this._storesService.deleteAssets(this.storeId, assetId).toPromise()
                    //         .then( event => {
                    //             if (event instanceof HttpResponse) {
                    //                 console.info('Uploaded the file successfully');
            
                    //                 // Mark for check
                    //                 this._changeDetectorRef.markForCheck();
                    //             }
                    //         })
                    //         .catch(err => {
                    //             reject('Error in deleteAssets (BannerDesktopUrl)')
                    //             error = true;
                    //         })
                    // }
                    // toAdd
                    for (let index = 0; index < item.toAdd.length; index++) {
                        const selectedFiles = item.toAdd[index];

                        let formData = new FormData();
                        formData.append('assetFile', selectedFiles[0]);
                        formData.append('assetType', item.type);
                        formData.append('assetDescription', item.description);

                        await this._storesService.postAssets(this.storeId, "BannerDesktopUrl", formData,"BannerDesktop").toPromise()
                            .then( event => {
                                if (event instanceof HttpResponse) {
                                    console.info('Uploaded the file successfully');

                                    this.files[1].assetId = event["id"];
            
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                }
                            })
                            .catch(err => {
                                reject('Error in postAssets (BannerDesktopUrl)')
                                error = true;
                            })
                        
                    }
                }
                if ( item.type === 'BannerMobileUrl' ) {
                    // toDelete
                    // for (let index = 0; index < item.toDelete.length; index++) {
                    //     const assetId = item.toDelete[index];

                    //     await this._storesService.deleteAssets(this.storeId, assetId).toPromise()
                    //         .then( event => {
                    //             if (event instanceof HttpResponse) {
                    //                 console.info('Uploaded the file successfully');
            
                    //                 // Mark for check
                    //                 this._changeDetectorRef.markForCheck();
                    //             }
                    //         })
                    //         .catch(err => {
                    //             reject('Error in deleteAssets (BannerMobileUrl)')
                    //             error = true;
                    //         })
                    // }
  
                    // toAdd
                    for (let index = 0; index < item.toAdd.length; index++) {
                        const selectedFiles = item.toAdd[index];

                        let formData = new FormData();
                        formData.append('assetFile', selectedFiles[0]);
                        formData.append('assetType', item.type);
                        formData.append('assetDescription', item.description);

                        await this._storesService.postAssets(this.storeId, "BannerMobileUrl", formData,"BannerMobile").toPromise()
                            .then( event => {
                                if (event instanceof HttpResponse) {
                                    console.info('Uploaded the file successfully');

                                    this.files[1].assetId = event["id"];
            
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                }
                            })
                            .catch(err => {
                                reject('Error in postAssets (BannerMobileUrl)')
                                error = true;
                            })
                        
                    }
                }
                if ( item.type === 'CoverImageUrl' && item.selectedFiles ){

                    let formData = new FormData();
                    formData.append('assetFile', item.selectedFiles[0]);
                    formData.append('assetType',item.type);
                    formData.append('assetDescription',item.description);


                    await this._storesService.postAssets(this.storeId, "CoverImageUrl", formData,"CoverImage").toPromise()
                        .then( event => {
                            if (event instanceof HttpResponse) {
                                console.info('Uploaded the file successfully');
    
                                this.files[4].assetId = event["id"];
    
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                        })
                        .catch(err => {
                            reject('Error in postAssets (CoverImageUrl)')
                            error = true;
                        })
                }
            }
            resolve("done")
        });
        return promise;
    }

    async createStoreProvider(deliveryType, allowStorePickup) {
        let promise = new Promise(async (resolve, reject) => {
            let error = false;
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
    
            await this._storesService.postStoreDeliveryDetails(this.storeId, deliveryDetailBody).toPromise()
                .catch(err => {
                    reject('Error in postStoreDeliveryDetails')
                    error = true;
                })
            resolve("done")
        });
        return promise;
    }

    async provisionSELF(allowedSelfDeliveryStates) {
        let promise = new Promise(async (resolve, reject) => {
            let error = false;

            // Create State Delivery Charges    
            for (let i = 0; i < allowedSelfDeliveryStates.length && (error === false); i++) {
    
                let selfDeliveryStateBody = {
                    region_country_state_id: allowedSelfDeliveryStates[i].deliveryStates,
                    delivery_charges: allowedSelfDeliveryStates[i].deliveryCharges
                };

                await this._storesService.postSelfDeliveryStateCharges(this.storeId, selfDeliveryStateBody).toPromise()
                    .catch(err => {
                        reject('Error in postSelfDeliveryStateCharges')
                        error = true;
                    })
            }
                
            resolve("done")
        });
        return promise;
    }

    async provisionADHOC(deliverySpType) {
        let promise = new Promise(async (resolve, reject) => {
            let error = false;

            let index = this.deliveryPartners.findIndex(item => item.id === deliverySpType + "");

            if (index > -1){

                await this._storesService.postStoreRegionCountryDeliveryProvider(this.storeId, this.deliveryPartners[index].deliverySpId, this.deliveryPartners[index].fulfilment, this.deliveryPartners[index].id).toPromise()
                    .catch(err => {
                        reject('Error in postStoreRegionCountryDeliveryProvider')
                        error = true;
                    })

            } else {
                console.error("Provision ADHOC delivery failed")
            }
                
            resolve("done")
        });
        return promise;
    }

    async provisionSCHEDULED() {
        let promise = new Promise(async (resolve, reject) => {
            let error = false;

            let deliveryPeriodBody = this.createStoreForm.get('step3').get('deliveryPeriods').get('values').value;

            deliveryPeriodBody.map(item => {
                item.storeId = this.storeId;
            });

            await this._storesService.postDeliveryPeriod(this.storeId, deliveryPeriodBody).toPromise()
                .catch(err => {
                    reject('Error in postDeliveryPeriod')
                    error = true;
                })
                
            resolve("done")
        });
        return promise;
    }

    async storeCreationStatus(status) {
        let promise = new Promise(async (resolve, reject) => {

            if ( status === false ) {
                // Show a success message (it can also be an error message)
                const confirmation = this._fuseConfirmationService.open({
                    title  : 'Store Created',
                    message: 'You have successfully created a new store',
                    icon: {
                        show: true,
                        name: "heroicons_outline:clipboard-check",
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

                // Subscribe to the confirmation dialog closed action
                confirmation.afterClosed().subscribe((result) => {

                    // If the confirm button pressed...
                    if ( result === 'confirmed' )
                    {
                        this.isDisplayStatus = false;
        
                        // Navigate to the confirmation required page
                        this._router.navigateByUrl('/stores');

                    }
                });

            }
            else if ( status === true ) {
                // Show a failed message (it can also be an error message)
                const confirmation = this._fuseConfirmationService.open({
                    title  : 'Store Creation Failed',
                    message: 'Something is wrong while creating your store. Please try again',
                    icon: {
                        show: true,
                        name: "heroicons_outline:exclamation",
                        color: "error"
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

                // Delete the product on the server
                this._storesService.delete(this.storeId).subscribe(() => {

                    // enable back the form
                    this.createStoreForm.enable();

                    // set the stepper back to step 1
                    this.stepper.selectedIndex = 0;
                    
                    // empty out storeId
                    this.storeId = '';

                    // set selected store to null anyway
                    this._storesService.store = null;
                    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            }
        });
        return promise;
    }

    async checkExistingURL(subdomain: string){
        if (subdomain === '') return;
        if (subdomain.substring(0, 1) === '.') return;

        let url = this.customDomain ? subdomain : subdomain + this.domainName;
        let status = await this._storesService.getExistingURL(url);
        if (status === 409){
            setTimeout(() => {
                this.createStoreForm.get('step1').get('subdomain').setErrors({domainAlreadyTaken: true});
                this.createStoreForm.get('step1').get('subdomain').markAsTouched({onlySelf: true});

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }, 0);
        }
    }
    
    async checkExistingName(name:string){
        if (name === '') return;

        let status = await this._storesService.getExistingName(name);
        if (status === 409){
            setTimeout(() => {
                this.createStoreForm.get('step1').get('name').setErrors({storeNameAlreadyTaken: true});
                this.createStoreForm.get('step1').get('name').markAsTouched({onlySelf: true});

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }, 0);
        }
        else if (status === 200) {
            this._storesService.generateStorePrefix({name})
                .subscribe(
                    {
                        next: (prefix) => {
                            if (prefix) {
                                this.createStoreForm.get('step1').get('storePrefix').patchValue(prefix);
        
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                        },
                        error: (err) => {
                            // Show a failed message (it can also be an error message)
                            this._fuseConfirmationService.open({
                                title  : err.error.error ? err.error.error : 'Error',
                                message: err.error.message ? err.error.message : err.message,
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
                        }
                    }
                )
        }
    }

    async checkPrefix(name:string){
        if (name === '') return;
        if (name.length < 4) return;

        let status = await this._storesService.getExistingPrefix(name);
        if (status === 409){
            setTimeout(() => {
                this.createStoreForm.get('step1').get('storePrefix').setErrors({prefixAlreadyTaken: true});
                this.createStoreForm.get('step1').get('storePrefix').markAsTouched({onlySelf: true});

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }, 0);
        }
    }
    
    sanitizePhoneNumber(phoneNumber: string) {

        let substring = phoneNumber.substring(0, 1)
        let countryId = this.createStoreForm.get('step3').get('regionCountryId').value;
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
    
    // ------------------------------------------------------------------------------
    //                            Delivery Public Method
    // ------------------------------------------------------------------------------
    
    updateStates(countryId: string){

        // reset current regionCountryStateId
        this.createStoreForm.get('step3').get('regionCountryStateId').patchValue("");

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
        if (this.createStoreForm.get('step3').get('deliveryType').errors || this.createStoreForm.get('step3').get('deliverySpType').errors){
            this.createStoreForm.get('step3').get('deliverySpType').setErrors(null);
        }

        // ------------------------------------------------------------
        // reset allowedSelfDeliveryStates if user change delivery type
        // ------------------------------------------------------------

        // ADHOC || SCHEDULED
        if (this.createStoreForm.get('step3').get('deliveryType').value === "ADHOC" || this.createStoreForm.get('step3').get('deliveryType').value === "SCHEDULED") {

            // push to allowedSelfDeliveryStates (form)
            this.allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates') as FormArray;
            // since backend give full discount tier list .. (not the only one that have been created only)
            this.allowedSelfDeliveryStates.clear();
            
            // re populate items
            this._allowedSelfDeliveryStates.forEach(item => {
                this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
            });

            if (this.createStoreForm.get('step3').get('deliveryType').value === "SCHEDULED") {
                // Set validation of deliveryPeriods to some null to initially set required value
                this.createStoreForm.get('step3').get('deliveryPeriods').get('validation').patchValue("");
            }

        } else {

            // SELF
            // push to allowedSelfDeliveryStates (form)
            this.allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates') as FormArray;
            // since backend give full discount tier list .. (not the only one that have been created only)
            this.allowedSelfDeliveryStates.clear();

            this._allowedSelfDeliveryStates = [
                { deliveryStates: "", deliveryCharges:"" }
            ];
            
            this._allowedSelfDeliveryStates.forEach(item => {
                this.allowedSelfDeliveryStates = this.createStoreForm.get('step3').get('allowedSelfDeliveryStates') as FormArray;
                this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
            });

            let deliveryPeriods = this.createStoreForm.get('step3').get('deliveryPeriods').get('values') as FormArray;
            
            deliveryPeriods['controls'].forEach(item => {
                item['controls'].enabled.patchValue(false);                
            }); 
            
            // Set validation of deliveryPeriods to some value to disable required value
            this.createStoreForm.get('step3').get('deliveryPeriods').get('validation').patchValue("not required");
        }
                
        // then check it again and set if there's an error
        if (this.deliveryPartners.length < 1 && this.createStoreForm.get('step3').get('deliveryType').value !== "SELF"){
            this.createStoreForm.get('step3').get('deliveryType').setErrors({noDeliveryPartners: true});            
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
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
        
        let maxSize = 1048576;
        var maxSizeInMB = (maxSize / (1024*1024)).toFixed(2);        

        if (this.files[index].selectedFiles[0].size > maxSize ){
            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Image size limit',
                message: 'Your uploaded image exceeds the maximum size of ' + maxSizeInMB + ' MB!',
                icon: {
                    show: true,
                    name: "image_not_supported",
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

    deleteLogo() {
        this.files[0].toDelete = true;        
        this.files[0].fileSource = null;
        this.files[0].selectedFiles = null;
        this._changeDetectorRef.markForCheck();
    }

    deleteFavicon(){
        this.files[3].toDelete = true;        
        this.files[3].fileSource = null;
        this.files[3].selectedFiles = null;
        this._changeDetectorRef.markForCheck();
    }

    deleteCoverImage(){
        this.files[4].toDelete = true;        
        this.files[4].fileSource = null;
        this.files[4].selectedFiles = null;
        this._changeDetectorRef.markForCheck();
    }

    // deletefiles(index: number) { 
    //     this.files[index].toDelete = true;
    //     this.files[index].fileSource = '';
    //     this.files[index].selectedFiles = '';

    //     this._changeDetectorRef.markForCheck();
    // }

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

        if (startTime.timeAmPm === "PM" && startTime.timeHour !== "12") {
            _startTime = parseInt(startTime.timeHour) + 12;
        } else if (startTime.timeAmPm === "AM" && startTime.timeHour === "12") {
            _startTime = parseInt(startTime.timeHour) - 12;
        } else {
            _startTime = startTime.timeHour;
        }

        const workingHourStartTime = new Date();
        workingHourStartTime.setHours(_startTime,startTime.timeMinute,0);

        //Working Hour End Time
        let endTime = this.createStoreForm.get('step4').get('storeTiming').value[i].closeTime;
        let _endTime;
    
        if (endTime.timeAmPm === "PM" && endTime.timeHour !== "12") {
            _endTime = parseInt(endTime.timeHour) + 12;
        } else if (endTime.timeAmPm === "AM" && endTime.timeHour === "12") {
            _endTime = parseInt(endTime.timeHour) - 12;
        } else {
            _endTime = endTime.timeHour;
        }

        const workingHourEndTime = new Date();
        workingHourEndTime.setHours(_endTime,endTime.timeMinute,0);
        
        //working Hour Display Error
        if( workingHourStartTime >= workingHourEndTime ){            
            this.timeAlert[i] ="End time range incorrect" ;
            this.invalidTime = true;
        }else{
            this.timeAlert[i] = " " ;
            this.invalidTime = false;
        }      
    }

    changeBreakTime(i, type , e){
        //Break Hour Start Time
        let breakStartTime = this.createStoreForm.get('step4').get('storeTiming').value[i].breakStartTime;
        let _breakStartTime;

        if (breakStartTime.timeAmPm === "PM" && breakStartTime.timeHour !== "12") {
            _breakStartTime = parseInt(breakStartTime.timeHour) + 12;
        } else if (breakStartTime.timeAmPm === "AM" && breakStartTime.timeHour === "12") {
            _breakStartTime = parseInt(breakStartTime.timeHour) - 12;
        } else {
            _breakStartTime = breakStartTime.timeHour;
        }

        const breakHourStartTime = new Date();
        breakHourStartTime.setHours(_breakStartTime,breakStartTime.timeMinute,0);

        //Break hour End Time
        let breakEndTime = this.createStoreForm.get('step4').get('storeTiming').value[i].breakEndTime;
        let _breakEndTime;
    
        if (breakEndTime.timeAmPm === "PM" && breakEndTime.timeHour !== "12") {
            _breakEndTime = parseInt(breakEndTime.timeHour) + 12;
        } else if (breakEndTime.timeAmPm === "AM" && breakEndTime.timeHour === "12") {
            _breakEndTime = parseInt(breakEndTime.timeHour) - 12;
        } else {
            _breakEndTime = breakEndTime.timeHour;
        }

        const breakHourEndTime = new Date();
        breakHourEndTime.setHours(_breakEndTime,breakEndTime.timeMinute,0);

        //Display Error
        if( breakHourStartTime >= breakHourEndTime ){
            this.timeAlert[i] ="Break Hour End time range incorrect" ;
            this.invalidTime = true;
        }else{
            this.timeAlert[i] = " " ;
            this.invalidTime = false;
        }      
    }

     //Always Open Checkbox

    toggleAlwaysOpen(event){

        this.isAlwaysOpen = false;

        let storeTiming = this.createStoreForm.get('step4').get('storeTiming').value;
        
        let _storeTiming = storeTiming.map(item => {
            let updateItem = {
                isOpen: true,
                isOff: false,
                openTime: {
                    timeAmPm: "AM",
                    timeHour: "12",
                    timeMinute: "00",
                },
                closeTime: {
                    timeAmPm: "PM",
                    timeHour: "11",
                    timeMinute: "55",
                },
                isBreakTime: false

            }
            let newItem = {...item, ...updateItem};
            return newItem            
        });
        this.createStoreForm.get('step4').get('storeTiming').patchValue(_storeTiming);
    }
   
    // Quil editor text limit
    textChanged($event) {
        const MAX_LENGTH = 500;
        if ($event.editor.getLength() > MAX_LENGTH) {
           $event.editor.deleteText(MAX_LENGTH, $event.editor.getLength());
        }
    }

    checkDeliveryPeriodsFulfilment() {

        // will give array of checked item
        let deliveryPeriodItems = this.deliveryPeriods.value.map(item => {
            if (item.enabled === true) {
                return item;
            }
        });        

        // remove empty value from array
        deliveryPeriodItems = deliveryPeriodItems.filter(n => n);

        // if this value -1, than all the checked deliveryProviders > 1
        let findEmptyDeliveryProviders = deliveryPeriodItems.findIndex(item => item.deliveryProviders.length < 1);

        if (deliveryPeriodItems.length > 0) {            
            if (findEmptyDeliveryProviders < 0) {
                // this.storeDeliveryForm.get('deliveryPeriods').get('validation').setErrors(null);
                this.createStoreForm.get('step3').get('deliveryPeriods').get('validation').patchValue("validated");
            } else {
                this.createStoreForm.get('step3').get('deliveryPeriods').get('validation').patchValue("noDeliveryPeriod");
            }
        } else {            
            // this.storeDeliveryForm.get('deliveryPeriods').get('validation').setErrors({requiredAtLeastOne: true});
            this.createStoreForm.get('step3').get('deliveryPeriods').get('validation').patchValue(null);
        }
    }

    private setInitialValue() {
        this.filteredCities
            .pipe(take(1), takeUntil(this._onDestroy))
            .subscribe(() => {
                this.stateCitySelector.compareWith = (a: any, b: any) => a === b;
            });
    }

    toggleCustomDomain() {
        if (!this.customDomain) {
            this.createStoreForm.get('step1').get('subdomain').setValidators([Validators.required, Validators.minLength(4), Validators.maxLength(63), RegisterStoreValidationService.domainValidator]);
            this.createStoreForm.get('step1').get('subdomain').updateValueAndValidity();
        }
        else {
            this.createStoreForm.get('step1').get('subdomain').setValidators([Validators.required, Validators.minLength(4), Validators.maxLength(63), RegisterStoreValidationService.customDomainValidator]);
            this.createStoreForm.get('step1').get('subdomain').updateValueAndValidity();
        }
        this.createStoreForm.get('step1').get('subdomain').markAsTouched({onlySelf: true});
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
}