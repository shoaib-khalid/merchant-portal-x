import { Component, OnInit,Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit {
  message:String;
  constructor(public dialogRef: MatDialogRef<LoadingComponent>, @Inject(MAT_DIALOG_DATA) public data:
  {
    message: any;
  }) {this.message=data.message; }

  ngOnInit(): void {
  }

}
