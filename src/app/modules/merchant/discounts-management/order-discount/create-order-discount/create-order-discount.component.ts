import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { LOADIPHLPAPI } from 'dns';
import { debounce } from 'lodash';
import { of, Subject } from 'rxjs';
import { concatMap, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DiscountManagementValidationService } from '../../discounts-management.validation.service';
import { DiscountsService } from '../order-discount-list/order-discount-list.service';
import { StoreDiscountTierList } from '../order-discount-list/order-discount-list.types';


@Component({
  selector: 'dialog-create-order-discount',
  templateUrl: './create-order-discount.component.html',
  styles    :   [`
        /** language=SCSS */
        :host ::ng-deep .mat-horizontal-content-container {
            // max-height: 90vh;
            padding: 0 0px 20px 0px;
            // overflow-y: auto;
        }
        :host ::ng-deep .mat-horizontal-stepper-header-container {
            height: 60px;
        }
        :host ::ng-deep .mat-horizontal-stepper-header {
            height: 60px;
            padding-left: 8px;
            padding-right: 8px;
        }
        .content{
            height:400px;
        }
        .create-order-discount-grid {
            grid-template-columns: 80px 80px auto 80px;
    
            @screen sm {
                grid-template-columns: 20px 120px 120px auto 80px;
            }
        }
    `]
})
export class CreateOrderDiscountDialogComponent implements OnInit {

    // get current store
    store$: Store;
    selectedDate: string;
    
    disabledProceed: boolean = true;

    discountName: string;
    status: boolean;
    discountType: string;
    isActive: boolean;
    maxDiscountAmount: string;
    normalPriceItemOnly: boolean;

    dateAlert: any;
    checkdiscountamount = false;

    startDate: string;
    startTime: string;
    minStartDate: string;
    minStartTime: string;
    maxStartDate:string;
    maxStartTime:string;

    endDate: string;
    endTime: string;
    minEndDate: string;
    minEndTime: string;
    maxEndDate: string;
    maxEndTime: string;

    changeStartTime:string;
    changeEndTime:string;

    message: string = "";

    createOrderDiscountForm: FormGroup;
    storeDiscountTierList: FormArray;

    storeDiscountTierListValueEditMode:any = [];

    // discount tier for insert mode
    calculationType: string;
    discountAmount: number;
    // endTotalSalesAmount: number;
    startTotalSalesAmount: number;

    //disable add tier button 
    isDisplayAddTier : boolean = false;

    discountId: string;

    currentScreenSize: string[] = [];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        public dialogRef: MatDialogRef<CreateOrderDiscountDialogComponent>,
        private _formBuilder: FormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _discountService: DiscountsService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _storesService: StoresService,
        private _changeDetectorRef: ChangeDetectorRef,
    ) 
    {
        this.checkExistingDate = debounce(this.checkExistingDate,300);
    }

    // ----------------------------------------------------------------------------------
    //                          Getter and Setter
    // ----------------------------------------------------------------------------------

    get storeId$(): string
    {
        return localStorage.getItem('storeId') ?? '';
    }

    // ----------------------------------------------------------------------------------
    //                          @ Lifecycle hooks
    // ----------------------------------------------------------------------------------

    ngOnInit(): void {
        // let today = new Date();
        // let yy = today.getFullYear();
        // let mm = String(today.getMonth() + 1).padStart(2, '0');
        // let dd = String(today.getDate()).padStart(2, '0');
        // this.minStartDate = yy + '-' + mm + '-' + dd;

        // let now = new Date();
        // let hh = now.getHours();
        // let ms = now.getMinutes();
        // let ss = now.getSeconds();
        // this.minStartTime = hh + ':' + ms;
        this.createOrderDiscountForm = this._formBuilder.group({
            //Main Discount
            step1: this._formBuilder.group({
                // id               : [''],
                discountName        : ['', Validators.required],
                discountType        : ['', Validators.required],
                startDate           : ['', Validators.required],
                endDate             : ['', Validators.required],
                startTime           : [new TimeSelector("--","--","--"),  Validators.required],
                endTime             : [new TimeSelector("--","--","--"), Validators.required],
                isActive            : ['', Validators.required],
                maxDiscountAmount   : ['', Validators.required],
                normalPriceItemOnly : [''],
                storeId             : [''], // not used
            }),
            //Tier List
            step2: this._formBuilder.array([
            
            ]),
        });
        
        // Get the store
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {

                // Update the store
                this.store$ = store;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {               

                this.currentScreenSize = matchingAliases;                

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    // ----------------------------------------------------------------------------------
    //                              @ Public methods
    // ----------------------------------------------------------------------------------

    // --------------------------------------
    //          Discount Section
    // --------------------------------------

    addNewDiscount() {
        this.checkDateTime();
    
        this.dialogRef.close({ 
            status              : true ,
            discountName        : this.discountName,
            discountOn          : this.discountType,
            startDate           : this.startDate,
            startTime           : this.changeStartTime,
            endDate             : this.endDate,
            endTime             : this.changeEndTime,
            isActive            : this.isActive,
            maxDiscountAmount   : this.maxDiscountAmount,
            normalPriceItemOnly : this.normalPriceItemOnly
        });
    }

    async insertMainOrderDiscount(mainDiscountBody,tierListBody){
        
        this._discountService.createDiscount(mainDiscountBody).subscribe((response) => {
            // Show a success message
            this.showFlashMessage('success');

            return this.discountId= response['data'].id;
        },((error) => {
            // Show a error message
            this.showFlashMessage('error');

            if (error.status === 417) {
                // Open the confirmation dialog
                const confirmation = this._fuseConfirmationService.open({
                    title  : 'Discount date overlap',
                    message: 'Your discount date range entered overlapping with existing discount date! Please change your date range',
                    actions: {
                        confirm: {
                            label: 'Ok'
                        },
                        cancel : {
                            show : false,
                        }
                    }
                });
            }
        }));
    }

    createDiscount(): void
    {
        // Set loading to true
        this.isLoading = true;

        this.checkDateTime();
        let sendPayload = [this.createOrderDiscountForm.get('step1').value];
        let toBeSendPayload = sendPayload.
        map((x)=>(
            {
                storeId             : this.storeId$,
                startTime           : this.changeStartTime,
                endTime             : this.changeEndTime,
                startDate           : x.startDate,
                endDate             : x.endDate,
                discountName        : x.discountName,
                discountType        : x.discountType,
                isActive            : x.isActive,
                maxDiscountAmount   : x.maxDiscountAmount,
                normalPriceItemOnly : x.normalPriceItemOnly,
            }
        ));        

        this.addMainDiscountAndTier(toBeSendPayload[0],this.createOrderDiscountForm.get('step2').value).then(()=>{
            // Set loading to false
            this.isLoading = false;
        });
        this.closeDialog();
    }

    closeDialog(){
        this.dialogRef.close();
    }

    // --------------------------------------
    //       Discount Tier Section
    // --------------------------------------

    checkDiscountAmount(){           
        // check discount name
        if (this.maxDiscountAmount) {
            this.checkdiscountamount = true;
            this.message = "";
        }else{
            this.checkdiscountamount = false;
            this.message = "Please insert maximum discount amount";
        }
        
    }

    validateDiscountTier(type:string, value){
        if (type === 'startTotalSalesAmount') {
            this.startTotalSalesAmount = value;
        }
        // if (type === 'endTotalSalesAmount') {
        //     this.endTotalSalesAmount = value;
        // }
        if (type === 'discountAmount') {
            this.discountAmount = value;
        }
        if (type === 'calculationType') {
            this.calculationType = value;
        }

        if(<any>this.startTotalSalesAmount === "" || <any>this.discountAmount === "" ){
            this.isDisplayAddTier = false;
        }
        else if(this.startTotalSalesAmount !== undefined && this.discountAmount!==undefined && this.calculationType!==undefined){
            this.isDisplayAddTier = true;
        }

    }

    insertTierToDiscount(){

        // check condition first before pass to backend
        if(this.calculationType === 'PERCENT' && this.discountAmount>100){

            const confirmation = this._fuseConfirmationService.open({
                title  : 'Exceed maximum amount discount percentage',
                message: 'Please change your discount amount for percentage calculation type',
                actions: {
                    confirm: {
                        label: 'Ok'
                    },
                    cancel : {
                        show : false,
                    }
                }
            });

            return;
        }

        let discountTier: StoreDiscountTierList = {
            calculationType: this.calculationType,
            discountAmount: this.discountAmount,
            startTotalSalesAmount: this.startTotalSalesAmount,
        }

        this.storeDiscountTierList = this.createOrderDiscountForm.get('step2') as FormArray;
        let checkDiscountAmount = (this.storeDiscountTierList.value.find(function checkValue(element, index, array) {
            return   element.startTotalSalesAmount=== discountTier.startTotalSalesAmount;
        }));


        if(!checkDiscountAmount){
        
            this.storeDiscountTierList.push(this._formBuilder.group(discountTier));
        
            //disable button add
            this.isDisplayAddTier=false;
        
            //clear the input
            (<any>this.startTotalSalesAmount)='';
            (<any>this.discountAmount)='';
            this.calculationType='';  

        }
        else{
            // Pop-up error (overlap amount)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Minimum subtotal overlap',
                message: 'Your minimum subtotal entered overlapping with existing amount! Please change your minimum subtotal',
                actions: {
                    confirm: {
                        label: 'Ok'
                    },
                    cancel : {
                        show : false,
                    }
                }
            });
        }

    }

    deleteSelectedDiscountTier(indexForm): void
    {

        this.storeDiscountTierList = this.createOrderDiscountForm.get('step2') as FormArray;
        let index = (this.storeDiscountTierList.value.findIndex(function checkIndex(element, index, array) {
            return   index=== indexForm;
        }));

        // remove from discount tier list
        if (index > -1) {
            this.storeDiscountTierList.removeAt(index);
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    async addMainDiscountAndTier(mainDiscountBody,tierListBody){
        await this.insertMainOrderDiscount(mainDiscountBody,tierListBody);
        setTimeout(() => {
            return   this.sendTierList(tierListBody);   
            }, 1000);
        return;
    }

    sendTierList(tierListBody){
        tierListBody
            .forEach((list)=>{

                    let payloadTier ={
                        calculationType: list.calculationType,
                        discountAmount: list.discountAmount,
                        startTotalSalesAmount: list.startTotalSalesAmount,
                    }                

                    this._discountService.createDiscountTier(this.discountId,payloadTier)
                    .subscribe();
                }
            ) 
        return;
   }

    showFlashMessage(type: 'success' | 'error'): void
    {
        // Show the message
        this.flashMessage = type;

        // Mark for check
        this._changeDetectorRef.markForCheck();

        // Hide it after 3 seconds
        setTimeout(() => {

            this.flashMessage = null;

            // Mark for check
            this._changeDetectorRef.markForCheck();
        }, 3000);
    }

    // --------------------------------------
    //          Date and Time Section
    // --------------------------------------

    checkDateTime() {

        // ==============================================================
        //                     Start Date & Time
        // ==============================================================

        // Get startDate
        let _startDate = this.createOrderDiscountForm.get('step1').get('startDate').value
        // Get startTime
        let startTime = this.createOrderDiscountForm.get('step1.startTime').value;
        let _startTime;        

        // Split start date format
        var selectedStartDay   = _startDate.split("-")[2];
        var selectedStartMonth = _startDate.split("-")[1];
        var selectedStartYear  = _startDate.split("-")[0];


        if (startTime.timeAmPm === "PM" && startTime.timeHour !== "12") {
            _startTime = parseInt(startTime.timeHour) + 12;
        } else if (startTime.timeAmPm === "AM" && startTime.timeHour === "12") {
            _startTime = parseInt(startTime.timeHour) - 12;
            _startTime = (_startTime === 0) ? "00" : _startTime;
        } else {
            _startTime = startTime.timeHour;
        }

        console.log("_startTime::::::::::",_startTime);
        

        // Set new start date and time
        const startDateTime = new Date();
        startDateTime.setDate(selectedStartDay)
        startDateTime.setMonth(selectedStartMonth - 1)
        startDateTime.setFullYear(selectedStartYear)
        startDateTime.setHours(_startTime,startTime.timeMinute,0)

        this.changeStartTime = _startTime + ":" + startTime.timeMinute   

        // ==============================================================
        //                      End Date
        // ==============================================================

        // Get endDate
        let _endDate = this.createOrderDiscountForm.get('step1').get('endDate').value
        // Get endTime
        let endTime = this.createOrderDiscountForm.get('step1.endTime').value;
        let _endTime;

        // Split end date format
        var selectedEndDay   = _endDate.split("-")[2];
        var selectedEndMonth = _endDate.split("-")[1];
        var selectedEndYear  = _endDate.split("-")[0];

        if (endTime.timeAmPm === "PM" && endTime.timeHour !== "12") {
            _endTime = parseInt(endTime.timeHour) + 12;
        } else if (endTime.timeAmPm === "AM" && endTime.timeHour === "12") {
            _endTime = parseInt(endTime.timeHour) - 12;
            _endTime = (_endTime === 0) ? "00" : _endTime;
        } else {
            _endTime = endTime.timeHour;
        }

        console.log("_endTime",_endTime);
        

        // Set new end date and time
        const endDateTime = new Date();
        endDateTime.setDate(selectedEndDay);
        endDateTime.setMonth(selectedEndMonth - 1);
        endDateTime.setFullYear(selectedEndYear);
        endDateTime.setHours(_endTime,endTime.timeMinute,0);

        this.changeEndTime = _endTime + ":" + endTime.timeMinute
        
        // ==============================================================
        //              Date and time range Display Error
        // ==============================================================

        // this will set what need to be sent to backend
        const discountBody = {

            startDate   : this.createOrderDiscountForm.get('step1.startDate').value,
            endDate     : this.createOrderDiscountForm.get('step1.endDate').value,
            startTime   : _startTime + ":" + startTime.timeMinute,
            endTime     : _endTime + ":" + endTime.timeMinute,
            isActive    : this.createOrderDiscountForm.get('step1.isActive').value,
            discountType: this.createOrderDiscountForm.get('step1.discountType').value

        };

        if(startDateTime > endDateTime && _endDate !== ""){            
            this.dateAlert = "Date and Time Range incorrect !" ;
            this.disabledProceed = true;
        } else if(endTime.timeMinute === "--" || _endTime === "--" || endTime.timeAmPm === "--"){
            this.disabledProceed = true;

        } else {
            // check validate at backend
            if(this.checkExistingDate(discountBody)) {
                this.disabledProceed = true;
            }
            this.dateAlert = " " ;
            this.disabledProceed = false;
        }
    }

    //post validate (validateStoreDiscount)
    async checkExistingDate(discountBody){
        let status = await this._discountService.getExistingDate(discountBody);
        if (status === 417 ){
            this.dateAlert ="Date selected is overlapped with existing date, please select another date !";
            this.disabledProceed = true;
        }
    }

    cancelPickupDateTime(){
        this.dialogRef.close({ status: false });
    }

}
