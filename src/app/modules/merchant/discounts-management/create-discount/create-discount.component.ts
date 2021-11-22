import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'dialog-create-discount',
  templateUrl: './create-discount.component.html'
})
export class CreateDiscountComponent implements OnInit {

  disabledProceed: boolean = true;
  discountName: string;

  startDate: string;
  startTime: string;
  isDisabledStartDateTime: boolean = true;
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

  status: boolean;
  discountType: string;
  isActive: boolean;
  

  constructor(
    public dialogRef: MatDialogRef<CreateDiscountComponent>,
  ) { }

  ngOnInit(): void {
    let today = new Date();
    let yy = today.getFullYear();
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let dd = String(today.getDate()).padStart(2, '0');
    this.minStartDate = yy + '-' + mm + '-' + dd;

    let now = new Date();
    let hh = now.getHours();
    let ms = now.getMinutes();
    let ss = now.getSeconds();
    this.minStartTime = hh + ':' + ms;
  }

  setPickupDateTime() {
    this.dialogRef.close({ 
        status: true ,
        discountName: this.discountName,
        discountOn: this.discountType,
        startDate: this.startDate,
        startTime: this.startTime,
        endDate: this.endDate,
        endTime: this.endTime
    });
  }

  cancelPickupDateTime(){
    this.dialogRef.close({ status: false });
  }
  
  checkDateTime(){
      
    // check min end date not less than min start date
    if (this.startDate && this.startTime) {
        // set minimum end date to current selected date
        this.isDisabledStartDateTime = false;
        this.minEndDate = this.startDate;
       
    }

    console.log("this.startTime", this.startTime);
    console.log("this.endTime", this.endTime);

    if ((this.startTime && this.endTime) && (this.endTime > this.startTime)){
        this.disabledProceed = false;
    }

  }

  checkTime(){

  }
}
