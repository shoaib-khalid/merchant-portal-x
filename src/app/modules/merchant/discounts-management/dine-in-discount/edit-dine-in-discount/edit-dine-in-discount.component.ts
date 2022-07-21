import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { Subject } from 'rxjs';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { DiscountManagementValidationService } from '../../discounts-management.validation.service';
import { debounce } from 'lodash';

@Component({
    selector: 'app-edit-dine-in-discount',
    templateUrl: './edit-dine-in-discount.component.html',
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
export class EditDineInDiscountDialogComponent implements OnInit {

    // get current store
    store$: Store;
    originalStartDate: any;
    originalEndDate: any;
    
    editOrderDiscountForm: FormGroup;
    // discountId: string;
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
        public dialogRef: MatDialogRef<EditDineInDiscountDialogComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _storesService: StoresService,
        // private createOrderDiscount:CreateOrderDiscount,
        @Inject(MAT_DIALOG_DATA) public data: MatDialog
    ) 
    { 
    }

    // ----------------------------------------------------------------------------------
    //                          @ Lifecycle hooks
    // ----------------------------------------------------------------------------------
    ngOnInit(): void {

        //get value when open matdialot
        // this.discountId = this.data['discountId'];
        
        // Horizontal stepper form
        this.editOrderDiscountForm = this._formBuilder.group({
            //Main Discount
            step1: this._formBuilder.group({
                id                  : [''],
                discountName        : ['', Validators.required],
                isActive            : ['', Validators.required],
                normalPriceItemOnly : [''],
                storeId             : [''], // not used
        
            }),
            //Tier List
            step2: this._formBuilder.array([]),
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

}
