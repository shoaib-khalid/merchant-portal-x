import { Component, OnInit,Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { JwtService } from 'app/core/jwt/jwt.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { InventoryService } from 'app/core/product/inventory.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'dialog-status',
  templateUrl: './status.component.html'
})
export class StatusComponent implements OnInit {
  
    disabledProceed: boolean = true;
    checkname = false;
    checkrefId = false;
    checktoken = false;

    status: string;
    id: string;
    refId: string;
    userId: string;
    channelName: string;
    token: string;
  
    message: string = "";
    referenceId: any;

    statusForm: FormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();


    // product assets
    thumbnailUrl: any = [];
    imagesFile: any = [];
    currentImageIndex: number = 0;

  constructor(
    public dialogRef: MatDialogRef<StatusComponent>,
    private _jwt: JwtService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _inventoryService: InventoryService,
    private _formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: MatDialog
  ) { }

// -----------------------------------------------------------------------------------------------------
// @ Accessors
// -----------------------------------------------------------------------------------------------------

  get accessToken(): string
  {
      return localStorage.getItem('accessToken') ?? '';
  }

// -----------------------------------------------------------------------------------------------------
// @ Lifecycle hooks
// -----------------------------------------------------------------------------------------------------

  ngOnInit(): void {
      // Create the selected product form
      this.statusForm = this._formBuilder.group({
        snoozeReason     : ['',[Validators.required]],
        isSnooze         : [[]],
        snoozeDuration   : [[]],
    });

  }

// -----------------------------------------------------------------------------------------------------
// @ Public methods
// -----------------------------------------------------------------------------------------------------  

  manageStatus() {
    this.statusForm.get('thumbnailUrl').patchValue(this.thumbnailUrl);
    this.statusForm.get('imagefiles').patchValue(this.imagesFile);
    console.log('this.statusForm.value::',this.statusForm.value);

    this.dialogRef.close(this.statusForm.value);
  }

  cancelManageStatus(){
    this.dialogRef.close({ status: false });
  }

}
