import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { RegisterStoreValidationService } from 'app/modules/merchant/stores-management/create-store/register-store/register-store.validation.service';
import { Observable } from 'rxjs';
import { LocaleService } from 'app/core/locale/locale.service';
import { Locale } from 'app/core/locale/locale.types';
import { StoresService } from 'app/core/store/store.service';
import { Store, StoreRegionCountries } from 'app/core/store/store.types';
import { Router } from '@angular/router';
import { JwtService } from 'app/core/jwt/jwt.service';

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

    alert: any;
    supportForm: FormGroup;

    statesList: any;
    statesByCountry: string;
    /** for selected state refer form builder */ 

    countriesList: any;
    /** for selected country refer form builder */ 

    regionsList: any;
    /** for selected country refer form builder */ 

    deliveryFullfilment: any;
    deliveryPartners: any;

    allowedSelfDeliveryStates: any;

    storeOpenCloseTime: any;

    // Image part
    
    progressInfos: any[] = [];
    message: string[] = [];
    
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
    )
    {
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
        this.supportForm = this._formBuilder.group({
            name          : ['', Validators.required],
            domain        : ['',[Validators.required, Validators.minLength(4), Validators.maxLength(15), RegisterStoreValidationService.domainValidator]],
            storeDescription   : ['', [Validators.required, Validators.maxLength(100)]],
            email         : ['', [Validators.required, Validators.email]],
            phoneNumber   : ['', RegisterStoreValidationService.phonenumberValidator],
            address       : ['', Validators.required],
            city       : ['', Validators.required],
            postcode       : ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), RegisterStoreValidationService.postcodeValidator]],
            region       : ['', Validators.required],
            deliveryType  : ['', Validators.required],
            paymentType  : ['', Validators.required],
            
            state       : ['', Validators.required],
            country       : ['', Validators.required],

            clientId: [''],
            isBranch: [false],
            isSnooze: [false],
            serviceChargesPercentage: [0],
            verticleCode: [''],

            regionCountryId: [''],
            regionCountryStateId: [''],

            allowScheduledDelivery : [false],
            allowStorePickup : [false],
            storeOpenTime   : [''],
            storeCloseTime  : [''],
            storeBreakTimeStart : [''],
            storeBreakTimeEnd   : [''],
        });
        
        // get states service
        this.statesList = [
            { countryCode: "MY", states: ["Johor","Kedah","Kelantan","Kuala Lumpur","Malacca","Negeri Sembilan", "Pahang", "Pulau Pinang", "Perak", "Perlis", "Sabah", "Serawak", "Selangor"] },
            { countryCode: "PK", states: ["Balochistan","Federal","Khyber Pakhtunkhwa", "Punjab", "Sindh"] }
        ];
        
        // Get allowed store countries 
        this._storesService.storeRegionCountries$.subscribe((response: StoreRegionCountries[])=>{
            console.log("HERE FIRST",this.countriesList);
            response.forEach((country: StoreRegionCountries) => {
                this.countriesList.push(country);
            });
            console.log("HERE FIRST",this.countriesList);
        });


        // get countries service
        this.countriesList = [
            { countryCode: "MY", name: "Malaysia" },
            { countryCode: "PK", name: "Pakistan" }
        ];

        // get regions service
        this.regionsList = [
            { regionCode: "SEA", name: "South East Asia", countries: ["MY"] },
            { regionCode: "SE", name: "South East", countries: ["PK"] }
        ];

        this.storeOpenCloseTime = [
            { day: "Monday", openTime: "09:00", closeTime: "23:00", startBreakTime: "13:00", endBreakTime: "14:00",  isStoreClose: false },
            { day: "Tuesday", openTime: "09:00", closeTime: "23:00", startBreakTime: "13:00", endBreakTime: "14:00",  isStoreClose: false },
            { day: "Wednesday", openTime: "09:00", closeTime: "23:00", startBreakTime: "13:00", endBreakTime: "14:00",  isStoreClose: false },
            { day: "Thursday", openTime: "09:00", closeTime: "23:00", startBreakTime: "13:00", endBreakTime: "14:00",  isStoreClose: false },
            { day: "Friday", openTime: "09:00", closeTime: "23:00", startBreakTime: "13:00", endBreakTime: "14:00",  isStoreClose: false },
            { day: "Saturday", openTime: "09:00", closeTime: "23:00", startBreakTime: "13:00", endBreakTime: "14:00",  isStoreClose: true },
            { day: "Sunday", openTime: "09:00", closeTime: "23:00", startBreakTime: "13:00", endBreakTime: "14:00",  isStoreClose: true },
        ];

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
                type: "logo-image", 
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "500", 
                recommendedImageHeight: "500", 
                selectedImageWidth: "", 
                selectedImageHeight: ""
            },
            { 
                type: "banner-desktop-image", 
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "1110", 
                recommendedImageHeight: "250", 
                selectedImageWidth: "", 
                selectedImageHeight: ""
            },
            { 
                type: "banner-mobile-image", 
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "950", 
                recommendedImageHeight: "260", 
                selectedImageWidth: "", 
                selectedImageHeight: ""
            },
        ];

        // get locale info from (locale service)
        this._localeService.locale$.subscribe((response: Locale)=>{
            
            let countryCode = response.countryCode;
            
            // state (using component variable)
            let index = this.statesList.findIndex(state => state.countryCode === countryCode.toUpperCase())
            this.statesByCountry = this.statesList[index].states;

            // country (using form builder variable)
            this.supportForm.get('country').patchValue(countryCode.toUpperCase());
            let regionCode = response.symplified_region;
            
            // country (using form builder variable)
            this.supportForm.get('region').patchValue(regionCode.toUpperCase());


            /**
             * 
             * After above completed, then we call store service and get regionCountry info
             * from symplified backend
             * 
             */
            
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

        // set required value that does not appear in register-store.component.html
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
        this.supportForm.get('clientId').patchValue(clientId);

        this.supportForm.get('isBranch').patchValue(false);
        this.supportForm.get('isSnooze').patchValue(false);
        this.supportForm.get('verticleCode').patchValue(0);

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

    /**
     * Send the form
     */
    sendForm(): void
    {
        // Do nothing if the form is invalid
        if ( this.supportForm.invalid )
        {
            return;
        }

        console.log("this.supportForm.value: ",this.supportForm.value)

        // Disable the form
        this.supportForm.disable();

        // Hide the alert
        this.alert = false;

        // this._storesService.post(this.supportForm.value)
        //     .subscribe((response) => {

        //         console.log("Create store response: ", response);

        //         // Navigate to the confirmation required page
        //         this._router.navigateByUrl('/products/inventory');
        //     },
        //     (response) => {
        //         // Re-enable the form
        //         this.supportForm.enable();

        //         // Reset the form
        //         this.clearForm();

        //         // Set the alert
        //         this.alert = {
        //             type   : 'error',
        //             message: 'Something went wrong, please try again.'
        //         };

        //         // Show the alert
        //         this.alert = true;
        //     });

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

    updateStates(countryCode: string){

        console.log("countryCode:", countryCode)
        // state (using component variable)
        let index = this.statesList.findIndex(state => state.countryCode === countryCode.toUpperCase())
        this.statesByCountry = this.statesList[index].states;

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    updateCountry(regionyCode: string){

        console.log("countryCode:", regionyCode)
        // state (using component variable)
        let index = this.statesList.findIndex(state => state.regionyCode === regionyCode.toUpperCase())
        this.statesByCountry = this.statesList[index].states;

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    checkExistingSubdomain(){

    }

    updateStoreOpening(day: string){
        let index = this.storeOpenCloseTime.findIndex(dayList => dayList.day === day);
        this.storeOpenCloseTime[index].isStoreClose = !this.storeOpenCloseTime[index].isStoreClose;
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
     * tahu la
     * @param event 
     */
    selectFiles(fileType,event: any): void {
        this.message = [];
        this.progressInfos = [];
      
        // find index of object this.files
        let index = this.files.findIndex(preview => preview.type === fileType);

        // set each of the attributes
        this.files[index].fileName = "";
        this.files[index].selectedFileNames = "";
        this.files[index].selectedFiles = event.target.files;

        if (this.files[index].selectedFiles && this.files[index].selectedFiles[0]) {
            const numberOfFiles = this.files[index].selectedFiles.length;
            for (let i = 0; i < numberOfFiles; i++) {
            const reader = new FileReader();
        
            reader.onload = (e: any) => {
                this.files[index].fileName = e.target.result;

                var image = new Image();
                image.src = e.target.result;

                image.onload = (imageInfo: any) => {
                    this.files[index].selectedImageWidth = imageInfo.path[0].width;
                    this.files[index].selectedImageHeight = imageInfo.path[0].height;

                    this._changeDetectorRef.markForCheck();
                };

                this._changeDetectorRef.markForCheck();                
            };
            console.log("this.files[index].selectedFiles[i]",this.files[index].selectedFiles[i])
            reader.readAsDataURL(this.files[index].selectedFiles[i]);
            console.log("sini")
            this.files[index].selectedFileNames = this.files[index].selectedFiles[i].name;
            console.log("sini 2")
            }
        }
        this._changeDetectorRef.markForCheck();
    }

    uploadFiles(): void {
        this.message = [];
      
        if (this.selectedFiles) {
          for (let i = 0; i < this.selectedFiles.length; i++) {
            // this.upload(i, this.selectedFiles[i]);
          }
        }
    }

    upload(idx: number, file: File): void {
        this.progressInfos[idx] = { value: 0, fileName: file.name };
      
        // if (file) {
        //   this.uploadService.upload(file).subscribe(
        //     (event: any) => {
        //       if (event.type === HttpEventType.UploadProgress) {
        //         this.progressInfos[idx].value = Math.round(100 * event.loaded / event.total);
        //       } else if (event instanceof HttpResponse) {
        //         const msg = 'Uploaded the file successfully: ' + file.name;
        //         this.message.push(msg);
        //         this.imageInfos = this.uploadService.getFiles();
        //       }
        //     },
        //     (err: any) => {
        //       this.progressInfos[idx].value = 0;
        //       const msg = 'Could not upload the file: ' + file.name;
        //       this.message.push(msg);
        //     });
        // }
    }
}
