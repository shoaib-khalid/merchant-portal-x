import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { Subject } from 'rxjs';
import { DiscountsService } from '../order-discount-list/order-discount-list.service';
import { ApiResponseModel, Discount, StoreDiscountTierList } from '../order-discount-list/order-discount-list.types';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { DiscountManagementValidationService } from '../../discounts-management.validation.service';
import { debounce } from 'lodash';

@Component({
    selector: 'app-edit-order-discount',
    templateUrl: './edit-order-discount.component.html',
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

        .edit-order-discount-grid {
            grid-template-columns: 80px 80px auto 80px;

            @screen sm {
                grid-template-columns: 20px 120px 120px auto 80px;
            }
        }
    `]
})
export class EditOrderDiscountDialogComponent implements OnInit {

    // get current store
    store$: Store;
    originalStartDate: any;
    originalEndDate: any;
    
    editOrderDiscountForm: FormGroup;
    discountId: string;
    selectedDiscount: Discount | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    loadDetails:boolean=false;
    storeDiscountTierList: FormArray;

    storeDiscountTierListValueEditMode:any = [];

    // discount tier for insert mode
    calculationType: string;
    discountAmount: number;
    // endTotalSalesAmount: number;
    startTotalSalesAmount: number;

    //disable add tier button 
    isDisplayAddTier : boolean = false;

    flashMessage: 'success' | 'error' | null = null;

    changeStartTime:string;
    changeEndTime:string;

    currentScreenSize: string[] = [];

    isLoading: boolean = false;

    dateAlert: any;
    disabledProceed: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<EditOrderDiscountDialogComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        private _discountService: DiscountsService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _storesService: StoresService,
        // private createOrderDiscount:CreateOrderDiscount,
        @Inject(MAT_DIALOG_DATA) public data: MatDialog
    ) 
    { 
        this.checkExistingDate = debounce(this.checkExistingDate,300);
    }

    // ----------------------------------------------------------------------------------
    //                          @ Lifecycle hooks
    // ----------------------------------------------------------------------------------
    ngOnInit(): void {

        //get value when open matdialot
        this.discountId = this.data['discountId'];
        
        // Horizontal stepper form
        this.editOrderDiscountForm = this._formBuilder.group({
            //Main Discount
            step1: this._formBuilder.group({
                id                  : [''],
                discountName        : ['', Validators.required],
                discountType        : ['', Validators.required],
                startDate           : ['', [Validators.required]],
                endDate             : ['', [Validators.required]],
                startTime           : [new TimeSelector("--","--","--"), Validators.required],
                endTime             : [new TimeSelector("--","--","--"), Validators.required],
                isActive            : ['', Validators.required],
                maxDiscountAmount   : ['', Validators.required],
                normalPriceItemOnly : [''],
                storeId             : [''], // not used
        
            }),
            //Tier List
            step2: this._formBuilder.array([]),
        });

        // if id is exist so it is edit mode, Get the discount by id
        this._discountService.getDiscountByGuid(this.discountId)
            .subscribe((response:ApiResponseModel<Discount>) => {

                this.originalStartDate = response.data.startDate;
                this.originalEndDate = response.data.endDate;
                
                //Set the selected discount
                this.selectedDiscount = response.data;

                const { startTime, endTime, ...selectedDiscount } = this.selectedDiscount;
    
                // Fill the form step 1
                this.editOrderDiscountForm.get('step1').patchValue(selectedDiscount);

                //set value for time in tieme selector
                this.setValueToTimeSelector(response.data);                
                
                // UI need to show based on this logic :
                // if isExpired==true then show "EXPIRED"
                // if isExpired==false AND isActive==true then show "ACTIVE"
                // is isExpired==false AND isActive==false then show "INACTIVE"
                const displayStatus = () => {
                    const resultStatus = response.data.isExpired == true ? 'EXPIRED' 
                    : response.data.isExpired == false && response.data.isActive == true?'ACTIVE'
                    : 'INACTIVE';
                    return resultStatus;
                }
                this.editOrderDiscountForm.get('step1').get('isActive').patchValue(displayStatus());

                //after we set the form with custom field time selector then we display the details form
                this.loadDetails =true;

                // clear discount tier form array
                (this.editOrderDiscountForm.get('step2') as FormArray).clear();
                
                // load discount tier form array with data frombackend
                response.data.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
                    this.storeDiscountTierList = this.editOrderDiscountForm.get('step2') as FormArray;
                    this.storeDiscountTierList.push(this._formBuilder.group(item));
                });
                
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        );
        // }
        // //for create mode
        // else{
        //     this.loadDetails =true;
        // }

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

    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // ----------------------------------------------------------------------------------
    //                              @ Public methods
    // ----------------------------------------------------------------------------------

    // --------------------------------------
    //          Discount Section
    // --------------------------------------
 
    updateSelectedDiscount(): void
    {
        // Set loading to true
        this.isLoading = true;

        this.checkDateTime();
        let sendPayload = [this.editOrderDiscountForm.get('step1').value];
        let toBeSendPayload=sendPayload.
        map((x)=>(
            {
                startTime             :this.changeStartTime,
                endTime               :this.changeEndTime,
                discountName          : x.discountName,
                discountType          :x.discountType,
                endDate               : x.endDate,
                id                    : x.id,
                isActive              : x.isActive === 'EXPIRED'? false
                                            :x.isActive === 'ACTIVE'? true
                                            :x.isActive === 'INACTIVE'? false
                                            :false,//change the value from string to boolean for isActive before we send to backend
                maxDiscountAmount     : x.maxDiscountAmount,
                normalPriceItemOnly   : x.normalPriceItemOnly,
                startDate             : x.startDate,
                storeDiscountTierList : this.editOrderDiscountForm.get('step2').value,
                storeId               : x.storeId,
            }
            ));

        // Update the discount on the server
        this._discountService.updateDiscount(this.discountId, toBeSendPayload[0])
            .subscribe((resp) => {
                // Set loading to false
                this.isLoading = false;

                // Show a success message
                this.showFlashMessage('success');

            },((error) => {
                // Set loading to false
                    this.isLoading = false;

                    console.error(error);

                    if (error.status === 417) {
                        // Open the confirmation dialog
                        const confirmation = this._fuseConfirmationService.open({
                            title  : 'Discount date overlap',
                            message: 'Your discount date range entered overlapping with existing discount date! Please change your date range',
                            actions: {
                                confirm: {
                                    label: 'OK'
                                },
                                cancel : {
                                    show : false,
                                }
                            }
                        });
                    }
                    // Show a success message
                    this.showFlashMessage('error');
                }
            ));

            // Set delay before closing the details window
            setTimeout(() => {

                // close the window
                this.cancel();

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }, 1000);
    }

    deleteSelectedDiscount(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete discount',
            message: 'Are you sure you want to remove this discount? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {

            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {

                // Get the discount object
                const discount = this.editOrderDiscountForm.get('step1').value;

                // Delete the discount on the server
                this._discountService.deleteDiscount(discount.id).subscribe(() => {

                    // Set delay before closing the details window
                    setTimeout(() => {

                        // close the window
                        this.cancel();

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }, 1000);
                });
            }
        });
    }

    cancel(){
        this.dialogRef.close();
    }

    checkButton(){
        console.info('this.editOrderDiscountForm ',this.editOrderDiscountForm.value);
        console.info('form array',this.editOrderDiscountForm.get('step2')['controls']);
    }

    // --------------------------------------
    //       Discount Tier Section
    // --------------------------------------

    insertTierToDiscount(){

        // check condition first before pass to backend
        if(this.calculationType === 'PERCENT' && this.discountAmount>100){

            const confirmation = this._fuseConfirmationService.open({
                title  : 'Exceed maximum amount discount percentage',
                message: 'Please change your discount amount for percentage calculation type',
                actions: {
                    confirm: {
                        label: 'OK'
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

        // Create the discount
        this._discountService.createDiscountTier(this.selectedDiscount.id,discountTier)
            .subscribe((response) => {
                
                this.storeDiscountTierList = this.editOrderDiscountForm.get('step2') as FormArray;

                // since backend give full discount tier list .. (not the only one that have been created only)
                this.storeDiscountTierList.clear();

                response["data"].forEach(item => {
                    this.storeDiscountTierList.push(this._formBuilder.group(item));
                });

                //disable button add
                this.isDisplayAddTier=false;
                //clear the input
                (<any>this.startTotalSalesAmount)='';
                (<any>this.discountAmount)='';
                this.calculationType='';

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }, (error) => {
                console.error(error);
                if (error.status === 417) {
                    // Open the confirmation dialog
                    const confirmation = this._fuseConfirmationService.open({
                        title  : 'Minimum subtotal overlap',
                        message: 'Your minimum subtotal entered overlapping with existing amount! Please change your minimum subtotal',
                        actions: {
                            confirm: {
                                label: 'OK'
                            },
                            cancel : {
                                show : false,
                            }
                        }
                    });
                }
            });
    }

    deleteSelectedDiscountTier(discountTierId: string): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete discount tier',
            message: 'Are you sure you want to remove this discount tier? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {

            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {

                // Delete the discount on the server
                this._discountService.deleteDiscountTier(this.selectedDiscount.id, discountTierId).subscribe(() => {
                    
                    this.storeDiscountTierList = this.editOrderDiscountForm.get('step2') as FormArray;

                    let index = (this.storeDiscountTierList.value.findIndex(x => x.id === discountTierId));

                    // remove from discount tier list
                    if (index > -1) {
                        this.storeDiscountTierList.removeAt(index);
                    }

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            }
        });
    }

    updateSelectedDiscountTier(discountTier){

        // check condition first before pass to backend

        if(discountTier.value.calculationType === 'PERCENT' && discountTier.value.discountAmount>100){

            const confirmation = this._fuseConfirmationService.open({
                title  : 'Exceed maximum amount discount percentage',
                message: 'Please change your discount amount for percentage calculation type',
                actions: {
                    confirm: {
                        label: 'OK'
                    },
                    cancel : {
                        show : false,
                    }
                }
            });
            this.storeDiscountTierListValueEditMode = [true];

            return;
        }

        // Update the discount on the server
        this._discountService.updateDiscountTier(discountTier.value.storeDiscountId, discountTier.value).subscribe(() => {
            // Show a success message
            this.showFlashMessage('success');
        }, error => {
            console.error(error);
            if (error.status === 417) {
                // Open the confirmation dialog
                const confirmation = this._fuseConfirmationService.open({
                    title  : 'Minimum subtotal overlap',
                    message: 'Your minimum subtotal entered overlapping with existing amount! Please change your minimum subtotal',
                    actions: {
                        confirm: {
                            label: 'OK'
                        },
                        cancel : {
                            show : false,
                        }
                    }
                });
            }
        });
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

    setValueToTimeSelector(discount){

        //=======================================================
        //                      Start Time
        //=======================================================

        let _itemStartTimeHour = discount.startTime.split(":")[0];
        if (discount.startTime.split(":")[0] > 12) {
            _itemStartTimeHour = _itemStartTimeHour - 12;
            _itemStartTimeHour = ((_itemStartTimeHour < 10) ? '0' : '') + _itemStartTimeHour;    
        }                    

        let _itemStartTimeMinute = discount.startTime.split(":")[1];

        let _itemStartTimeAMPM : 'AM' | 'PM';
        if (discount.startTime.split(":")[0] >= 12) {
            _itemStartTimeAMPM = "PM";
        } else {
            _itemStartTimeAMPM = "AM";
        }

        this.editOrderDiscountForm.get('step1.startTime').setValue(new TimeSelector(_itemStartTimeHour,_itemStartTimeMinute, _itemStartTimeAMPM));        

        //=======================================================
        //                      End Time
        //=======================================================
        
        let _itemEndTimeHour = discount.endTime.split(":")[0];
        if (discount.endTime.split(":")[0] > 12) {
            _itemEndTimeHour = _itemEndTimeHour - 12;
            _itemEndTimeHour = ((_itemEndTimeHour < 10) ? '0' : '') + _itemEndTimeHour;    
        }

        let _itemEndTimeMinute = discount.endTime.split(":")[1];

        let _itemEndTimeAMPM : 'AM' | 'PM';
        if (discount.endTime.split(":")[0] >= 12) {
            _itemEndTimeAMPM = "PM";
        } else {
            _itemEndTimeAMPM = "AM";
        }

        this.editOrderDiscountForm.get('step1.endTime').setValue(new TimeSelector(_itemEndTimeHour,_itemEndTimeMinute, _itemEndTimeAMPM));
        
        return;
    }

    checkDateTime() {
        // ==============================================================
        //                     Start Date & Time
        // ==============================================================

        // Get startDate
        let _startDate = this.editOrderDiscountForm.get('step1').get('startDate').value
        // Get startTime
        let startTime = this.editOrderDiscountForm.get('step1.startTime').value;
        let _startTime;        

        // Split start date format
        var selectedStartDay = _startDate.split("-")[2];
        var selectedStartMonth = _startDate.split("-")[1];
        var selectedStartYear = _startDate.split("-")[0];


        if (startTime.timeAmPm === "PM" && startTime.timeHour !== "12") {
            _startTime = parseInt(startTime.timeHour) + 12;
        } else if (startTime.timeAmPm === "AM" && startTime.timeHour === "12") {
            _startTime = parseInt(startTime.timeHour) - 12;
            _startTime = (_startTime === 0) ? "00" : _startTime;
        } else {
            _startTime = startTime.timeHour;
        }

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
        let _endDate = this.editOrderDiscountForm.get('step1').get('endDate').value
        // Get endTime
        let endTime = this.editOrderDiscountForm.get('step1.endTime').value;
        let _endTime;

        // Split end date format
        var selectedEndDay = _endDate.split("-")[2];
        var selectedEndMonth = _endDate.split("-")[1];
        var selectedEndYear = _endDate.split("-")[0];

        if (endTime.timeAmPm === "PM" && endTime.timeHour !== "12") {
            _endTime = parseInt(endTime.timeHour) + 12;
        } else if (endTime.timeAmPm === "AM" && endTime.timeHour === "12") {
            _endTime = parseInt(endTime.timeHour) - 12;
            _endTime = (_endTime === 0) ? "00" : _endTime;
        } else {
            _endTime = endTime.timeHour;
        }

        // Set new end date and time
        const endDateTime = new Date();
        endDateTime.setDate(selectedEndDay)
        endDateTime.setMonth(selectedEndMonth - 1)
        endDateTime.setFullYear(selectedEndYear)
        endDateTime.setHours(_endTime,endTime.timeMinute,0)

        this.changeEndTime = _endTime + ":" + endTime.timeMinute

        // ==============================================================
        //              Date and time range Display Error
        // ==============================================================        

        // this will set what need to be sent to backend
        const discountBody = {

            id          : this.discountId,
            startDate   : this.editOrderDiscountForm.get('step1.startDate').value,
            endDate     : this.editOrderDiscountForm.get('step1.endDate').value,
            startTime   : _startTime + ":" + startTime.timeMinute,
            endTime     : _endTime + ":" + endTime.timeMinute,
            isActive    : this.editOrderDiscountForm.get('step1.isActive').value === 'EXPIRED'? false
                            :this.editOrderDiscountForm.get('step1.isActive').value === 'ACTIVE'? true
                            :this.editOrderDiscountForm.get('step1.isActive').value === 'INACTIVE'? false
                            :false,
            discountType: this.editOrderDiscountForm.get('step1.discountType').value            
        };        
 
        if(startDateTime > endDateTime && _endDate !== ""){            
            this.dateAlert ="Date and Time Range incorrect !";
            this.disabledProceed = true;
        } else if(endTime.timeMinute === "--" || _endTime === "--" || endTime.timeAmPm === "--"){
            this.disabledProceed = true;
        } else {
            // check validate at backend
            if(this.checkExistingDate(discountBody)) {
                this.disabledProceed = true;
            }
            this.dateAlert = " ";
            this.disabledProceed = false;
        }
    }

    //post validate (validateStoreDiscount)
    async checkExistingDate(discountBody){
        
        let status = await this._discountService.getExistingDate(discountBody);
        if (status === 417){
            this.dateAlert ="Date selected is overlapped with existing date, please select another date !";
            this.disabledProceed = true;
        }
    }

    // changeTime(){
    //     //===========Start Time==================
    //     let pickStartTime =this.editOrderDiscountForm.get('step1.startTime').value;
    //     let _pickStartTime;

    //     if ((<any>pickStartTime).timeAmPm === "PM") {
    //         _pickStartTime = parseInt((<any>pickStartTime).timeHour) + 12;
    //     } else {
    //         _pickStartTime = (<any>pickStartTime).timeHour;
    //     }
    //     const changePickStartTime = new Date();
    //     changePickStartTime.setHours(_pickStartTime,(<any>pickStartTime).timeMinute,0);
        
    //     this.changeStartTime= String(changePickStartTime.getHours()).padStart(2, "0")+':'+String(changePickStartTime.getMinutes()).padStart(2, "0");    
        
    //     //==============End time===================
    //     let pickEndTime = this.editOrderDiscountForm.get('step1.endTime').value;
    //     let _pickEndTime;

    //     if ((<any>pickEndTime).timeAmPm === "PM") {
    //         _pickEndTime = parseInt((<any>pickEndTime).timeHour) + 12;
    //     } else {
    //         _pickEndTime = (<any>pickEndTime).timeHour;
    //     }
    //     const changePickEndTime = new Date();
    //     changePickEndTime.setHours(_pickEndTime,(<any>pickEndTime).timeMinute,0);
        
    //     this.changeEndTime= String(changePickEndTime.getHours()).padStart(2, "0")+':'+String(changePickEndTime.getMinutes()).padStart(2, "0");  
        
    //     return;
    
    // }
}
