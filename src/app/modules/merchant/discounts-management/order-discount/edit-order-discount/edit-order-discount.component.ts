import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { Subject } from 'rxjs';
import { DiscountsService } from '../order-discount-list/order-discount-list.service';
import { ApiResponseModel, Discount } from '../order-discount-list/order-discount-list.types';

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
            discountName   : ['', [Validators.required]],
            discountType : ['', Validators.required],
            startDate : ['', Validators.required],
            endDate : ['', Validators.required],
            // startTime:this._formBuilder.group({
            //     timeHour: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
            //     timeMinute: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
            //     timeAmPm: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
            //   }),
            // startTime:new FormControl('', [Validators.required]),
            startTime : [''],
            endTime : [''],
            // endTime:this._formBuilder.group({
            //     //     timeHour: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
            //     //     timeMinute: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
            //     //     timeAmPm: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
            //  }),
            isActive : ['', Validators.required],
            maxDiscountAmount : ['', Validators.required],
            normalPriceItemOnly : [''],     
        }),
        //Tier List
        step2: this._formBuilder.array([
            this._formBuilder.group({
                calculationType : [''],
                discountAmount : [''], 
                startTotalSalesAmount:[''],
            }),
        ]),
    });

    // Get the discount by id
    this._discountService.getDiscountByGuid(this.discountId)
    .subscribe((response:ApiResponseModel<Discount>) => {

        //Set the selected discount
        this.selectedDiscount = response.data;

        // Fill the form
        this.horizontalStepperForm.get('step1').patchValue(response.data);

        console.log('checking sebelum',this.horizontalStepperForm.get('step1').value);

        console.log("iman nak check certain value je,",this.horizontalStepperForm.get('step1').get('startTime').value);

        //set value for time in tieme selector
        this.setValueToTimeSelector(response.data);

        this.loadDetails =true;

        console.log('checcckkk form selepas:::',this.horizontalStepperForm.get('step1').value);

        // clear discount tier form array
        //(this.selectedDiscountForm.get('storeDiscountTierList') as FormArray).clear();
        
        // load discount tier form array with data frombackend
        // response.data.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
        //     this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;
        //     this.storeDiscountTierList.push(this._formBuilder.group(item));
        // });
        

        // Mark for check
        this._changeDetectorRef.markForCheck();
    });
  }

  cancel(){
    this.dialogRef.close({ status: false });
  }

  checkButton(){
    console.log('this.horizontalStepperForm ',this.horizontalStepperForm.value.step1);

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
