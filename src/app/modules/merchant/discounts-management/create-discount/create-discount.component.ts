import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'dialog-create-discount',
  templateUrl: './create-discount.component.html'
})
export class CreateDiscountComponent implements OnInit {

  disabledProceed: boolean = true;

  discountName: string;
  status: boolean;
  discountType: string;
  isActive: boolean;
  maxDiscountAmount: string;
  normalPriceItemOnly: boolean;

  checkdate = false;
  checkname = false;
  checkstatus = false;
  checktype = false;
  checkdiscountamount = false;

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

  message: string = "";

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

  addNewDiscount() {
    this.dialogRef.close({ 
        status: true ,
        discountName: this.discountName,
        discountOn: this.discountType,
        startDate: this.startDate,
        startTime: this.startTime,
        endDate: this.endDate,
        endTime: this.endTime,
        isActive :this.isActive,
        maxDiscountAmount :this.maxDiscountAmount,
        normalPriceItemOnly : this.normalPriceItemOnly
    });
  }

  cancelPickupDateTime(){
    this.dialogRef.close({ status: false });
  }
  
  checkName(){           
        // check discount name
        if (this.discountName) {
            this.checkname = true;
            this.message = "";
        }else{
            this.checkname = false;
            this.message = "Please insert discount name";
        }
        
  }

  checkDateTime(){
         // check min end date not less than min start date
         if (this.startDate && this.startTime) {
            // set minimum end date to current selected date
            this.isDisabledStartDateTime = false;
            this.minEndDate = this.startDate;
        }
        // check date
        if (this.startTime && this.endTime && this.endDate && this.startDate) {        
            if (this.startDate < this.endDate){
                this.checkdate = true;
            } else if (this.startDate == this.endDate) {
                if (this.startTime <= this.endTime) {
                    this.checkdate = true;
                } else {
                    this.checkdate = false;
                    this.message = "Date/time range incorrect";
                }
            }
        }
  }

  checkStatus(){
    //check status
     if (this.isActive){
        this.checkstatus = true;
        this.message = ""
        }else{
            this.checkstatus = false;
            this.message = "Please select status option"
        }
  }

  checkDiscountType(){
        //check discount type
        if (this.discountType){
            this.checktype = true;
            this.message = ""
        }else{
            this.checktype = false;
            this.message = "Please select discount type option"
        }
  }

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

  checkForm(){
    
    if (this.checkname === true && this.checkdate === true && this.checkstatus === true && this.checktype === true && this.checkdiscountamount == true) {
        this.disabledProceed = false;
    } else {
        this.disabledProceed = true;
    }
    
  }
}
