import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'dialog-product-list',
  templateUrl: './dialog-product-list.component.html'
})
export class DialogProductListComponent implements OnInit {



  constructor(
    public dialogRef: MatDialogRef<DialogProductListComponent>,
  ) { }

  ngOnInit(): void {

  }

  
}
