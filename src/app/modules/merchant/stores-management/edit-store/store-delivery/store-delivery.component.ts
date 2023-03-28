import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StoresService } from 'app/core/store/store.service';
import { EditStoreValidationService } from 'app/modules/merchant/stores-management/edit-store/edit-store.validation.service';
import { Store, StoreRegionCountries, CreateStore, StoreAssets, StoreSelfDeliveryStateCharges, StoreDeliveryDetails, StoreDeliveryProvider, StoreDeliveryPeriod } from 'app/core/store/store.types';
import { ChooseVerticalService } from '../../choose-vertical/choose-vertical.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Loader } from '@googlemaps/js-api-loader';
import { BehaviorSubject, debounceTime, map, Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { GoogleKey } from '../edit-store.types';
import { MatSelect } from '@angular/material/select';
import { City } from './store-delivery.types';
import { StoresDeliveryService } from './store-delivery.service';
import { environment } from 'environments/environment';



@Component({
    selector       : 'store-delivery',
    templateUrl    : './store-delivery.component.html',
    styles :[`
        .map {
            width: 50vw;
            height: 50vh;
        }
        #pac-input {
            background-color: #fff;
            font-family: Roboto;
            font-size: 15px;
            font-weight: 300;
            margin-left: 12px;
            padding: 0 11px 0 13px;
            text-overflow: ellipsis;
            width: 400px;
        }
        
        #pac-input:focus {
            border-color: #4d90fe;
        }
        
        .pac-controls {
            padding: 5px 11px;
            display: inline-block;
        }
        
        .pac-controls label {
            font-family: Roboto;
            font-size: 13px;
            font-weight: 300;
        }
    `],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreDeliveryComponent implements OnInit
{
    /** control for the selected bank for multi-selection */
    public regionCountryStateCities: FormControl = new FormControl();

    private _onDestroy = new Subject<void>();
    public filteredCities: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

    @ViewChild('stateCitySelector') stateCitySelector: MatSelect;
    
    storeDeliveryForm: FormGroup;
    
    store: Store;
    storeId: string;
    storeName: string;

    _deliveryPeriods: StoreDeliveryPeriod[] = [];
    deliveryPeriods: FormArray;

    deliveryFulfilment: any;
    deliveryPartners: StoreDeliveryProvider[] = [];
    deliveryPartnerTypes: any = [];
        
    _allowedSelfDeliveryStates: any = [];
    allowedSelfDeliveryStates: FormArray;

    storeStates: string[] = [];
    storeStateCities: string[] = [];
    storeStateCities$: Observable<City[]>;

    storeCountries: StoreRegionCountries[] = [];

    private map: google.maps.Map;

    @ViewChild('search')public searchElementRef!: ElementRef;
    location :any;

    // latitude!: any;
    // longitude!: any;
    center!: google.maps.LatLngLiteral;
    fullAddress:any='';
  
    displayLat:any;
    displayLong:any;

    //string interpolationdoesnt-update-on-eventListener hence need to use behaviour subject
    displayLatitude: BehaviorSubject<string> = new BehaviorSubject<string>('');
    displayLongtitude: BehaviorSubject<string> = new BehaviorSubject<string>('');

    //get current location
    currentLat:any=0;
    currentLong:any=0;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _storesService: StoresService,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _chooseVerticalService: ChooseVerticalService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _storeDeliveryService: StoresDeliveryService

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
        // navigator.geolocation.getCurrentPosition(success, error, options); 
        // Create the form
        this.storeDeliveryForm = this._formBuilder.group({
            serviceChargesPercentage    : [0],
            verticalCode                : [''],
            allowedSelfDeliveryStates   : this._formBuilder.array([]), // Allowed Self Delivery States
            deliveryType                : ['', Validators.required], // Delivery Provider
            deliverySpType              : [''], // Delivery Partner for adhoc
            deliveryPeriods          : this._formBuilder.group({ 
                values      : this._formBuilder.array([]),
                validation  : ['', EditStoreValidationService.requiredAtLeastOneValidator]
            }),
            // Else
            allowStorePickup            : [false],
            address                     : ['', Validators.required],
            city                        : ['', Validators.required],
            postcode                    : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), EditStoreValidationService.postcodeValidator]],
            regionCountryStateId        : ['', Validators.required],
            regionCountryId             : [{value: '', disabled: true}, Validators.required],
            isDelivery                  : [false]
        });

        this.setInitialValue();

        // set initial selection
        this.regionCountryStateCities.setValue([]);
        // load the initial bank list
        // this.filteredCities.next(this.cities.slice());

        this.regionCountryStateCities.valueChanges
            .pipe(takeUntil(this._onDestroy), debounceTime(300))
            .subscribe((result) => {                
                // Get states by country Z(using symplified backend)
                this._storeDeliveryService.getStoreRegionCountryStateCity(result, this.storeDeliveryForm.get('regionCountryStateId').value, this.store? this.store.regionCountry.id : '')
                .subscribe((response)=>{
                    // Get the products
                    this.storeStateCities$ = this._storeDeliveryService.cities$;                     

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            });

        this.storeDeliveryForm.get('regionCountryStateId').valueChanges
            .pipe(takeUntil(this._onDestroy), debounceTime(300))
            .subscribe((result) => {
                
                if (this.store.regionCountryStateId !== result) {
                    // reset city form
                    this.storeDeliveryForm.get('city').patchValue(null);
                }

                // Get states by country Z(using symplified backend)
                this._storeDeliveryService.getStoreRegionCountryStateCity(null,this.storeDeliveryForm.get('regionCountryStateId').value, this.store? this.store.regionCountry.id : '')
                .subscribe((response)=>{
                    // Get the products
                    this.storeStateCities$ = this._storeDeliveryService.cities$;                    

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            });

        //to implement get current location first to be display if in db is null
        navigator.geolocation.getCurrentPosition((position) => {
            var crd = position.coords;
            this.currentLat = crd.latitude;
            this.currentLong= crd.longitude;

        })
                 
        this.deliveryFulfilment = [
            { selected: false, option: "INSTANT_DELIVERY", label: "Instant Delivery", tooltip: "This store supports instant delivery. (Provided by store's own logistic or delivery partners)" }, 
            { selected: false, option: "REGULAR_DELIVERY", label: "Regular Delivery", tooltip: "This store supports regular delivery. (Provided by store's own logistic or delivery partners)" },
            { selected: false, option: "SCHEDULED_DELIVERY", label: "Scheduled Delivery", tooltip: "This store allows scheduled delivery request from customer" },
            { selected: false, option: "STORE_PICKUP", label: "Allow Store Pickup", tooltip: "This store allows customers to pick item from store" }
        ];

        this.storeId = this._route.snapshot.paramMap.get('storeid');

        this._storesService.getStoreById(this.storeId)
            .subscribe((storeResponse) => {

                this.store = storeResponse;

                // set store to current store
                this._storesService.store = storeResponse;
                this._storesService.storeId = this.storeId;

                // Fill the form
                this.storeDeliveryForm.patchValue(storeResponse);

                // ----------------------
                // Get Store Delivery Providers
                // ----------------------

                // Reason why we put de under get vertical code by paramMap is because
                // we need the verticalCode before we need to query getStoreDeliveryProvider which require verticalCode

                let _verticalCode = this.storeDeliveryForm.get('verticalCode').value;
                let _regionCountryId = this.storeDeliveryForm.get('regionCountryId').value;
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
                        this.deliveryPeriods = this.storeDeliveryForm.get('deliveryPeriods').get('values') as FormArray;

                        // check changes
                        this.checkDeliveryPartner();
                        
                        // -------------------------------------
                        // delivery period Fulfilment
                        // -------------------------------------

                        this._storesService.getDeliveryPeriod(this.storeId)
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

                                    // this.deliveryPeriods = this.storeDeliveryForm.get('deliveryPeriods').get('values') as FormArray;
                                    
                                    // attacted delivery provider to delivery period
                                    this.deliveryPeriods.push(this._formBuilder.group(item));
                                    
                                    // Set validation of deliveryPeriods to some null to initially set required value
                                    this.storeDeliveryForm.get('deliveryPeriods').get('validation').patchValue("value-detected");

                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                });
                            
                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                        });

                        //======================== Iinsert google maps =========================
                        //if db got null then we need to set the curren location so that it will display the google maps instead of hardcode the value of katitutde and lontitude
                        if (this.store.latitude === null){
                       
                                this.displayLat = this.currentLat;
                                this.displayLong = this.currentLong;

                                this.displayLatitude.next(this.displayLat.toString());
                                this.displayLongtitude.next(this.displayLong.toString());

                        } else {

                            this.displayLat = parseFloat(this.store.latitude ? this.store.latitude : '0');
                            this.displayLong = parseFloat(this.store.longitude ? this.store.longitude : '0');
                            this.displayLatitude.next(this.store.latitude);
                            this.displayLongtitude.next(this.store.longitude);

                        }
                        
                        // Load map if isDelivery true
                        if (this.storeDeliveryForm.get('isDelivery').value === true) {
                            setTimeout(() => {
                                this.loadMap();
                            }, 1000);
                        }

                        // // Load map if isDelivery becomes true
                        // this.storeDeliveryForm.get('isDelivery').valueChanges
                        // .pipe(
                        //     debounceTime(100),
                        //     takeUntil(this._unsubscribeAll),
                        // )
                        // .subscribe((value) => {
                        //     if (value === true) {
                        //         this.loadMap();
                        //     }
                        // });
                        
                        

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });

                // ----------------------
                // Get Current Store Delivery Provider
                // ----------------------

                this._storesService.getStoreRegionCountryDeliveryProvider(this.storeId)
                    .subscribe((response: StoreDeliveryProvider[]) => {
                        
                        let _deliverySpType = response.length > 0 ? response[0].deliverySpTypeId + "" : "";
                        
                        this.storeDeliveryForm.get('deliverySpType').patchValue(_deliverySpType);

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });

                // -------------------------------------
                // store delivery details
                // -------------------------------------

                this._storesService.getStoreDeliveryDetails(this.storeId).subscribe(
                    (response: StoreDeliveryDetails) => {

                        let _deliveryType = response ? response.type : "";
                        let _allowsStorePickup = response ? response.allowsStorePickup : "";

                        this.storeDeliveryForm.get('deliveryType').patchValue(_deliveryType);
                        this.storeDeliveryForm.get('allowStorePickup').patchValue(_allowsStorePickup);

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }
                );

                // -------------------------------------
                // store allowed self delivery states
                // -------------------------------------
                
                this._storesService.getSelfDeliveryStateCharges(this.storeId)
                    .subscribe((response: StoreSelfDeliveryStateCharges[]) => {
                        
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

                        this.allowedSelfDeliveryStates = this.storeDeliveryForm.get('allowedSelfDeliveryStates') as FormArray;

                        // since backend give full discount tier list .. (not the only one that have been created only)
                        this.allowedSelfDeliveryStates.clear();

                        this._allowedSelfDeliveryStates.forEach(item => {
                            this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
                        });                        

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });

                // Get allowed store countries 
                // this only to get list of country in symplified backend
                this._storesService.storeRegionCountries$
                    .subscribe((response: StoreRegionCountries[])=>{
                        response.forEach((country: StoreRegionCountries) => {
                            this.storeCountries.push(country);

                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                        });
                    });
                    
                let symplifiedCountryId = this.storeDeliveryForm.get('regionCountryId').value;
                let symplifiedCountryStateId = this.storeDeliveryForm.get('regionCountryStateId').value;

                    
                // state (using component variable)
                // INITIALLY (refer below section updateStates(); for changes), get states from symplified backed by using the 3rd party api
                
                // Get states by country Z(using symplified backend)
                this._storesService.getStoreRegionCountryState(symplifiedCountryId)
                    .subscribe((response)=>{
                        this.storeStates = response.data.content; 

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });

                // Get city by state
                this._storeDeliveryService.getStoreRegionCountryStateCity(null,symplifiedCountryStateId, this.store? this.store.regionCountry.id : '')
                    .subscribe((response)=>{
                        // Get the products
                        this.storeStateCities$ = this._storeDeliveryService.cities$;    
                        
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });

                // country (using form builder variable)
                // this.editStoreForm.get('regionCountryId').patchValue(symplifiedCountryId.toUpperCase());
                
                // Mark for check
                this._changeDetectorRef.markForCheck();

            });

    
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

    ngAfterViewInit(): void
    {
        // setTimeout(() => {
        //     // this way , we keep _originalAllowedSelfDeliveryStates integrity
        // }, 0);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    checkDeliveryPartner(){
        
        // on every change set error to false first (reset state)
        if (this.storeDeliveryForm.get('deliveryType').errors || this.storeDeliveryForm.get('deliverySpType').errors){
            this.storeDeliveryForm.get('deliverySpType').setErrors(null);
        }
        
        // -----------------------------------
        // reset allowedSelfDeliveryStates if user change delivery type
        // -----------------------------------
        
        // ADHOC || SCHEDULED
        if (this.storeDeliveryForm.get('deliveryType').value === "ADHOC" || this.storeDeliveryForm.get('deliveryType').value === "SCHEDULED") {

            // push to allowedSelfDeliveryStates (form)
            this.allowedSelfDeliveryStates = this.storeDeliveryForm.get('allowedSelfDeliveryStates') as FormArray;
            // since backend give full discount tier list .. (not the only one that have been created only)
            this.allowedSelfDeliveryStates.clear();
            
            // re populate items
            this._allowedSelfDeliveryStates.forEach(item => {
                this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
            });

            if (this.storeDeliveryForm.get('deliveryType').value === "SCHEDULED") {
                // Set validation of deliveryPeriods to some null to initially set required value
                this.storeDeliveryForm.get('deliveryPeriods').get('validation').patchValue("");
            }

        } else {

            // SELF
            // push to allowedSelfDeliveryStates (form)
            this.allowedSelfDeliveryStates = this.storeDeliveryForm.get('allowedSelfDeliveryStates') as FormArray;
            // since backend give full discount tier list .. (not the only one that have been created only)
            this.allowedSelfDeliveryStates.clear();
            
            this._allowedSelfDeliveryStates.forEach(item => {
                this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
            });

            let deliveryPeriods = this.storeDeliveryForm.get('deliveryPeriods').get('values') as FormArray;
            
            deliveryPeriods['controls'].forEach(item => {
                item['controls'].enabled.patchValue(false);                
            }); 
            
            // Set validation of deliveryPeriods to some value to disable required value
            this.storeDeliveryForm.get('deliveryPeriods').get('validation').patchValue("not required");
        }
                
        // check for ADHOC
        if (this.storeDeliveryForm.get('deliveryType').value === "ADHOC") {

            if (this.deliveryPartners.length < 1) {
                this.storeDeliveryForm.get('deliveryType').setErrors({noDeliveryPartners: true});
            }

            if (!this.storeDeliveryForm.get('deliverySpType').value) {
                this.storeDeliveryForm.get('deliverySpType').setErrors({required:true});
            }
            this.storeDeliveryForm.get('deliveryPeriods').get('validation').patchValue("not-required");

        }

        // check for SCHEDULED
        if (this.storeDeliveryForm.get('deliveryType').value === "SCHEDULED") {
            // Set validation of deliveryPeriods to some null to initially set required value
            this.storeDeliveryForm.get('deliveryPeriods').get('validation').patchValue("");
        }

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
        this.allowedSelfDeliveryStates = this.storeDeliveryForm.get('allowedSelfDeliveryStates') as FormArray;
        this.allowedSelfDeliveryStates.push(this._formBuilder.group(selfDeliveryStateItem));
    }

    removeSelfDeliveryState(index: number) {
        this._allowedSelfDeliveryStates.splice(index,1);

        // push to allowedSelfDeliveryStates (form)
        this.allowedSelfDeliveryStates = this.storeDeliveryForm.get('allowedSelfDeliveryStates') as FormArray;
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
        this.allowedSelfDeliveryStates = this.storeDeliveryForm.get('allowedSelfDeliveryStates') as FormArray;
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
    * Send the form
    */
    updateStoreDelivery(): void
    {

        // this will remove the item from the object
        const { allowedSelfDeliveryStates, allowStorePickup, deliveryPeriods,
                address, city, postcode, regionCountryStateId, regionCountryId,
                deliveryType, deliverySpType, storeTiming, isDelivery, ...storeDeliveryBody } = this.storeDeliveryForm.value;
  
        // this.editStoreForm.disable();

        let storeId = this.storeId;

        // ---------------------------
        // Update store Delivery Address
        // ---------------------------        

        let storeBody = this.store;
        storeBody.address = address;
        storeBody.city = city;
        storeBody.postcode = postcode;
        storeBody.regionCountryStateId = regionCountryStateId;
        storeBody.regionCountryId = regionCountryId;
        storeBody.latitude = this.location.lat.toFixed(6);
        storeBody.longitude = this.location.lng.toFixed(6);
        storeBody.isDelivery = isDelivery;
        
        this._storesService.update(storeId, storeBody)
            .subscribe(()=>{

            });

        // ---------------------------
        // Update Store Provider
        // ---------------------------

        let _itemType;
        let _deliveryType;
        if (this.storeDeliveryForm.get('verticalCode').value === "E-Commerce" || this.storeDeliveryForm.get('verticalCode').value === "e-commerce-b2b2c" || this.storeDeliveryForm.get('verticalCode').value === "ECommerce_PK") {
            // this is actually handled by front end (but incase of hacking)
            if (deliveryType === "SELF") { 
                _itemType = null;
                _deliveryType = deliveryType;
            } else {
                _itemType="PARCEL";
                _deliveryType = "SCHEDULED";
                console.warn("E-Commerce deliveryType should be SCHEDULED. Current selected deliveryType " + deliveryType) 
            } 
        } else if (this.storeDeliveryForm.get('verticalCode').value === "FnB" || this.storeDeliveryForm.get('verticalCode').value === "FnB_PK") {
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

        if (this.storeDeliveryForm.get('deliveryType').value !== "") {
            this._storesService.putStoreDeliveryDetails(this.storeId, deliveryDetailBody)
                .subscribe((response) => { 

                });
        } else {
            this._storesService.postStoreDeliveryDetails(this.storeId, deliveryDetailBody)
                .subscribe((response) => {

                });
        }

        // ---------------------------
        // Provision SELF 
        // ---------------------------

        if (this.storeDeliveryForm.get('deliveryType').value === "SELF") {
            // Delete All State Delivery Charges
            this._storesService.deleteAllSelfDeliveryStateCharges(this.storeId)
                .subscribe((response) => {

                    let allowedSelfDeliveryStatesBody = allowedSelfDeliveryStates.map(item => {
                        return {
                            region_country_state_id: item.deliveryStates,
                            delivery_charges: item.deliveryCharges
                        }
                    });
                    
                    // Create State Delivery Charges
                    this._storesService.postBulkSelfDeliveryStateCharges(this.storeId, allowedSelfDeliveryStatesBody)
                        .subscribe((response) => {
                        });
                });
        }

        // ---------------------------
        // Provision ADHOC 
        // ---------------------------

        if (this.storeDeliveryForm.get('deliveryType').value === "ADHOC") {
            this._storesService.deleteStoreRegionCountryDeliveryProviderAll(this.storeId)
                .subscribe(() => {
                    let index = this.deliveryPartners.findIndex(item => item.id === deliverySpType);

                    if (index > -1){
                        this._storesService.postStoreRegionCountryDeliveryProvider(this.storeId, this.deliveryPartners[index].deliverySpId, this.deliveryPartners[index].fulfilment, this.deliveryPartners[index].id)
                            .subscribe((response) => {
                                
                            });
                    } else {
                        console.error("Provision ADHOC delivery failed")
                    }
                });
        }

        // ---------------------------
        // Provision SCHEDULED
        // ---------------------------

        if (this.storeDeliveryForm.get('deliveryType').value === "SCHEDULED") {
            this._storesService.postDeliveryPeriod(this.storeId, deliveryPeriods.values)
                .subscribe(()=>{

                });
        }

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

        // Navigate to the confirmation required page
        // this._router.navigateByUrl('/stores');

    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    updateStates(countryId: string){

        // reset current regionCountryStateId
        this.storeDeliveryForm.get('regionCountryStateId').patchValue("");

        // this.storeDeliveryForm.get('city').patchValue("");

        // Get states by country (using symplified backend)
        this._storesService.getStoreRegionCountryState(countryId).subscribe((response)=>{
            this.storeStates = response.data.content;
        });

        // Mark for check
        this._changeDetectorRef.markForCheck();
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
                this.storeDeliveryForm.get('deliveryPeriods').get('validation').patchValue("validated");
            } else {
                this.storeDeliveryForm.get('deliveryPeriods').get('validation').patchValue("noDeliveryPeriod");
            }
        } else {            
            // this.storeDeliveryForm.get('deliveryPeriods').get('validation').setErrors({requiredAtLeastOne: true});
            this.storeDeliveryForm.get('deliveryPeriods').get('validation').patchValue(null);
        }
    }

    validateForm() {     
        // Do nothing if the form is invalid
        let BreakException = {};
        try {
            Object.keys(this.storeDeliveryForm.get('deliveryPeriods')['controls'].get('validation')['controls']).forEach(key => {
                const controlErrors: ValidationErrors = this.storeDeliveryForm.get(key).errors;
                if (controlErrors != null) {
                    Object.keys(controlErrors).forEach(keyError => {
                        console.error({
                            type   : 'error',
                            message: 'Field ' + key + ' error: ' + keyError
                        });
                        throw BreakException;
                    });
                }
            });
        } catch (error) {
            return;
        }
    }

    private setInitialValue() {
        this.filteredCities
            .pipe(take(1), takeUntil(this._onDestroy))
            .subscribe(() => {
                this.stateCitySelector.compareWith = (a: any, b: any) => a === b;
            });
    }

    enableDelivery(value) {
        if (value === true) {
            setTimeout(() => {
                this.loadMap();
            }, 1000);
        }
    }
    
    loadMap() {
        // implement google maos
        let loader = new Loader({
            apiKey: environment.googleMapsAPIKey,
            libraries: ['places']
            
            })

        this.location = {
            lat: this.displayLat,
            lng: this.displayLong,
        };
        loader.load().then(() => {
            
            this.map = new google.maps.Map(document.getElementById("map"), {
                center: this.location,
                zoom: 15,
                mapTypeControl:false,
                streetViewControl:false,//Removing the pegman from map
                // styles: styles,
                mapTypeId: "roadmap",
                gestureHandling: "cooperative"
            })
    
            const initialMarker = new google.maps.Marker({
            position: this.location,
            map: this.map,
            });

            //use for when user mark other location
            let markers: google.maps.Marker[] = [];
            
            // Configure the click listener.
            this.map.addListener("click", (event) => {
                this.storeDeliveryForm.markAsDirty();

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
            geocoder = new google.maps.Geocoder();
            relocatebutton.addEventListener("click", (e) =>{
                geocoder
                .geocode({ address: this.storeDeliveryForm.get('address').value})
                .then((result) => {
                    const { results } = result;
        
                    //to be display coordinate
                    let coordinateAddressStringify = JSON.stringify(results[0].geometry.location);
                    let coordinateAddressParse = JSON.parse(coordinateAddressStringify);
        
                    this.location = {
                    lat: coordinateAddressParse.lat,
                    lng: coordinateAddressParse.lng,
                    };

                    //to display for location code
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

    }
}
