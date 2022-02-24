import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { Subject } from 'rxjs';
// import { DiscountsService } from '../order-discount-list/order-discount-list.service';
// import { ApiResponseModel, Discount, StoreDiscountTierList } from '../order-discount-list/order-discount-list.types';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ApiResponseModel, Discount, StoreDiscountTierList } from '../../order-discount/order-discount-list/order-discount-list.types';
import { DiscountsService } from '../../order-discount/order-discount-list/order-discount-list.service';

@Component({
  selector: 'app-edit-product-discount',
  templateUrl: './edit-product-discount.component.html',
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
  `]
})
export class EditProductDiscountDialogComponent implements OnInit {

    productDiscountStepperForm: FormGroup;
    discountId:string;
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


  constructor(
    public dialogRef: MatDialogRef<EditProductDiscountDialogComponent>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _discountService: DiscountsService,
    private _fuseConfirmationService: FuseConfirmationService,
    // private createOrderDiscount:CreateOrderDiscount,
    @Inject(MAT_DIALOG_DATA) public data: MatDialog
  ) { }

  ngOnInit(): void {

    //get value when open matdialot
    this.discountId = this.data['discountId'];
    
    // Horizontal stepper form
    this.productDiscountStepperForm = this._formBuilder.group({
        //Main Discount
        step1: this._formBuilder.group({
            id               : [''],
            discountName   : [''],
            discountType : [''],
            startDate : [''],
            endDate : [''],
            startTime : [''],
            endTime : [''],
            isActive : [''],
            maxDiscountAmount : [''],
            normalPriceItemOnly : [''],
            storeId          : [''], // not used
            storeDiscountTierList : this._formBuilder.array([]),
     
        }),
        //Product Discount
        step2: this._formBuilder.array([
        
        ]),
    });

        this._discountService.getDiscountByGuid(this.discountId)
        .subscribe((response:ApiResponseModel<Discount>) => {

            //Set the selected discount
            this.selectedDiscount = response.data;

            // Fill the form step 1
            this.productDiscountStepperForm.get('step1').patchValue(response.data);

            //set value for time in tieme selector
            this.setValueToTimeSelector(response.data);

            //after we set the form with custom field time selector then we display the details form
            this.loadDetails =true;
            
            //Take note that in product discount it will be empty array only cause backedn structure like that 
            // clear discount tier form array
            (this.productDiscountStepperForm.get('step1.storeDiscountTierList') as FormArray).clear();
            
            // load discount tier form array with data frombackend
            response.data.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
                this.storeDiscountTierList = this.productDiscountStepperForm.get('step1.storeDiscountTierList') as FormArray;
                this.storeDiscountTierList.push(this._formBuilder.group(item));
            });

            console.log('check form',this.productDiscountStepperForm.get('step1').value);
            
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    // }
    // //for create mode
    // else{
    //     this.loadDetails =true;
    // }

  }

  cancel(){
    this.dialogRef.close();
  }

  updateSelectedDiscount(): void
  {
      this.changeTime();
      let sendPayload = [this.productDiscountStepperForm.get('step1').value];
      let toBeSendPayload=sendPayload.
      map((x)=>(
          {
              startTime:this.changeStartTime,
              endTime:this.changeEndTime,
              discountName: x.discountName,
              discountType:x.discountType,
              endDate: x.endDate,
              id: x.id,
              isActive: x.isActive,
              maxDiscountAmount: x.maxDiscountAmount,
              normalPriceItemOnly: x.normalPriceItemOnly,
              startDate: x.startDate,
              storeDiscountTierList: x.storeDiscountTierList,
              storeId: x.storeId,
          }
          ));

      // Update the discount on the server
      this._discountService.updateDiscount(this.discountId, toBeSendPayload[0])
          .subscribe((resp) => {
         
          }, error => {
              console.error(error);

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
              }
          );

          this.cancel();
  }

  setValueToTimeSelector(discount){

    //=====================START TIME =====================
    let _pickStartTimeHour = discount.startTime.split(":")[0];
    let _pickStartTimeMinute = discount.startTime.split(":")[1];

    let _pickStartTimeAMPM : 'AM' | 'PM';
    if ((<any>_pickStartTimeHour) > 12) {
        _pickStartTimeAMPM = "PM";
        (<any>_pickStartTimeHour) = (<any>_pickStartTimeHour) - 12;
        (<any>_pickStartTimeHour) = (((<any>_pickStartTimeHour) < 10) ? '0' : '') + _pickStartTimeHour;    

    } else {
        _pickStartTimeAMPM = "AM";
    }

    this.productDiscountStepperForm.get('step1.startTime').setValue(new TimeSelector(_pickStartTimeHour,_pickStartTimeMinute, _pickStartTimeAMPM));

    //=====================/ START TIME =====================

    //=====================END TIME =====================

    let _pickEndTimeHour = discount.endTime.split(":")[0];
    let _pickEndTimeMinute = discount.endTime.split(":")[1];

    let _pickEndTimeAMPM : 'AM' | 'PM';
    if (<any>_pickEndTimeHour > 12) {
        _pickEndTimeAMPM = "PM";
        (<any>_pickEndTimeHour) = (<any>_pickEndTimeHour) - 12;
        (<any>_pickEndTimeHour) = (((<any>_pickEndTimeHour) < 10) ? '0' : '') + _pickEndTimeHour;    

    } else {
        _pickEndTimeAMPM = "AM";
    }
    
    this.productDiscountStepperForm.get('step1.endTime').setValue(new TimeSelector(_pickEndTimeHour,_pickEndTimeMinute, _pickEndTimeAMPM));

    //===================== / END TIME =====================
    return;
  }

  ngOnDestroy(): void
  {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
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

  changeTime(){
    //===========Start Time==================
    let pickStartTime =this.productDiscountStepperForm.get('step1.startTime').value;
    let _pickStartTime;

    if ((<any>pickStartTime).timeAmPm === "PM") {
        _pickStartTime = parseInt((<any>pickStartTime).timeHour) + 12;
    } else {
        _pickStartTime = (<any>pickStartTime).timeHour;
    }
    const changePickStartTime = new Date();
    changePickStartTime.setHours(_pickStartTime,(<any>pickStartTime).timeMinute,0);
    
    this.changeStartTime= String(changePickStartTime.getHours()).padStart(2, "0")+':'+String(changePickStartTime.getMinutes()).padStart(2, "0");    
    
    //==============End time===================
    let pickEndTime = this.productDiscountStepperForm.get('step1.endTime').value;
    let _pickEndTime;

    if ((<any>pickEndTime).timeAmPm === "PM") {
        _pickEndTime = parseInt((<any>pickEndTime).timeHour) + 12;
    } else {
        _pickEndTime = (<any>pickEndTime).timeHour;
    }
    const changePickEndTime = new Date();
    changePickEndTime.setHours(_pickEndTime,(<any>pickEndTime).timeMinute,0);
    
    this.changeEndTime= String(changePickEndTime.getHours()).padStart(2, "0")+':'+String(changePickEndTime.getMinutes()).padStart(2, "0");  
    
    return;
  
  }


}
