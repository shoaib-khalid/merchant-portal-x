import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Locale } from 'app/core/locale/locale.types';
import { LocaleService } from 'app/core/locale/locale.service';
import { StoresService } from 'app/core/store/store.service';
import { RegisterStoreValidationService } from 'app/modules/merchant/stores-management/register-store/register-store.validation.service';
import { Store, StoreRegionCountries, CreateStore, StoreAssets, StoreSelfDeliveryStateCharges, StoreDeliveryDetails, StoreDeliveryProvider } from 'app/core/store/store.types';
import { ChooseVerticalService } from '../../choose-vertical/choose-vertical.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';


@Component({
    selector       : 'store-delivery',
    templateUrl    : './store-delivery.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreDeliveryComponent implements OnInit
{
    storeDeliveryForm: FormGroup;
    
    storeId: string;
    storeName: string;

    deliveryFullfilment: any;
    deliveryPartners: any = [];
    hasDeliveryPartnerError: boolean = true;

    storeDeliveryProvider: StoreDeliveryProvider[] = [];
    
    _allowedSelfDeliveryStates: any = [];
    allowedSelfDeliveryStates: FormArray;

    storeStates: string[] = [];
    storeCountries: StoreRegionCountries[] = [];

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _storesService: StoresService,
        private _route: ActivatedRoute,
        private _localeService: LocaleService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _chooseVerticalService: ChooseVerticalService,
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
        this.storeDeliveryForm = this._formBuilder.group({
            serviceChargesPercentage    : [0],
            verticalCode                : [''],
            // Allowed Self Delivery States
            allowedSelfDeliveryStates   : this._formBuilder.array([]),
            // Delivery Provider
            deliveryType                : ['', Validators.required],
            // Delivery Partner
            deliveryPartner             : ['', Validators.required],
            // Else
            allowScheduledDelivery      : [false],
            allowStorePickup            : [false],
            address                     : ['', Validators.required],
            city                        : ['', Validators.required],
            postcode                    : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), RegisterStoreValidationService.postcodeValidator]],
            regionCountryStateId        : ['', Validators.required],
            regionCountryId             : ['', Validators.required],
        });
        
        this.deliveryFullfilment = [
            { selected: false, option: "INSTANT_DELIVERY", label: "Instant Delivery", tooltip: "This store support instant delivery. (Provided by store own logistic or delivery partners)" }, 
            { selected: false, option: "REGULAR_DELIVERY", label: "Regular Delivery", tooltip: "This store support regular delivery. (Provided by store own logistic or delivery partners)" },
            { selected: false, option: "SCHEDULED_DELIVERY", label: "Scheduled Delivery", tooltip: "This store allow scheduled delivery request from customer" },
            { selected: false, option: "STORE_PICKUP", label: "Allow Store Pickup", tooltip: "This store allow customer to pick up item from store" }
        ];

        this.storeId = this._route.snapshot.paramMap.get('storeid');

        this._storesService.getStoreById(this.storeId)
            .subscribe((storeResponse) => {

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


                this._storesService.getStoreDeliveryProvider({deliveryType: _deliveryType, regionCountryId: _regionCountryId})
                    .subscribe((response: StoreDeliveryProvider[]) => {
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

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });

                // ----------------------
                // Get Current Store Delivery Provider
                // ----------------------

                this._storesService.getStoreRegionCountryDeliveryProvider(this.storeId)
                    .subscribe((response: StoreDeliveryProvider[]) => {

                        this.storeDeliveryProvider = response;
                        
                        let _deliverySpId = response.length > 0 ? response[0].deliverySpId : "";
                        this.storeDeliveryForm.get('deliveryPartner').patchValue(_deliverySpId);

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

                        this._allowedSelfDeliveryStates.forEach(item => {
                            this.allowedSelfDeliveryStates = this.storeDeliveryForm.get('allowedSelfDeliveryStates') as FormArray;
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
                    
                // state (using component variable)
                // INITIALLY (refer below section updateStates(); for changes), get states from symplified backed by using the 3rd party api
                
                // Get states by country Z(using symplified backend)
                this._storesService.getStoreRegionCountryState(symplifiedCountryId).subscribe((response)=>{
                    
                    this.storeStates = response.data.content; 

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });

                // country (using form builder variable)
                // this.editStoreForm.get('regionCountryId').patchValue(symplifiedCountryId.toUpperCase());
                
                // Mark for check
                this._changeDetectorRef.markForCheck();

            });
    }

    ngAfterViewInit(): void
    {
        setTimeout(() => {
            // this way , we keep _originalAllowedSelfDeliveryStates integrity
        }, 0);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    checkDeliveryPartner(){
        // on every change set error to false first (reset state)
        if (this.storeDeliveryForm.get('deliveryType').errors || this.storeDeliveryForm.get('deliveryPartner').errors){
            this.hasDeliveryPartnerError = false; 
        }
        
        // -----------------------------------
        // reset allowedSelfDeliveryStates if user change delivery type
        // -----------------------------------
        
        if (this.storeDeliveryForm.get('deliveryType').value === "SELF") {
            
            // push to allowedSelfDeliveryStates (form)
            this.allowedSelfDeliveryStates = this.storeDeliveryForm.get('allowedSelfDeliveryStates') as FormArray;
            // since backend give full discount tier list .. (not the only one that have been edited only)
            this.allowedSelfDeliveryStates.clear();
            
            // re populate items
            this._allowedSelfDeliveryStates.forEach(item => {
                this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
            });
        }
        
        // then check it again and set if there's an error
        if (this.deliveryPartners.length < 1 && this.storeDeliveryForm.get('deliveryType').value !== "SELF"){
            this.storeDeliveryForm.get('deliveryType').setErrors({noDeliveryPartners: true})
        }
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

        if(this.hasDeliveryPartnerError === false) {
            this.storeDeliveryForm.get('deliveryPartner').setErrors(null);
        }

        // this will remove the item from the object
        const { allowedSelfDeliveryStates, allowScheduledDelivery, allowStorePickup, 
            deliveryType, deliveryPartner, storeTiming, ...storeDeliveryBody } = this.storeDeliveryForm.value;
  
        // this.editStoreForm.disable();

        let storeId = this.storeId;

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

        if (this.storeDeliveryForm.get('deliveryType').value === "SELF") {

            // ---------------------------
            // Delete All State Delivery Charges
            // ---------------------------

            this._storesService.deleteAllSelfDeliveryStateCharges(this.storeId)
                .subscribe((response) => {

                    // ---------------------------
                    // Create State Delivery Charges
                    // ---------------------------

                    let allowedSelfDeliveryStatesBody = allowedSelfDeliveryStates.map(item => {
                        return {
                            region_country_state_id: item.deliveryStates,
                            delivery_charges: item.deliveryCharges
                        }
                    });

                    this._storesService.postBulkSelfDeliveryStateCharges(this.storeId, allowedSelfDeliveryStatesBody)
                        .subscribe((response) => {
                        });
                });
        }

        if (this.storeDeliveryForm.get('deliveryType').value === "ADHOC") {

            // ---------------------------
            // Provision ADHOC Delivery Provider
            // ---------------------------

            this._storesService.deleteStoreRegionCountryDeliveryProviderAll(this.storeId).subscribe(() => {
                this._storesService.postStoreRegionCountryDeliveryProvider(this.storeId, this.storeDeliveryForm.get('deliveryPartner').value)
                    .subscribe((response) => {
                        
                    });
            })
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
                    label: 'Ok',
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

        // Get states by country (using symplified backend)
        this._storesService.getStoreRegionCountryState(countryId).subscribe((response)=>{
            this.storeStates = response.data.content;
        });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
}
