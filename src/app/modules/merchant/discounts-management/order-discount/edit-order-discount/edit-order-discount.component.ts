import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { Subject } from 'rxjs';
import { DiscountsService } from '../order-discount-list/order-discount-list.service';
import { ApiResponseModel, Discount, StoreDiscountTierList } from '../order-discount-list/order-discount-list.types';

@Component({
  selector: 'app-edit-order-discount',
  templateUrl: './edit-order-discount.component.html'
})
export class EditOrderDiscountDialogComponent implements OnInit {

    horizontalStepperForm: FormGroup;
    discountId:string;
    selectedDiscount: Discount | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    loadDetails:boolean=false;
    storeDiscountTierList: FormArray;




  constructor(
    public dialogRef: MatDialogRef<EditOrderDiscountDialogComponent>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _discountService: DiscountsService,
    @Inject(MAT_DIALOG_DATA) public data: MatDialog
  ) { }

  ngOnInit(): void {

    //get value when open matdialot
    this.discountId = this.data['discountId'];

    // Horizontal stepper form
    this.horizontalStepperForm = this._formBuilder.group({
        //Main Discount
        step1: this._formBuilder.group({
            discountName   : [''],
            discountType : [''],
            startDate : [''],
            endDate : [''],
            startTime : [''],
            endTime : [''],
            isActive : [''],
            maxDiscountAmount : [''],
            normalPriceItemOnly : [''],     
        }),
        //Tier List
        step2: this._formBuilder.array([
        
        ]),
    });

    // Get the discount by id
    this._discountService.getDiscountByGuid(this.discountId)
    .subscribe((response:ApiResponseModel<Discount>) => {

        //Set the selected discount
        this.selectedDiscount = response.data;

        // Fill the form step 1
        this.horizontalStepperForm.get('step1').patchValue(response.data);

        //set value for time in tieme selector
        this.setValueToTimeSelector(response.data);

        //after we set the form with custom field time selector then we display the details
        this.loadDetails =true;

        // clear discount tier form array
        (this.horizontalStepperForm.get('step2') as FormArray).clear();
        
        // load discount tier form array with data frombackend
        response.data.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
            this.storeDiscountTierList = this.horizontalStepperForm.get('step2') as FormArray;
            this.storeDiscountTierList.push(this._formBuilder.group(item));
        });
        
        // Mark for check
        this._changeDetectorRef.markForCheck();
    });
  }

  cancel(){
    this.dialogRef.close({ status: false });
  }

  checkButton(){
    console.log('this.horizontalStepperForm ',this.horizontalStepperForm.value);
    console.log('form array',this.horizontalStepperForm.get('step2')['controls']);
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

    this.horizontalStepperForm.get('step1.startTime').setValue(new TimeSelector(_pickStartTimeHour,_pickStartTimeMinute, _pickStartTimeAMPM));

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
    
    this.horizontalStepperForm.get('step1.endTime').setValue(new TimeSelector(_pickEndTimeHour,_pickEndTimeMinute, _pickEndTimeAMPM));

    //===================== / END TIME =====================
    return;
  }

  ngOnDestroy(): void
  {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
  }


}
