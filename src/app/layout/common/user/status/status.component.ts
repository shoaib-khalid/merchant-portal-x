import { Component, OnInit,Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { JwtService } from 'app/core/jwt/jwt.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ValidationErrors } from '@angular/forms';
import { InventoryService } from 'app/core/product/inventory.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { StoresService } from 'app/core/store/store.service';


@Component({
  selector: 'dialog-status',
  templateUrl: './status.component.html'
})
export class storeStatusComponent implements OnInit {
  
    storeId: string;
    message: string = "";

    storeSnoozeForm: FormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();


    // product assets
    thumbnailUrl: any = [];
    imagesFile: any = [];
    currentImageIndex: number = 0;

  constructor(
    public dialogRef: MatDialogRef<storeStatusComponent>,
    private _jwt: JwtService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _inventoryService: InventoryService,
    private _storesService: StoresService,
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
    this.storeSnoozeForm = this._formBuilder.group({
        snoozeReason     : ['',[Validators.required]],
        isOpen           : [false],
        snoozeDuration   : ['',[Validators.required]]
    });

    // ----------------------
    // Get Snooze 
    // ----------------------
    this._storesService.getStoreSnooze().subscribe((response)=>{
        // Fill the form
        this.storeSnoozeForm.patchValue(response);

        //additional patch for isOpen
        this.storeSnoozeForm.get('isOpen').patchValue(!response.isSnooze)

        if(response.isSnooze === false){
            this.storeSnoozeForm.get('snoozeReason').setErrors(null);
            this.storeSnoozeForm.get('snoozeDuration').setErrors(null);
        }
    })    

  }

// -----------------------------------------------------------------------------------------------------
// @ Public methods
// -----------------------------------------------------------------------------------------------------  

  manageStatus() {
    // Do nothing if the form is invalid
    let BreakException = {};
    try {
        Object.keys(this.storeSnoozeForm.controls).forEach(key => {
            const controlErrors: ValidationErrors = this.storeSnoozeForm.get(key).errors;
            if (controlErrors != null) {
                Object.keys(controlErrors).forEach(keyError => {
                    throw BreakException;
                });
            }
        });
    } catch (error) {
        return;
    }

    this.dialogRef.close(
        {
            status : true,
            snoozeReason: this.storeSnoozeForm.get('snoozeReason').value,
            isSnooze: !this.storeSnoozeForm.get('isOpen').value,
            snoozeDuration: this.storeSnoozeForm.get('snoozeDuration').value
        }
    )
  }

  cancelManageStatus(){
    this.dialogRef.close({ status: false });
  }

}
