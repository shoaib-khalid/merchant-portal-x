import { Component, OnInit,Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { JwtService } from 'app/core/jwt/jwt.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { InventoryService } from 'app/core/product/inventory.service';
import { map, Observable, Subject, switchMap } from 'rxjs';
import { ApiResponseModel, ProductCategory } from 'app/core/product/inventory.types';
import { StoresService } from 'app/core/store/store.service';


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
    filteredOptions: Observable<string[]>;
    options: string[] = ['One', 'Two', 'Three'];
    parentCategoriesOptions: ProductCategory[];

    parentSelectedCategory:string='';
    storeVerticalCode: string = '';

    private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    public dialogRef: MatDialogRef<AddCategoryComponent>,
    private _jwt: JwtService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _inventoryService: InventoryService,
    private _formBuilder: FormBuilder,
    private _storesService: StoresService,
    @Inject(MAT_DIALOG_DATA) public data: MatDialog
  ) { }

/**
 * Getter for storeId
 */
    get storeId(): string
    {
        return localStorage.getItem('storeId') ?? '';
    } 

// -----------------------------------------------------------------------------------------------------
// @ Accessors
// -----------------------------------------------------------------------------------------------------

// -----------------------------------------------------------------------------------------------------
// @ Lifecycle hooks
// -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // Create the selected product form
        this.addCategoryForm = this._formBuilder.group({
            name             : ['',[Validators.required]],
            thumbnailUrl     : [[]],
            imagefiles:[[]],
        });

      // Create the selected product form
      this.addCategoryForm = this._formBuilder.group({
        name             : ['',[Validators.required]],
        parentCategoryId : [''],
        thumbnailUrl     : [[]],
        imagefiles:[[]],
      });

      //Get the vertical code for this store id first then we get the parent categories
        this._storesService.getStoreById(this.storeId)
        .pipe(
            map((response)=>{
                return this.storeVerticalCode = response.verticalCode;
            }),
            switchMap((storeVerticalCode:string)=>this._inventoryService.getParentCategories(0, 20, 'name', 'asc', '',storeVerticalCode)
            ),
        )
        .subscribe((categories) => {
            this.parentCategoriesOptions = categories.data["content"];
        });
  
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------  

    addNewCategory() {
        this.addCategoryForm.get('thumbnailUrl').patchValue(this.thumbnailUrl);
        this.addCategoryForm.get('imagefiles').patchValue(this.imagesFile);

        if (this.addCategoryForm.invalid)
        {
            return;
        }

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
