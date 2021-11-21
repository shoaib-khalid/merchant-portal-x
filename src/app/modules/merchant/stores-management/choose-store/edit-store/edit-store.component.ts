import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { RegisterStoreValidationService } from 'app/modules/merchant/stores-management/create-store/register-store/register-store.validation.service';
import { Observable } from 'rxjs';
import { LocaleService } from 'app/core/locale/locale.service';
import { Locale } from 'app/core/locale/locale.types';
import { StoresService } from 'app/core/store/store.service';
import { Store, StoreRegionCountries, CreateStore, StoreAssets } from 'app/core/store/store.types';
import { ActivatedRoute, Router } from '@angular/router';
import { JwtService } from 'app/core/jwt/jwt.service';
import { debounce } from 'lodash';
import { HttpEventType, HttpResponse } from '@angular/common/http';

@Component({
    selector     : 'edit-store-page',
    templateUrl  : './edit-store.component.html',
    styles       : ['.ql-container { height: 156px; }'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class EditStoreComponent implements OnInit
{
    @ViewChild('supportNgForm') supportNgForm: NgForm;

    storeId: string;
    
    domainName:string;

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
    deliveryPartners: any;

    allowedSelfDeliveryStates: any;

    storeOpenCloseTime: any;
    storeTiming: FormArray;

    // Image part    
    files: any;
    imageInfos?: Observable<any>;
    
    selectedFiles?: FileList;
    selectedFileNames: any = [];

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
            name               : ['', Validators.required],
            domain             : ['',[Validators.required, Validators.minLength(4), Validators.maxLength(15), RegisterStoreValidationService.domainValidator]],
            storeDescription   : ['', [Validators.required, Validators.maxLength(100)]],
            email              : ['', [Validators.required, Validators.email]],
            phoneNumber        : ['', RegisterStoreValidationService.phonenumberValidator],
            address            : ['', Validators.required],
            city               : ['', Validators.required],
            postcode           : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), RegisterStoreValidationService.postcodeValidator]],
            deliveryType       : ['', Validators.required],
            paymentType        : ['', Validators.required],
            
            // region       : ['', Validators.required],
            // state       : ['', Validators.required],
            // country       : ['', Validators.required],

            storeTiming: this._formBuilder.array([]),

            clientId: [''],
            isBranch: [false],
            isSnooze: [false],
            serviceChargesPercentage: [0],
            verticleCode: [''],

            regionCountryId: ['', Validators.required],
            regionCountryStateId: ['', Validators.required],

            allowScheduledDelivery : [false],
            allowStorePickup : [false]
        });

        // this.otherStoreForm = this._formBuilder.group({
        // });
        
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

        this.storeOpenCloseTime = [
            { day: "Monday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false },
            { day: "Tuesday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false },
            { day: "Wednesday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false },
            { day: "Thursday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false },
            { day: "Friday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: false },
            { day: "Saturday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: true },
            { day: "Sunday", openTime: "09:00", closeTime: "23:00", breakStartTime: "13:00", breakEndTime: "14:00",  isOff: true },
        ];

        // form = new FormGroup({
        //     first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),
        //     last: new FormControl('Drew', Validators.required)
        // })

        this.storeOpenCloseTime.forEach(item => {
            this.storeTiming = this.editStoreForm.get('storeTiming') as FormArray;
            this.storeTiming.push(this._formBuilder.group(item));
        });

        this.deliveryFullfilment = [
            { selected: false, option: "INSTANT_DELIVERY", label: "Instant Delivery", tooltip: "This store support instant delivery. (Provided by store own logistic or delivery partners)" }, 
            { selected: false, option: "REGULAR_DELIVERY", label: "Regular Delivery", tooltip: "This store support regular delivery. (Provided by store own logistic or delivery partners)" },
            { selected: false, option: "SCHEDULED_DELIVERY", label: "Scheduled Delivery", tooltip: "This store allow scheduled delivery request from customer" },
            { selected: false, option: "STORE_PICKUP", label: "Allow Store Pickup", tooltip: "This store allow customer to pick up item from store" }
        ];

        this.deliveryPartners = [
            { selected: false, option: "LALA_MOVE", label: "Lala Move (Support Instant & Scheduled Delivery)" },
            { selected: false, option: "MRSPEEDY", label: "MrSpeedy (Support Instant & Scheduled Delivery)" },
            { selected: false, option: "JNT", label: "JnT (Support Scheduled Delivery)" },
            { selected: false, option: "GDEX", label: "GDex (Support Scheduled Delivery)" },
        ];

        // set default which is empty
        this.allowedSelfDeliveryStates = [
            { state: "", deliveryCharges:"" }
        ];

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

        this._storesService.getStoresById(this.storeId).subscribe(
           (response) => {

                // get subdomain from store domain
                let subdomain = response.domain.split(".")[0];
                // domain in form here is actually subdomain
                this.editStoreForm.get('domain').patchValue(subdomain);
                // set domain name 
                this.domainName = "." + response.domain.split(".")[1] + "." + response.domain.split(".")[2];

                this.editStoreForm.get('name').patchValue(response.name)
                this.editStoreForm.get('storeDescription').patchValue(response.storeDescription)
                this.editStoreForm.get('email').patchValue(response.email)
                this.editStoreForm.get('phoneNumber').patchValue(response.phoneNumber)
                this.editStoreForm.get('address').patchValue(response.address)
                this.editStoreForm.get('city').patchValue(response.city)
                this.editStoreForm.get('postcode').patchValue(response.postcode)
                // this.editStoreForm.get('state').patchValue(response.regionCountryStateId)
                this.editStoreForm.get('deliveryType').patchValue("SELF_DELIVERY")
                this.editStoreForm.get('paymentType').patchValue(response.paymentType)
                this.editStoreForm.get('verticleCode').patchValue(response.verticalCode);

                this.files[0].fileSource = response.storeAsset.logoUrl;
                this.files[1].fileSource = response.storeAsset.bannerUrl;
                this.files[2].fileSource = response.storeAsset.bannerMobileUrl;
           } 
        );
        
        // Get allowed store countries 
        // this only to get list of country in symplified backend
        this._storesService.storeRegionCountries$.subscribe((response: StoreRegionCountries[])=>{
            console.log("this._storesService.storeRegionCountries$ :", response);
            response.forEach((country: StoreRegionCountries) => {
                this.countriesList.push(country);
            });
        });
        

        // get locale info from (locale service)
        // this is to get the current location by using 3rd party api service
        this._localeService.locale$.subscribe((response: Locale)=>{

            console.log("this._localeService.locale$ :", response);
            
            let symplifiedCountryId = response.symplifiedCountryId;
            
            // state (using component variable)
            // INITIALLY (refer below section updateStates(); for changes), get states from symplified backed by using the 3rd party api
            
            // Get states by country Z(using symplified backend)
            this._storesService.getStoreRegionCountryState(symplifiedCountryId).subscribe((response)=>{
                console.log("this._storesService.getStoreRegionCountryState(countryId): ", response);
                this.statesByCountry = response.data.content;
            });

            // country (using form builder variable)
            this.editStoreForm.get('regionCountryId').patchValue(symplifiedCountryId.toUpperCase());
            
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

        // set required value that does not appear in register-store.component.html
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
        this.editStoreForm.get('clientId').patchValue(clientId);

        this.editStoreForm.get('isBranch').patchValue(false);
        this.editStoreForm.get('isSnooze').patchValue(false);


    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    logThis(e){
        console.log(e);
    }

    /**
     * Clear the form
     */
    clearForm(): void
    {
        // Reset the form
        this.supportNgForm.resetForm();
    }

    // createStoreTiming(): FormGroup {
    //     return this._formBuilder.group({
    //         day: '',
    //         closeTime: '',
    //         openTime: '',
    //         breakStartTime: '',
    //         breakEndTime: '',
    //         isOff: ''
    //     });
    // }

    // addStoreTiming(): void{
    //     this.storeTiming = this.editStoreForm.get('storeTiming') as FormArray;
    //     this.storeTiming.push(this.createStoreTiming());
    // }

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
        const { allowScheduledDelivery, allowStorePickup, storeTiming
                ,...createStoreBody}  = this.editStoreForm.value;

        // Disable the form
        this.editStoreForm.disable();

        this._storesService.update(this.storeId, createStoreBody)
            .subscribe((response) => {
                /**
                 * 
                 * Register Store Timing Section
                 * 
                 */

                // this will remove the item from the object
                let storeId = response.data.id;

                storeTiming.forEach(item => {
                    this._storesService.postTiming(storeId, item)
                        .subscribe((response)=>{});
                });

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

    async checkExistingURL(url: string){
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

    updateStoreOpening(day: string){
        let index = this.storeOpenCloseTime.findIndex(dayList => dayList.day === day);
        this.storeOpenCloseTime[index].isOff = !this.storeOpenCloseTime[index].isOff;
    }

    checkCurrData(){
        console.log("this.allowedSelfDeliveryStates",this.allowedSelfDeliveryStates)
    }

    addSelfDeliveryState(){
        this.allowedSelfDeliveryStates.push({
            state: "",
            deliveryCharges: ""
        });
    }

    removeSelfDeliveryState(index: number){
        console.log("index", index)
        this.allowedSelfDeliveryStates.splice(index,1);
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
        this.files[index].selectedFileNames = "";
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
            console.log("this.files["+index+"].selectedFiles["+i+"]",this.files[index].selectedFiles[i])
            reader.readAsDataURL(this.files[index].selectedFiles[i]);
            console.log("sini")
            this.files[index].selectedFileNames = this.files[index].selectedFiles[i].name;
            console.log("sini 2")
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