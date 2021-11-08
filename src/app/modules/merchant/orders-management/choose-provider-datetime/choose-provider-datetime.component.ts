import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-choose-provider-datetime',
  templateUrl: './choose-provider-datetime.component.html'
})
export class ChooseProviderDateTimeComponent implements OnInit {

  country:any="";
  image:any;
  showButton: boolean = false;
  date: string;
  mindate: string;
  time: string;
  mintime: string;

  constructor(
    public dialogRef: MatDialogRef<ChooseProviderDateTimeComponent>,
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
    this.dialogRef.close({ date: this.date, time: this.time});
  }

  cancelPickupDateTime(){
    this.dialogRef.close();
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
