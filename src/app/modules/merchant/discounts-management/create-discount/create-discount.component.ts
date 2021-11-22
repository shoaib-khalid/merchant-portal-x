import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'dialog-create-discount',
  templateUrl: './create-discount.component.html'
})
export class CreateDiscountComponent implements OnInit {

  country:any="";
  discountName: string;
  image:any;
  showButton: boolean = false;
  date: string;
  mindate: string;
  time: string;
  mintime: string;
  status: boolean;

  constructor(
    public dialogRef: MatDialogRef<CreateDiscountComponent>,
  ) { }

  ngOnInit(): void {
    let today = new Date();
    let yy = today.getFullYear();
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let dd = String(today.getDate()).padStart(2, '0');
    this.mindate = yy + '-' + mm + '-' + dd;

    this.image = {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png",
      atl: "No Image"
    };
  }

  setPickupDateTime() {
    this.dialogRef.close({ date: this.date, time: this.time , status: true});
  }

  cancelPickupDateTime(){
    this.dialogRef.close({ status: false });
  }
  
  checkDate(){
    
    if (!this.date) {

    } else {
      this.showButton = true;
    }
  }

  checkTime(){
    if (!this.date || !this.time) {
      
    } else {
      this.showButton = true;
    }
  }
}
