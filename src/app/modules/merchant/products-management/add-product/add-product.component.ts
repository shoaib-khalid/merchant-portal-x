import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Product, ProductVariant, ProductVariantAvailable, ProductInventory, ProductCategory, ProductPagination, ProductPackageOption } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { Store } from 'app/core/store/store.types';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector: 'dialog-add-product',
    templateUrl: './add-product.component.html'
  })
  
export class AddProductComponent implements OnInit, OnDestroy
{
    // get current store
    store$: Store;

    checkinput = {
        name: false,
        description: false,
        status: false,
        sku: false,
        price: false,
        packingSize: false,
        category: false,
        availableStock: false
    };

    message: string = "";

    // product
    selectedProduct: Product | null = null;
    addProductForm: FormGroup;

    // product category
    productCategories$: ProductCategory[];
    filteredProductCategories: ProductCategory[];
    selectedProductCategory: ProductCategory;
    
    productCategoriesEditMode: boolean = false;
    productCategoriesValueEditMode:any = [];

    // product assets
    images: any = [];
    imagesFile: any = [];
    thumbnailIndex: number = 0;
    currentImageIndex: number = 0;
    imagesEditMode: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _variantsPanelOverlayRef: OverlayRef;

    quillModules: any = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{align: []}, {list: 'ordered'}, {list: 'bullet'}],
            [{link: function(value) {
                    if (value) {
                      var href = prompt('Enter the URL');
                      this.quill.format('link', href);
                    } else {
                      this.quill.format('link', false);
                    }
                  }
            }],
            ['blockquote','clean']
        ]
    };

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: FormBuilder,
        private _inventoryService: InventoryService,
        private _storesService: StoresService,
        public _dialog: MatDialog,
        public dialogRef: MatDialogRef<AddProductComponent>,
        @Inject(MAT_DIALOG_DATA) public data: MatDialog
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for storeId
     */
 
    get storeId$(): string
    {
        return localStorage.getItem('storeId') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Create the selected product form
        this.addProductForm = this._formBuilder.group({
            name             : ['', [Validators.required]],
            description      : ['', [Validators.required]],
            categoryId       : ['', [Validators.required]],
            status           : ['ACTIVE', [Validators.required]],
            trackQuantity    : [false],
            allowOutOfStockPurchases: [false],
            minQuantityForAlarm: [-1],
            packingSize      : ['', [Validators.required]],
            availableStock   : [1, [Validators.required]],
            sku              : ['', [Validators.required]],
            price            : ['', [Validators.required]],
            images           : [[]],
            imagefiles       : [[]],
            thumbnailIndex   : [0],

            // form completion
            valid            : [false]
        });
            
        // Get the stores
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {

                // Update the pagination
                this.store$ = store;

                // set packingSize to S if verticalCode FnB
                if (this.store$.verticalCode === "FnB" || this.store$.verticalCode === "FnB_PK"){
                    this.addProductForm.get('packingSize').patchValue('S');
                    this.checkinput.packingSize = true;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
            
        // Get the categories
        this._inventoryService.categories$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((categories: ProductCategory[]) => {

                // Update the categories
                this.productCategories$ = categories;
                this.filteredProductCategories = categories;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // rest of the input checking process occur at bottom
        // refer function checkInput().... lol
        this.addProductForm.valueChanges.subscribe(data => {
            if (data.description) {
                this.checkinput['description'] = true;
            } else {
                this.checkinput['description'] = false;
            }
        })

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        // Dispose the overlays if they are still on the DOM
        if ( this._variantsPanelOverlayRef )
        {
            this._variantsPanelOverlayRef.dispose();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    // --------------------------------------
    // Product Section
    // --------------------------------------

    generateSku(){
        if ((this.addProductForm.get('name').value && !this.addProductForm.get('sku').value) ||
            (this.addProductForm.get('name').value.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '') === this.addProductForm.get('sku').value) 
        ){
            this.addProductForm.get('sku').patchValue(this.addProductForm.get('name').value.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''));
            this.checkinput.sku = true;
        }
    }

    // --------------------------------------
    // Product Category Section
    // --------------------------------------

    /**
     * Toggle the categories edit mode
     */
    toggleCategoriesEditMode(): void
    {
        this.productCategoriesEditMode = !this.productCategoriesEditMode;
    }

    /**
     * Filter category
     *
     * @param event
     */
    filterCategories(event): void
    {
        // Get the value
        const value = event.target.value.toLowerCase();

        // Filter the categories
        this.filteredProductCategories = this.productCategories$.filter(category => category.name.toLowerCase().includes(value));
    }
 
    /**
     * Filter category input key down event
     *
     * @param event
     */
    filterCategoriesInputKeyDown(event): void
    {
        // Return if the pressed key is not 'Enter'
        if ( event.key !== 'Enter' )
        {
            return;
        }

        // If there is no category available...
        if ( this.filteredProductCategories.length === 0 )
        {
        //  // Create the category
        //  this.createCategory(event.target.value);

        //  // Clear the input
        //  event.target.value = '';

        //  // Return
        //  return;
        }

        // If there is a category...
        const category = this.filteredProductCategories[0];
        const isCategoryApplied = this.addProductForm.get('categoryId').value;

        // If the found category is already applied to the product...
        if ( isCategoryApplied )
        {
            // Remove the category from the product
            this.removeCategoryFromProduct();
        }
        else
        {
            // Otherwise add the category to the product
            this.addCategoryToProduct(category);
        }
    }

    /**
     * Create a new category
     *
     * @param title
     */
    createCategory(name: string, parentCategoryId: string, thumbnailUrl: string): void
    {
        const category = {
            name,
            storeId: this.storeId$,
            parentCategoryId,
            thumbnailUrl
        };

        // Create category on the server
        this._inventoryService.createCategory(category)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {

                // Add the category to the product
                this.addCategoryToProduct(response["data"]);
            });
    }
 
     /**
      * Update the category title
      *
      * @param category
      * @param event
      */
    updateLocalCategoryTitle(category: ProductCategory, event): void
    {
        // Update the title on the category
        category.name = event.target.value;
    }

    updateServerCategoryTitle(category: ProductCategory, event): void
    {
        // Update the category on the server
        this._inventoryService.updateCategory(category.id, category)
            .pipe(debounceTime(300))
            .subscribe();
    }
 
     /**
      * Delete the category
      *
      * @param category
      */
    deleteCategory(category: ProductCategory): void
    {

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete category',
            message: 'Are you sure you want to delete this category? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {
                // Delete the category from the server
                this._inventoryService.deleteCategory(category.id).subscribe();
        
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Add category to the product
     *
     * @param category
     */
    addCategoryToProduct(category: ProductCategory): void
    {

        // Update the selected product form
        this.addProductForm.get('categoryId').patchValue(category.id);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
 
     /**
      * Remove category from the product
      *
      * @param category
      */
    removeCategoryFromProduct(): void
    {

        // Update the selected product form
        this.addProductForm.get('categoryId').patchValue("");

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
 
    /**
     * Toggle product category
     *
     * @param category
     * @param change
     */
    toggleProductCategory(category: ProductCategory, change: MatCheckboxChange): void
    {
        if (change.checked) {
            this.addCategoryToProduct(category);

            // --------------------------------
            // Reposition selected category
            // --------------------------------

            // Sort the filtered categories, put selected category on top
            // First get selected array index by using this.selectedProduct.categoryId
            let selectedProductCategoryIndex = this.filteredProductCategories.findIndex(item => item.id === this.addProductForm.get('categoryId').value);
            // if selectedProductCategoryIndex < -1 // category not selected
            // if selectedProductCategoryIndex = 0 // category selected already in first element
            if (selectedProductCategoryIndex > 0) {
                // if index exists get the object of selectedProductCategory
                this.selectedProductCategory = this.filteredProductCategories[selectedProductCategoryIndex];
                // remove the object from this.filteredProductCategories
                this.filteredProductCategories.splice(selectedProductCategoryIndex,1);
                // re add this.selectedProductCategory in front
                this.filteredProductCategories.unshift(this.selectedProductCategory);
            }
        } else {
            this.removeCategoryFromProduct();
        }
    }

    /**
     * Should the create category button be visible
     *
     * @param inputValue
     */
    shouldShowCreateCategoryButton(inputValue: string): boolean
    {
        return !!!(inputValue === '' || this.productCategories$.findIndex(category => category.name.toLowerCase() === inputValue.toLowerCase()) > -1);
    }

    // --------------------------------------
    // Product Assets/Images Section
    // --------------------------------------

    /**
     * Toggle the categories edit mode
     */
    toggleImagesEditMode(): void
    {
        this.imagesEditMode = !this.imagesEditMode;
    }
     
    /**
     * Upload avatar
     *
     * @param fileList
     */
    uploadImages(fileList: FileList, images): Promise<void>
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
            if(!images.length === true) {
                this.images.push(reader.result);
                this.imagesFile.push(file);
                this.currentImageIndex = this.images.length - 1;
            } else {
                this.images[this.currentImageIndex] = reader.result + "";
            }

            this.imagesEditMode = false; 
            this._changeDetectorRef.markForCheck();
        }
    }

    /**
     * Remove the image
     */
    removeImage(): void
    {
        const index = this.currentImageIndex;
        if (index > -1) {
            this.images.splice(index, 1);
            this.imagesFile.splice(index, 1);
            this.currentImageIndex = 0;
        }
    }

    /**
     * Cycle through images of selected product
     */
    cycleImages(forward: boolean = true): void
    {
        // Get the image count and current image index
        const count = this.images.length;
        const currentIndex = this.currentImageIndex;

        // Calculate the next and previous index
        const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
        const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

        // If cycling forward...
        if ( forward )
        {
            this.currentImageIndex = nextIndex;
        }
        // If cycling backwards...
        else
        {
            this.currentImageIndex = prevIndex;
        }
    }

    resetCycleImages(){
        this.currentImageIndex = 0;
    }

    // --------------------------------------
    // Everything else
    // --------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    // Quil editor text limit
    textChanged($event) {
        const MAX_LENGTH = 500;
        if ($event.editor.getLength() > MAX_LENGTH) {
           $event.editor.deleteText(MAX_LENGTH, $event.editor.getLength());
        }
    }

    addNewProduct() {

        // Do nothing if the form is invalid
        let BreakException = {};
        try {
            Object.keys(this.addProductForm.controls).forEach(key => {
                const controlErrors: ValidationErrors = this.addProductForm.get(key).errors;
                if (controlErrors != null) {
                    Object.keys(controlErrors).forEach(keyError => {
                        this.message = 'Field "' + key + '" error: ' + keyError;                        
                        throw BreakException;
                    });
                    this.addProductForm.get('valid').patchValue(false);
                }
            });
        } catch (error) {
            return;
        }
        
        // --------------------
        // Process
        // --------------------
        
        this.addProductForm.get('valid').patchValue(true);

        this.addProductForm.get('images').patchValue(this.images);
        this.addProductForm.get('imagefiles').patchValue(this.imagesFile);
        this.addProductForm.get('thumbnailIndex').patchValue(this.thumbnailIndex);
        this.dialogRef.close(this.addProductForm.value);
    }
    
    cancelAddProduct(){
        this.dialogRef.close({ valid: false });
    }

    checkInput(input, event = null){
        // check input
        if ((this.addProductForm.get(input) && this.addProductForm.get(input).value) || 
            (input === 'category' && event.target.checked)
            ) {
            this.checkinput[input] = true;
        } else {
            this.checkinput[input] = false;
        }
    }

    disabledTrackStock(isTrackStock: boolean) {
        if (isTrackStock === false){
            this.addProductForm.get('allowOutOfStockPurchases').patchValue(false);
            this.addProductForm.get('minQuantityForAlarm').patchValue(-1);
        }
    }

    setThumbnail(currentImageIndex: number){
        this.thumbnailIndex = currentImageIndex;
    }
}
