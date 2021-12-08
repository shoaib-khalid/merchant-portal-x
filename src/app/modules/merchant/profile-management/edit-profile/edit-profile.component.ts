import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
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

@Component({
    selector     : 'edit-profile-page',
    templateUrl  : './edit-profile.component.html',
    styles       : ['.ql-container { height: 156px; }'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class EditProfileComponent implements OnInit
{
    @ViewChild('supportNgForm') supportNgForm: NgForm;

    storeId: string;
    
    domainName:string;
    subDomainName: string;
    
    alert: any;
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

    _originalAllowedSelfDeliveryStates: any = [];
    _allowedSelfDeliveryStates: any = [];
    allowedSelfDeliveryStates: FormArray;

    // Image part    
    files: any;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _storesService: StoresService,
        private _jwt: JwtService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _localeService: LocaleService,
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
        // Do nothing if the form is invalid
        if ( this.editStoreForm.invalid )
        {
            return;
        }

        // Hide the alert
        this.alert = false;

        /**
         * 
         * Register Store Section
         * 
         */

        // this will remove the item from the object
        const { allowedSelfDeliveryStates, allowScheduledDelivery, allowStorePickup, 
            deliveryType, deliveryPartner, storeTiming
            ,...createStoreBody } = this.editStoreForm.value;

        // Disable the form
        this.editStoreForm.disable();

        this._storesService.update(this.storeId, createStoreBody)
            .subscribe((response) => {

                let storeId = response["data"].id;

                // ---------------------------
                // Update Store Timing
                // ---------------------------

                storeTiming.forEach(item => {
                    let { isOpen, ...filteredItem } = item;
                    this._storesService.putTiming(storeId, item.day, filteredItem)
                        .subscribe((response)=>{});
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
                // Update Store Provider
                // ---------------------------

                let _itemType;
                let _deliveryType;
                if (this.editStoreForm.get('verticalCode').value === "E-Commerece" || this.editStoreForm.get('verticalCode').value === "e-commerce-b2b2c" || this.editStoreForm.get('verticalCode').value === "ECommerce_PK") {
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
                            console.log("masuk")
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

                    this._storesService.postStoreRegionCountryDeliveryProvider(this.storeId, this.editStoreForm.get('deliveryPartner').value)
                        .subscribe((response) => {
                            
                        });

                }

                // Navigate to the confirmation required page
                // this._router.navigateByUrl('/stores');
            },
            (response) => {
                // Re-enable the form
                this.editStoreForm.enable();

                // Reset the form
                this.clearForm();

                // Set the alert
                this.alert = {
                    type   : 'error',
                    message: 'Something went wrong, please try again.'
                };

                // Show the alert
                this.alert = true;
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
        let url = subdomain + "." + this.domainName;
        console.log("the url: ", url)
        let status = await this._storesService.getExistingURL(url);
        if (status === 409){
            this.editStoreForm.get('domain').setErrors({domainAlreadyTaken: true});
        }
    }
    
    async checkExistingName(name:string){
        let status = await this._storesService.getExistingName(name);
        if (status === 409){
            this.editStoreForm.get('name').setErrors({storeNameAlreadyTaken: true});
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
            console.log("this should not happen")
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
    
}