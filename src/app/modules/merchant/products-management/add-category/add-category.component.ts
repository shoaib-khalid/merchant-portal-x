import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { JwtService } from 'app/core/jwt/jwt.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'dialog-add-category',
  templateUrl: './add-category.component.html'
})
export class AddCategoryComponent implements OnInit {
  
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

    addCategoryForm: FormGroup;

    // product assets
    thumbnailUrl: any = [];
    imagesFile: any = [];
    currentImageIndex: number = 0;

  constructor(
    public dialogRef: MatDialogRef<AddCategoryComponent>,
    private _jwt: JwtService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
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
      this.addCategoryForm = this._formBuilder.group({
        id               : [''],
        name             : ['',[Validators.required]],
        storeId          : [''],
        thumbnailUrl     : [[]]
    });

  }

// -----------------------------------------------------------------------------------------------------
// @ Public methods
// -----------------------------------------------------------------------------------------------------  

  addNewCategory() {
    this.addCategoryForm.get('thumbnailUrl').patchValue(this.thumbnailUrl);
    this.dialogRef.close(this.addCategoryForm.value);
  }
  cancelCreateCategory(){
    this.dialogRef.close({ status: false });
  }

    // --------------------------------------
    // Product Assets/Images Section
    // --------------------------------------
    
    /**
     * Upload avatar
     *
     * @param fileList
     */
    uploadImages(fileList: FileList, thumbnailUrl): Promise<void>
    {
        // Return if canceled
        if ( !fileList.length )
        {
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png'];
        const file = fileList[0];

        // Return if the file is not allowed
        if ( !allowedTypes.includes(file.type) )
        {
            return;
        }
        
        var reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onload = (_event)  => {
            if(!thumbnailUrl.length === true) {
                this.thumbnailUrl.push(reader.result);
                this.imagesFile.push(file);
            } else {
                this.thumbnailUrl[this.currentImageIndex] = reader.result + "";
            }

            this._changeDetectorRef.markForCheck();
        }

        const product = this.addCategoryForm.getRawValue();
    }

    /**
     * Remove the image
     */
    removeImage(): void
    {
        const index = this.currentImageIndex;
        if (index > -1) {
            this.addCategoryForm.get('images').value.splice(index, 1);
        }
    }
}
