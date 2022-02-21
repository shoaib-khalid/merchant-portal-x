import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-edit-order-discount',
  templateUrl: './edit-order-discount.component.html'
})
export class EditOrderDiscountDialogComponent implements OnInit {

    horizontalStepperForm: FormGroup;


  constructor(
    public dialogRef: MatDialogRef<EditOrderDiscountDialogComponent>,
    private _formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {

    // Horizontal stepper form
    this.horizontalStepperForm = this._formBuilder.group({
        //Main Discount
        step1: this._formBuilder.group({
            discountName   : ['', [Validators.required]],
            discountType : ['', Validators.required],
            startDate : ['', Validators.required],
            endDate : ['', Validators.required],
            startTime : ['', Validators.required],
            endTime : ['', Validators.required],
            isActive : ['', Validators.required],
            maxDiscountAmount : ['', Validators.required],
            normalPriceItemOnly : [''],     
        }),
        //Tier List
        step2: this._formBuilder.group({
            firstName: ['', Validators.required],
            lastName : ['', Validators.required],
            userName : ['', Validators.required],
            about    : ['']
        }),
    });
  
  }


}
