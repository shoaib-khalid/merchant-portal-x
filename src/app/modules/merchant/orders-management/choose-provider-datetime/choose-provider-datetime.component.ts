import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { DialogData } from '../../social-media/flow-builder/components/action-dialog/action-dialog.component';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';

@Component({
  selector: 'app-choose-provider-datetime',
  templateUrl: './choose-provider-datetime.component.html'
})
export class ChooseProviderDateTimeComponent implements OnInit {

  image:any;
  showButton: boolean = false;
  date: string;
  mindate: string;
  time: string;
  mintime: string;
  changeTimePickup:string;

  constructor(
    public dialogRef: MatDialogRef<ChooseProviderDateTimeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  ngOnInit(): void {
    let today = new Date();
    let yy = today.getFullYear();
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let dd = String(today.getDate()).padStart(2, '0');
    this.mindate = yy + '-' + mm + '-' + dd;

    this.image = {
      src: this.data["providerImage"],
      atl: this.data["name"]
    };
    // new TimeSelector ('00','00','AM')
  }

  setPickupDateTime() {
    this.changeTime();    
    this.dialogRef.close({ date: this.date, time: this.changeTimePickup});
  }

  cancelPickupDateTime(){
    this.dialogRef.close("cancelled");
  }
  
  checkDate(){
    if (!this.date || !this.time) {

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

  changeTime(){
    //Pickup Time
    let pickTime = this.time;
    let _pickTime;

    if ((<any>pickTime).timeAmPm === "PM") {
        _pickTime = parseInt((<any>pickTime).timeHour) + 12;
    } else {
        _pickTime = (<any>pickTime).timeHour;
    }
    const pickUpTime = new Date();
    pickUpTime.setHours(_pickTime,(<any>pickTime).timeMinute,0);

    this.changeTimePickup= pickUpTime.getHours()+':'+String(pickUpTime.getMinutes()).padStart(2, "0");    
    return this.changeTimePickup;
  
  }
}
