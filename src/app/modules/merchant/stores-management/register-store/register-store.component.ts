import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
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

    invalidVertical: boolean = true;

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

    // display error
    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };
    isError: boolean = false;
    
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
        this.createStoreForm = this._formBuilder.group({
            // Main Store Section
            name               : ['', Validators.required],
            city               : ['', Validators.required],
            address            : ['', Validators.required],
            postcode           : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), RegisterStoreValidationService.postcodeValidator]],
            storeDescription   : ['', [Validators.required, Validators.maxLength(100)]],
            email              : ['', [Validators.required, Validators.email]],
            clientId           : [''],
            subdomain             : ['',[Validators.required, Validators.minLength(4), Validators.maxLength(15), RegisterStoreValidationService.domainValidator]],
            regionCountryId: ['', Validators.required],
            regionCountryStateId: ['', Validators.required],
            phoneNumber        : ['', RegisterStoreValidationService.phonenumberValidator],
            serviceChargesPercentage: [0],
            verticalCode: [''],
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
                    this.invalidVertical = false;
                } else if ((_verticalCode === 'E-Commerece' || _verticalCode === 'e-commerce-b2b2c' || _verticalCode === 'FnB') && symplifiedCountryId === "MYS") {
                    this.invalidVertical = false;
                } else {
                    this.invalidVertical = true;
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
                this.createStoreForm.get('regionCountryId').patchValue(symplifiedCountryId.toUpperCase());
        
                // -------------------------------------
                // Delivery Partner
                // -------------------------------------
    
                let _regionCountryId = symplifiedCountryId.toUpperCase();
                let _deliveryType;

                if (_verticalCode === "FnB" || _verticalCode === "FnB_PK") {
                    _deliveryType = "ADHOC";
                } else if (_verticalCode === 'E-Commerece' || _verticalCode === 'e-commerce-b2b2c' || _verticalCode === 'ECommerce_PK') {
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
            { day: "Monday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true },
            { day: "Tuesday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true },
            { day: "Wednesday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true },
            { day: "Thursday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true },
            { day: "Friday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false, isOpen: true },
            { day: "Saturday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: true, isOpen: false },
            { day: "Sunday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: true, isOpen: false },
        ];

        this._storeTiming.forEach(item => {
            this.storeTiming = this.createStoreForm.get('storeTiming') as FormArray;
            this.storeTiming.push(this._formBuilder.group(item));
        });
        
        // -------------------------------------
        // store allowed self delivery states
        // -------------------------------------

        this._allowedSelfDeliveryStates = [
            { deliveryStates: "", deliveryCharges:"" }
        ];
        
        this._allowedSelfDeliveryStates.forEach(item => {
            this.allowedSelfDeliveryStates = this.createStoreForm.get('allowedSelfDeliveryStates') as FormArray;
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
    clearForm(): void
    {
        // Reset the form
        this.supportNgForm.resetForm();
    }

    /**
     * Send the form
     */
    sendForm(): void
    {
        // Do nothing if the form is invalid
        if ( this.createStoreForm.invalid )
        {
            this.alert = {
                type   : 'error',
                message: 'You need to fill in all the required fields'
            }
            this.isError = true;
            return;
        }

        // Hide the alert
        this.isError = false;

        // this will remove the item from the object
        const { allowedSelfDeliveryStates, allowScheduledDelivery, allowStorePickup, 
                deliveryType, deliveryPartner, storeTiming, subdomain
                ,...createStoreBody}  = this.createStoreForm.value;

        // add domain when sending to backend.. at frontend form call it subdomain
        createStoreBody["domain"] = subdomain + this.domainName;
            
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

                storeTiming.forEach(item => {
                    let { isOpen, ...filteredItem } = item;
                    this._storesService.postTiming(this.storeId, filteredItem)
                        .subscribe((response)=>{});
                });

                // ---------------------------
                // Create Store Assets
                // ---------------------------

                let _assets = {};
                const formData = new FormData();
                this.files.forEach(item =>{
                    console.log(item);
                    if (item.selectedFiles !== null){
                        formData.append(item.type,item.selectedFiles[0])
                    }
        
                    if (item.toDelete === true && item.type === 'logo'){
                        this._storesService.deleteAssetsLogo(this.storeId).subscribe();
                    }
                    if (item.toDelete === true && item.type === 'banner'){
                        this._storesService.deleteAssetsBanner(this.storeId).subscribe();
                    }
                });
                
                if (_assets) {
                    this._storesService.postAssets(this.storeId, formData).subscribe(
                      (event: any) => {
                        if (event instanceof HttpResponse) {
                          console.log('Uploaded the file successfully');
                        }
                      },
                      (err: any) => {
                          console.log('Could not upload the file');
                      });
                }

                // ---------------------------
                // Create Store Provider
                // ---------------------------

                let _itemType;
                let _deliveryType;
                if (this.createStoreForm.get('verticalCode').value === "E-Commerece" || this.createStoreForm.get('verticalCode').value === "e-commerce-b2b2c" || this.createStoreForm.get('verticalCode').value === "ECommerce_PK") {
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

                if (this.createStoreForm.get('deliveryType').value === "SELF") {

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

                if (this.createStoreForm.get('deliveryType').value === "ADHOC") {

                    // ---------------------------
                    // Provision ADHOC Delivery Provider
                    // ---------------------------

                    this._storesService.postStoreRegionCountryDeliveryProvider(this.storeId, this.createStoreForm.get('deliveryPartner').value)
                        .subscribe((response) => {
                            
                        });

                }

                // Navigate to the confirmation required page
                this._router.navigateByUrl('/stores');
            },
            (response) => {
                // Re-enable the form
                this.createStoreForm.enable();

                // Reset the form
                this.clearForm();

                // Set the alert
                this.alert = {
                    type   : 'error',
                    message: 'Something went wrong, please try again.'
                };
                
            });

        // Show a success message (it can also be an error message)
        // and remove it after 5 seconds
        this.alert = {
            type   : 'success',
            message: 'Your request has been delivered! A member of our support staff will respond as soon as possible.'
        };

        setTimeout(() => {
            this.alert = null;
        }, 7000);

        // Clear the form
        this.clearForm();
    }

    updateStates(countryId: string){

        // reset current regionCountryStateId
        this.createStoreForm.get('regionCountryStateId').patchValue("");

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
            this.createStoreForm.get('subdomain').setErrors({domainAlreadyTaken: true});
        }
    }
    
    async checkExistingName(name:string){
        let status = await this._storesService.getExistingName(name);
        if (status ===409){
            this.createStoreForm.get('name').setErrors({storeNameAlreadyTaken: true});
        }

    }

    updateStoreOpening(day: string){
        let index = this._storeTiming.findIndex(dayList => dayList.day === day);
        this._storeTiming[index].isOpen = !this._storeTiming[index].isOpen;
        this._storeTiming[index].isOff = !this._storeTiming[index].isOff;
    }

    addSelfDeliveryState(){

        let selfDeliveryStateItem = {
            deliveryStates: "",
            deliveryCharges: ""
        };

        // push to _allowedSelfDeliveryStates (normal)
        this._allowedSelfDeliveryStates.push(selfDeliveryStateItem);

        // push to allowedSelfDeliveryStates (form)
        this.allowedSelfDeliveryStates = this.createStoreForm.get('allowedSelfDeliveryStates') as FormArray;
        this.allowedSelfDeliveryStates.push(this._formBuilder.group(selfDeliveryStateItem));
    }

    removeSelfDeliveryState(index: number) {
        this._allowedSelfDeliveryStates.splice(index,1);

        // push to allowedSelfDeliveryStates (form)
        this.allowedSelfDeliveryStates = this.createStoreForm.get('allowedSelfDeliveryStates') as FormArray;
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
            console.log("this should not happen")
        }

        // push to allowedSelfDeliveryStates (form)
        this.allowedSelfDeliveryStates = this.createStoreForm.get('allowedSelfDeliveryStates') as FormArray;
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
        this.message = [];
        this.progressInfos = [];
      
        // find index of object this.files
        let index = this.files.findIndex(preview => preview.type === fileType);

        // set each of the attributes
        this.files[index].fileSource = "";
        this.files[index].selectedFileName = "";
        this.files[index].selectedFiles = event.target.files;

        if (this.files[index].selectedFiles && this.files[index].selectedFiles[0]) {
            const numberOfFiles = this.files[index].selectedFiles.length;
            for (let i = 0; i < numberOfFiles; i++) {
            const reader = new FileReader();
        
            reader.onload = (e: any) => {
               // set this.files[index].delete to false 
               this.files[index].toDelete = false;

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
        if (this.createStoreForm.get('deliveryType').errors || this.createStoreForm.get('deliveryPartner').errors){
            this.createStoreForm.get('deliveryPartner').setErrors(null);
        }

        // -----------------------------------
        // reset allowedSelfDeliveryStates if user change delivery type
        // -----------------------------------

        if (this.createStoreForm.get('deliveryType').value === "SELF") {

            // push to allowedSelfDeliveryStates (form)
            this.allowedSelfDeliveryStates = this.createStoreForm.get('allowedSelfDeliveryStates') as FormArray;
            // since backend give full discount tier list .. (not the only one that have been created only)
            this.allowedSelfDeliveryStates.clear();
            
            // re populate items
            this._allowedSelfDeliveryStates.forEach(item => {
                this.allowedSelfDeliveryStates.push(this._formBuilder.group(item));
            });
        }

        // then check it again and set if there's an error
        if (this.deliveryPartners.length < 1 && this.createStoreForm.get('deliveryType').value !== "SELF"){
            this.createStoreForm.get('deliveryType').setErrors({noDeliveryPartners: true})
        }
    }
}