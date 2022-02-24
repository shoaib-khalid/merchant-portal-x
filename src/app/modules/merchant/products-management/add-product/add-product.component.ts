import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { merge, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, finalize, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Product, ProductVariant, ProductVariantAvailable, ProductInventory, ProductCategory, ProductPagination, ProductPackageOption } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { Store } from 'app/core/store/store.types';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoresService } from 'app/core/store/store.service';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { AddProductValidationService } from './add-product.validation.service';



@Component({
    selector: 'dialog-add-product',
    templateUrl: './add-product.component.html',
    styles         : [
        /* language=SCSS */
        `
            .custom-add-product-dialog {

                :host ::ng-deep .mat-horizontal-content-container {
                    // max-height: 90vh;
                    padding: 0 0px 20px 0px;
                    // overflow-y: auto;
                }
                :host ::ng-deep .mat-horizontal-stepper-header-container {
                    height: 60px;
                }
                :host ::ng-deep .mat-horizontal-stepper-header {
                    height: 60px;
                    padding-left: 8px;
                    padding-right: 8px;
                }
            }
            .content {
                max-height: 455px;
                height: 75vh
                // overflow-y: auto;
            }
            :host ::ng-deep .ql-container .ql-editor {
                min-height: 131px;
                max-height: 131px;
                height: 131px;
            }

            // variant section

            .variant-details-grid {
                height: 62vh;
                max-height: 350px;
            }

            // combo section
            
            .add-product-list {
                height: 25vh;
                max-height: 175px;
            }

            .combo-details-grid {
                height: 60vh;
                max-height: 370px;
            }
            .option-grid {
                grid-template-columns: 120px 112px auto 112px;
            }

            .variant-grid {
                // grid-template-columns: 68px auto 40px;
                grid-template-columns: 68px 120px 120px 128px 80px 96px;

                // @screen sm {
                //     grid-template-columns: 68px auto auto 128px 84px 96px;
                // }

                @screen md {
                    grid-template-columns: 68px 120px auto 128px 80px 96px;
                }

            }

        `
    ],
  })
  
export class AddProductComponent implements OnInit, OnDestroy
{
    @ViewChild('variantsPanelOrigin') private _variantsPanelOrigin: ElementRef;
    @ViewChild('variantsPanel') private _variantsPanel: TemplateRef<any>;


    // get current store
    store$: Store;

    message: string = "";

    // product
    selectedProduct: Product | null = null;
    addProductForm: FormGroup;
    products$: Observable<Product[]>;
    createdProductForm: FormGroup;
    productType: string;
    newProductId: string = null; // product id after it is created
    creatingProduct: boolean; // use to disable next button until product is created


    // product combo package
    _products: Product[]; // use in combo section -> 'Add product' --before filter
    filteredProductsOptions: Product[] = []; // use in listing html
    selectedProductsOptions: Product[] = [];
    selectedProductsOption: ProductPackageOption = null;
    _selectedProductsOption = {};
    optionChecked = [];
    _filteredProductsOptions: Product[] = []; // use in combo section -> 'Add product' --after filter
    productsCombos$: ProductPackageOption[] = [];
    localCategoryFilterControl: FormControl = new FormControl();


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

    // product variant section

    filteredProductVariants: any[] = []; // used in html to loop variant
    productVariants: any[] = []; // (variantComboOptions)
    variantToBeCreated: any[] = []; // use for creating on BE 
    selectedVariantCombos: any = []; // this is the list of combinations generated
    selectedProductVariant: ProductVariant;
    // variantImagesToBeDeleted: any = []; // image to be deleted from BE

    variantIndex: number = 0; // set index when open overlay panel in variant available section


    // variant available section

    filteredProductVariantAvailable: any[] = []; // used in html to loop variant available
    productVariantAvailable: ProductVariantAvailable[] = []; 
    variantAvailableToBeCreated: any = []; // use for creating on BE 
    // variantAvailableToBeDeleted: any = []; // use for deleting on BE 
    productVariantAvailableEditMode: boolean = false;
    productVariantAvailableValueEditMode:any = [];



    variantComboItems: any = []; // this is used for generating combinations
    variantComboOptions: any = []; //
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    currentScreenSize: string[];




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
        private _overlay: Overlay,
        private _renderer2: Renderer2,
        private _viewContainerRef: ViewContainerRef,
        public dialogRef: MatDialogRef<AddProductComponent>,
        @Inject(MAT_DIALOG_DATA) public data: MatDialog,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for storeId
     */

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Horizontol stepper
        this.addProductForm = this._formBuilder.group({
            step1: this._formBuilder.group({
                name             : ['', [Validators.required]],
                description      : ['', AddProductValidationService.requiredValidator],
                categoryId       : ['', AddProductValidationService.requiredValidator],
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
                isVariants       : [false],
                isPackage        : [false], // combo
    
                // form completion
                valid            : [false]
            }),
            variantsSection: this._formBuilder.group({
                firstName: ['', Validators.required],
                lastName : ['', Validators.required],
                userName : ['', Validators.required],
                about    : ['']
            }),
            comboSection: this._formBuilder.group({
                firstName: ['', Validators.required],
                lastName : ['', Validators.required],
                userName : ['', Validators.required],
                about    : ['']
            })
        });

        this.createdProductForm = this._formBuilder.group({});

        // get the product type
        this.productType = this.data['productType'];
        

        // Create the selected product form
        // this.addProductForm = this._formBuilder.group({
        //     name             : ['', [Validators.required]],
        //     description      : ['', [Validators.required]],
        //     categoryId       : ['', [Validators.required]],
        //     status           : ['ACTIVE', [Validators.required]],
        //     trackQuantity    : [false],
        //     allowOutOfStockPurchases: [false],
        //     minQuantityForAlarm: [-1],
        //     packingSize      : ['', [Validators.required]],
        //     availableStock   : [1, [Validators.required]],
        //     sku              : ['', [Validators.required]],
        //     price            : ['', [Validators.required]],
        //     images           : [[]],
        //     imagefiles       : [[]],
        //     thumbnailIndex   : [0],

        //     // form completion
        //     valid            : [false]
        // });

        // Get the products
        this.products$ = this._inventoryService.products$;
            
        // Get the stores
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {

                // Update the pagination
                this.store$ = store;

                // set packingSize to S if verticalCode FnB
                if (this.store$.verticalCode === "FnB" || this.store$.verticalCode === "FnB_PK"){
                    this.addProductForm.get('step1').get('packingSize').patchValue('S');
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get all products for combo section
        this._inventoryService.getAllProducts()
            .pipe(takeUntil(this._unsubscribeAll))    
            .subscribe((response)=>{

                this._products = response["data"].content
                
                // filter the product
                this.filterProductOptionsMethod(this._products);

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

        // Filter by category dropdown in combo section
        this.localCategoryFilterControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((catId) => {
                    
                    if (catId == ''){
                        this.filteredProductsOptions = this._filteredProductsOptions
                    }
                    else {
                        this.filteredProductsOptions = this._filteredProductsOptions.filter(item => item.categoryId === catId );
                    }


                    this.isLoading = true;

                    // Mark for check
                    this._changeDetectorRef.markForCheck();

                    return of(true)
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

            
        this._fuseMediaWatcherService.onMediaChange$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(({matchingAliases}) => {               

            this.currentScreenSize = matchingAliases;                

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });       
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
        if ((this.addProductForm.get('step1').get('name').value && !this.addProductForm.get('step1').get('sku').value) ||
            (this.addProductForm.get('step1').get('name').value.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '') === this.addProductForm.get('sku').value) 
        ){
            this.addProductForm.get('step1').get('sku').patchValue(this.addProductForm.get('step1').get('name').value.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''));
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
        const isCategoryApplied = this.addProductForm.get('step1').get('categoryId').value;

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
            storeId: this._storesService.storeId$,
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
        this.addProductForm.get('step1').get('categoryId').patchValue(category.id);

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
        this.addProductForm.get('step1').get('categoryId').patchValue(null);

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
            let selectedProductCategoryIndex = this.filteredProductCategories.findIndex(item => item.id === this.addProductForm.get('step1').get('categoryId').value);
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

    addNewProduct0() {

        // Do nothing if the form is invalid
        let BreakException = {};
        try {
            Object.keys(this.addProductForm.controls).forEach(key => {
                const controlErrors: ValidationErrors = this.addProductForm.get('step1').get(key).errors;
                if (controlErrors != null) {
                    Object.keys(controlErrors).forEach(keyError => {
                        this.message = 'Field "' + key + '" error: ' + keyError;                        
                        throw BreakException;
                    });
                    this.addProductForm.get('step1').get('valid').patchValue(false);
                }
            });
        } catch (error) {
            return;
        }
        
        // --------------------
        // Process
        // --------------------
        
        this.addProductForm.get('step1').get('valid').patchValue(true);

        this.addProductForm.get('step1').get('images').patchValue(this.images);
        this.addProductForm.get('step1').get('imagefiles').patchValue(this.imagesFile);
        this.addProductForm.get('step1').get('thumbnailIndex').patchValue(this.thumbnailIndex);
        this.dialogRef.close(this.addProductForm.value);
    }
    /**
     * Create product
     */
    addNewProductMethod(): void
    {
        this.creatingProduct = true;

        const {valid, ...productBody} = this.addProductForm.get('step1').value

        const { sku, availableStock, price, images, imagefiles, thumbnailIndex, ...newProductBody } = productBody;
        
        // Get store domain
        let storeFrontURL = 'https://' + this.store$.domain;

        // newProductBody["categoryId"] = categoryId;
        newProductBody["seoName"] = newProductBody.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        newProductBody["seoUrl"] = storeFrontURL + "/product/" + newProductBody.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        newProductBody["storeId"] = this.store$.id;
        newProductBody["minQuantityForAlarm"] = newProductBody.minQuantityForAlarm === false ? -1 : newProductBody.minQuantityForAlarm;
        newProductBody["packingSize"] = newProductBody.packagingSize ? newProductBody.packagingSize : "S";
        newProductBody["isPackage"] = (this.productType === "combo") ? true : false;
        newProductBody["allowOutOfStockPurchases"] = ((this.store$.verticalCode === "FnB" || this.store$.verticalCode === "FnB_PK") && (newProductBody.status !== "OUTOFSTOCK")) ? true : false;
                
        // Create the product
        this._inventoryService.createProduct(newProductBody)
            .pipe(
                finalize(() => {
                    this.creatingProduct = false;
                })
            )
            .subscribe(async (newProduct) => {

                this.newProductId = newProduct["data"].id;
                this.selectedProduct = newProduct["data"];                

                this.products$
                    .pipe(take(1)) 
                    .subscribe(products => {

                        // filter after update
                        this.filterProductOptionsMethod(products);
                    })

                // Add Inventory to product
                this._inventoryService.addInventoryToProduct(newProduct["data"], { sku: sku, quantity: availableStock, price:price, itemCode:newProduct["data"].id + "aa" } )
                    .subscribe((response)=>{
                        // update sku, price, quantity display since it's not part of product but product inventory
                        // this.displayPrice = response.price;
                        // this.displayQuantity = response.quantity;
                        // this.displaySku = response.sku;

                        // if type is combo..
                        if (this.productType === "combo"){

                            // open the details window..
                            // this.toggleDetails(newProduct["data"].id);

                            // then, open the combo section
                            // this.showCombosSection = true;
            
                        }

                    });

                // Update the assets product on the server (backend kena enable update)
                if (imagefiles) {
                    for (var i = 0; i < imagefiles.length; i++) {
                        // create a new one
                        let formData = new FormData();
                        formData.append('file',imagefiles[i]);
                        this._inventoryService.addProductAssets(newProduct["data"].id, formData, (i === thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false })
                            .pipe(takeUntil(this._unsubscribeAll))
                            .subscribe((response)=>{
                                if (response.isThumbnail){
                                    this.selectedProduct.thumbnailUrl = response.url;
                                }

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            });
                    }

                    // load images
                    this.currentImageIndex = 0;
                    this.imagesFile = imagefiles;
                    this.images = images;
                    this.thumbnailIndex = thumbnailIndex;
                }

                // Go to new product
                // this.selectedProduct = newProduct["data"];
                                        
                // Update current form with new product data
                // this.createdProductForm.patchValue(newProduct["data"]);

                // Set image & isVariants to false ...
                // this.selectedProductForm.get('isVariants').patchValue(false);
                
                // Set filtered variants to empty array
                this.filteredProductVariants = [];
                
                // // Set variants to empty array
                // this.variants = [];

                // // Set selectedProduct variants to empty array
                // this.selectedProduct.variants = [];

                if (this.addProductForm.get('step1').get('isVariants').value === false && this.productType !== 'combo') {
                    
                    // Show a success message
                    this.showFlashMessage('success');
                    // Set delay before closing the window
                    setTimeout(() => {

                        // close the window
                        this.dialogRef.close({ valid: false });
            
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }, 1000);
                }

                // get product combo list
                if (this.productType === "combo") {
                    this._inventoryService.getProductPackageOptions(this.selectedProduct.id)
                        .pipe(takeUntil(this._unsubscribeAll))
                        .subscribe((response)=>{
                            this.productsCombos$ = response["data"];
                            
                        });
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }


    async postVariantMethod(){
        
        // if it is variants
        if (this.addProductForm.get('step1').get('isVariants').value === true) {

            // DELETE ENTIRE INVENTORY
            await this.deleteEntireInventory()
                    
            // INVENTORY
            if (this.selectedVariantCombos.length > 0){
                for (var i = 0; i < this.selectedVariantCombos.length; i++) {
            
                    // }
                    const body = {
                        // itemCode: this.selectedProduct.id + "-" + i,
                        itemCode: this.selectedProduct.id + i,
                        price: this.selectedVariantCombos[i].price,
                        compareAtPrice: 0,
                        quantity: this.selectedVariantCombos[i].quantity,
                        sku: this.selectedVariantCombos[i].sku,
                        status: this.selectedVariantCombos[i].status
                    }
    
                    await this._inventoryService.addInventoryToProduct(this.selectedProduct, body).toPromise()
                    .then((response)=>{
    
                    });
                }
                
            }
    
            // VARIANT
            // Delete the variant from the BE
            // if (this.variantToBeDeleted.length > 0){
    
            //     this.variantToBeDeleted.forEach(variant => {
            //         this._inventoryService.deleteVariant(this.selectedProduct.id, variant.id , variant)
            //             .pipe(takeUntil(this._unsubscribeAll))
            //             .subscribe((response)=>{
            //                 // this.removeVariantFromProduct(response)
            //             });
            //     })
            // }
    
            // create new variants
            const variantIds = await this.createVariantInBE()
    
            // Delete the variant available from the BE
            // if (this.variantAvailableToBeDeleted.length > 0){
                
            //     this.variantAvailableToBeDeleted.forEach(options => {
            //         this._inventoryService.deleteVariantAvailable(options, this.selectedProduct.id)
            //             .pipe(takeUntil(this._unsubscribeAll))
            //             .subscribe((response)=>{
                            
            //             });
    
            //     })
            // }
            let variantAvailablesCreated = [];
            // if got new variant availables, pass the variantIds from the createVariant endpoint
            if (this.variantAvailableToBeCreated.length > 0){
                
                variantAvailablesCreated = await this.createVariantAvailableInBE(variantIds);
    
                
            }
            else {
    
                await this._inventoryService.getVariantAvailable(this.selectedProduct.id).then((response) => {
    
                    variantAvailablesCreated = response;
                    
                })
    
            }
    
            await this.addInventoryItem(variantAvailablesCreated);

            // CREATE VARIANT IMAGES
            for (let i = 0; i < this.selectedVariantCombos.length; i++) {
                
                // if new, create new asset
                if (this.selectedVariantCombos[i].newAsset == true) {
                
                    let formdata = new FormData();
                    formdata.append("file", this.selectedVariantCombos[i].file);
                    await this._inventoryService.addProductAssets(this.selectedProduct.id, formdata, (i === this.thumbnailIndex) ? { isThumbnail: true , itemCode: this.selectedProduct.id + i } : { isThumbnail: false, itemCode: this.selectedProduct.id + i }, i)
                    .toPromise().then(data => {
                        this._changeDetectorRef.markForCheck();
                        // Show a success message
                        this.showFlashMessage('success');
                        // Set delay before closing the window
                        setTimeout(() => {

                            // close the window
                            this.dialogRef.close({ valid: false });
                
                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                        }, 1000);

                    });
                }
                // if it is an old one, update it (update thumbnail)
                else if ((i === this.thumbnailIndex) && (this.selectedVariantCombos[i].newAsset == false) && (this.selectedVariantCombos[i].file != '')) {
                    await this._inventoryService.updateProductAssets(this.selectedProduct.id, { isThumbnail: true , itemCode: this.selectedProduct.id + i }, this.selectedVariantCombos[i].assetId)
                    .toPromise().then(data => {
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                    });
                }
            }

            // Show a success message
            this.showFlashMessage('success');
            // Set delay before closing the window
            setTimeout(() => {
    
                // close the window
                this.dialogRef.close({ valid: false });
    
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }, 1000);
    
        }
        // else means combo
        else {
            // Show a success message
            this.showFlashMessage('success');
            // Set delay before closing the window
            setTimeout(() => {
    
                // close the window
                this.dialogRef.close({ valid: false });
    
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }, 1000);
        }
    }

    /**
     * Create variant
     */
    async createVariantInBE() {
        

        let m = 0;
        let variantIds = [];

        for (const variant of this.filteredProductVariants) {

            // if variant.id is null, means it is new, so, call POST method
            if(!variant.id) {

                let variantBody = {
                    name : variant.name,
                    sequenceNumber : m
                }
                
                let response = await this._inventoryService.createVariant(variantBody, this.selectedProduct.id).toPromise();

                variantIds.push(response)
            }
            m++;
        }
        return variantIds;

    }

    /**
     * Create variant availables
     * 
     * @param variantIds
     */
    async createVariantAvailableInBE(newVariant: any[]) {

        let bodies = [];
        let variantAvailablesCreated = [];

        // loop the newly created variant ids
        for (let i = 0; i < newVariant.length; i++){

            // loop the list of variant availables that need to be created to BE
            for (let j = 0; j < this.variantAvailableToBeCreated.length; j++){

                // if name is same..
                if (newVariant[i].name ===  this.variantAvailableToBeCreated[j].variantName){

                    // .. set the variant id to the new variant available
                    this.variantAvailableToBeCreated[j].productVariantId = newVariant[i].id;
                    
                }
                
            }
        }

        // loop the list of variant availables that need to be created to BE
        this.variantAvailableToBeCreated.forEach(options => {

            // then push into bodies
            bodies.push(
                {
                    productId : options.productId,
                    productVariantId : options.productVariantId,
                    value : options.value,
                    sequenceNumber : options.sequenceNumber
                })
        })
        
        // call api
        await this._inventoryService.createVariantAvailableBulk(bodies, this.selectedProduct.id)
            .toPromise()
            .then((response) => { 

                variantAvailablesCreated = response['data'];
                
                // Add the variant to the product
                // this.addVariantAvailableToVariant(response,this.selectedProductVariants.id);

                // reset current filteredProductVariantAvailable
                // this.filteredProductVariantAvailable = this.productVariantAvailable$;
            });
            
            return variantAvailablesCreated;
    }

    /**
     * Delete entire inventory
     * 
     * @returns promise
     */
     async deleteEntireInventory() {
        var promise = new Promise(async (resolve, reject) => {
          for (var j = 0; j < this.selectedProduct.productInventories.length; j++) {
            await this._inventoryService.deleteInventoryToProduct(this.selectedProduct.id, this.selectedProduct.productInventories[j].itemCode).toPromise();
          }
          this.selectedProduct.productInventories = [];
          resolve("done")
        });
        return promise;
    }

    /**
     * Add inventory items to backend
     * 
     * @param productVariantAvailableIds 
     */
    async addInventoryItem(productVariantAvailableIds) {

        var k = 0;
        for (let i = 0; i < this.selectedVariantCombos.length; i++) {
            const combosSplitted = this.selectedVariantCombos[i].variant.split("/");
        
            for (let j = 0; j < combosSplitted.length; j++) {
                
                for (let m = 0; m < productVariantAvailableIds.length; m++){
                                    
                    if (combosSplitted[j].trim() == productVariantAvailableIds[m].value.trim()){
                        
                        await this._inventoryService.addInventoryItemToProduct(this.selectedProduct, {
                            itemCode: this.selectedProduct.id + i,
                            productVariantAvailableId: productVariantAvailableIds[m].id,
                            productId: this.selectedProduct.id,
                            sequenceNumber: 0
                        })
                    }
                }

            
            }
        }
    }
    
    cancelAddProduct(){
        
        this.dialogRef.close({ valid: false });
    }

    /**
     * Filter products to be used in product list in combo section
     * 
     * @param products 
     */
     filterProductOptionsMethod(products)
     {
 
         // remove object for array of object where item.isPackage !== true
         this._filteredProductsOptions = products.filter(item => item.isPackage !== true );
         
         this.filteredProductsOptions = this._filteredProductsOptions;
 
     }

    disabledTrackStock(isTrackStock: boolean) {
        if (isTrackStock === false){
            this.addProductForm.get('step1').get('allowOutOfStockPurchases').patchValue(false);
            this.addProductForm.get('step1').get('minQuantityForAlarm').patchValue(-1);
        }
    }

    setThumbnail(currentImageIndex: number){
        this.thumbnailIndex = currentImageIndex;
    }

    // --------------------------------------
    // Product Variant Section
    // --------------------------------------

    /**
     * Filter variants
     *
     * @param event
     */
    filterVariants(event): void
    {
        // Get the value
        const value = event.target.value.toLowerCase();

        // Filter the variants
    //  this.productVariants = this.variantComboOptions.filter(variant => variant.name.toLowerCase().includes(value));


    }
 
     /**
      * Filter variants input key down event
      *
      * @param event
      */
    filterVariantsInputKeyDown(event): void
    {
        // Return if the pressed key is not 'Enter'
    //  if ( event.key !== 'Enter' )
    //  {
    //      return;
    //  }

        // If there is no variant...
    //  if ( this.filteredProductVariants.length === 0 )
    //  { 
    //      // Clear the input
    //      event.target.value = '';

    //      return;
    //  }

        // // If there is a variant...
        // const variant = this.filteredProductVariants[0];
        // const isVariantApplied = this.selectedProduct.productVariants.find(item => item.id === variant.id);

        // // If the found variant is already applied to the product...
        // if ( isVariantApplied )
        // {
        //     // Remove the variant from the product
        //     this.removeVariantFromProduct(variant);
        // }
        // else
        // {
        //     // Otherwise add the variant to the product
        //     this.addVariantToProduct(variant);
        // }
    }

    /**
     * Filter variants
     *
     * @param event
     */
    filterProductVariantAvailable(event): void
    {
        // Get the value
        const value = event.target.value.toLowerCase();

        // Filter the variants
        this.filteredProductVariantAvailable = this.productVariantAvailable?.filter(variantAvailable => variantAvailable.value.toLowerCase().includes(value));

    }
  
    /**
     * Filter variants input key down event
     *
     * @param event
     */
    filterProductVariantAvailableInputKeyDown(event): void
    {
        // // Return if the pressed key is not 'Enter'
        // if ( event.key !== 'Enter' )
        // {
        //     return;
        // }

        // // If there is no variant available...
        // if ( this.filteredProductVariantAvailable.length === 0 )
        // {
        //     // Create the variant
        // //  this.createVariantTag(event.target.value);

        //     // Clear the input
        //     event.target.value = '';

        //     // Return
        //     return;
        // }

        // // If there is a variant...
        // const variantTag = this.filteredProductVariantAvailable[0];
        // const isVariantTagApplied = this.selectedProduct.productVariants.find(item => item.id === variantTag.id);

        // // If the found variant is already applied to the product...
        // if ( isVariantTagApplied )
        // {
        //     // Remove the variant from the product
        // //  this.removeVariantTagFromProduct(variantTag);
        // }
        // else
        // {
        //     // Otherwise add the variant to the product
        //     let variantId
        //     this.addVariantAvailableToVariant(variantTag, variantId);
        // }
    } 

    // displayVariants(){
    //     console.log('display variants');
        
    // }
    deleteAllVariantsConfirmation(){
        console.log('delete variants');
        
    }

    /**
     * Should the create variant button be visible
     *
     * @param inputValue
     */
    shouldShowCreateVariantButton(inputValue: string): boolean
    {
        
        // return !!!(inputValue === '' || this.productVariants$.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);
        return !!!(inputValue === '' || this.productVariants.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);
    //  return !!!(inputValue === '' || this.variantComboOptions.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);

    }

    /**
      * Should the create variantTag button be visible
      *
      * @param inputValue
      */
    shouldShowCreateVariantAvailableButton(inputValue: string): boolean
    {
        // conditional when we click the variant that was recently created it will has null value so we need to handle this issue in order to display create button for variant available
        if(this.productVariantAvailable === null){
            this.productVariantAvailable = [];
        }

        return !!!(inputValue === '' || this.productVariantAvailable?.findIndex(variantTag => variantTag.value.toLowerCase() === inputValue.toLowerCase()) > -1);
        // return !!!(inputValue === '' || this.filteredProductVariantAvailable?.findIndex(variantTag => variantTag.value.toLowerCase() === inputValue.toLowerCase()) > -1);

    }


    /**
     * Create a new variant
     *
     * @param title
     */
    createVariantMethod(name: string): void
    {

    //  this.productVariants.clear;

    //  let _item = this._formBuilder.group({
    //      id:null,
    //      name: name,
    //      productVariantsAvailable:this._formBuilder.array([]),
    //  });

    // push to the array loop
        let item = {
            id:null,
            name: name,
            productVariantsAvailable: [],
        };
        this.productVariants.push(item);    
        this.filteredProductVariants= this.productVariants;    
        
        // push to array to be created to BE
        this.variantToBeCreated.push(item);

    //  this.variantComboOptions.push(item);
    //  this.filteredProductVariants= this.variantComboOptions;

     // add new empty array for variantComboItems
     this.variantComboItems.push({ values: [], ids: [] })
    
    }

     /**
     * Delete the variant
     *
     * @param variant
     */
    deleteVariantMethod(variant: ProductVariant, variantIdx): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete variant',
            message: 'Are you sure you want to delete this variant? This variant will be removed permenantly!',
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

                // only add to the variantToBeDeleted array if id is null; which means variant is not in BE
                // if (variant.id){
                //     // Use to delete on BE
                //     this.variantToBeDeleted.push(variant)
                // }

                // Remove from array to be created
                this.variantToBeCreated.splice(variantIdx, 1);

                // Delete the variant from formArray - formArray cannot use splice. Need to use removeAt
                this.productVariants.splice(variantIdx, 1);
                this.filteredProductVariants = this.productVariants;
                //  this.variantComboOptions = this.productVariants.value;
                
                // Delete the variant from variantComboItems
                this.variantComboItems.splice(variantIdx, 1);
                // this.variantComboOptions.splice(variantIdx, 1);
                
                // this.filteredProductVariants = this.variantComboOptions;
                this.selectedVariantCombos = []
             
                this.getallCombinations(this.variantComboItems)
 
                //  variant.productVariantsAvailable.forEach(x => {

                //      // to remove combinations with deleted options
                //      this.selectedVariantCombos = this.selectedVariantCombos.filter(y => !y.variant.includes(x.value));

                //     })

                // remove variant available to be created, if not, api will return error    
                this.variantAvailableToBeCreated = this.variantAvailableToBeCreated.filter(y => !y.variantName.includes(variant.name));

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

    }


    /**
     * Toggle the variants Available edit mode
     */
    toggleVariantsAvailableEditMode(): void
    {
        this.productVariantAvailableEditMode = !this.productVariantAvailableEditMode;
    }

    /**
     * Create a new variant
     *
     * @param value
     */
    createVariantAvailableMethod(value: string, variantIdx: number): void
    {
        
        // push new variant option (available) value to variant items array 
        this.variantComboItems[variantIdx].values.push(value);
        
        // if variant recently created then need to create the variant then push the variant available listing
        const variant = {
            value,
            productId: this.selectedProduct.id,
            productVariantId: this.selectedProductVariant.id !== null ? this.selectedProductVariant.id : '',
            sequenceNumber: this.variantComboItems[variantIdx].values.length - 1,
            variantName: this.selectedProductVariant.name
        }; 

        this.productVariantAvailable.push(variant);
        this.filteredProductVariantAvailable = this.productVariantAvailable;

        //--- CAN USE THIS TO CREATE NEW VARIANT AVAILABLE TO BE
        this.variantAvailableToBeCreated.push(variant);


        // if this is the first variant available to be added to the variant, set selectedVariantCombos to empty
        if (variantIdx > 0 && this.variantComboItems[variantIdx].values.length < 2){
            this.selectedVariantCombos = []
        }

        // to generate the combinations
        this.getallCombinations(this.variantComboItems)


        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Delete the variant available
     *
     * @param variant
     */
    deleteVariantAvailableMethod(variantAvailable: ProductVariantAvailable, variantIdx): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete variant',
            message: 'Are you sure you want to delete this variant value ? This variant value will be removed permenantly!',
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
                //----------------------------
                // variantAvailableToBeDeleted
                //----------------------------

                // only add to the variantAvailableToBeDeleted array if id is null; which means variant avail is not in BE
                if (variantAvailable.id){
                    // Use to delete on BE
                    // this.variantAvailableToBeDeleted.push(variantAvailable)
                }

                //----------------------------
                // variantAvailableToBeCreated
                //----------------------------

                // Find the index of the deleted variant available for variantAvailableToBeCreated
                const indexToBeCreated = this.variantAvailableToBeCreated.indexOf(variantAvailable);

                // Delete the variant available from variantAvailableToBeCreated
                if (indexToBeCreated > -1) {
                    this.variantAvailableToBeCreated.splice(indexToBeCreated, 1);
                }

                //----------------------------
                // productVariantAvailable
                //----------------------------

                // Find the index of the deleted variant available for productVariantAvailable$
                const index = this.productVariantAvailable.indexOf(variantAvailable);

                // Delete the variant available from productVariantAvailable
                if (index > -1) {
                    this.productVariantAvailable.splice(index, 1);
                }

                //----------------------------
                // variantComboItems
                //----------------------------

                // Find the index of the deleted variant available for variantComboItems
                const indexVariantItems = this.variantComboItems[variantIdx].values.indexOf(variantAvailable.value);

                // Delete the variant available from variantComboItems array
                if(indexVariantItems > -1) {
                    this.variantComboItems[variantIdx].values.splice(indexVariantItems, 1);
                }

                //----------------------------
                // selectedVariantCombos
                //----------------------------

                // to remove combinations with deleted options

                let splitted = [];
                let temp = this.selectedVariantCombos;

                this.selectedVariantCombos.forEach( v => {

                    // first, split the variant name
                    splitted = v.variant.split(" / ")

                    // then, check if the splitted name is identical to the variant available to be deleted, if same, return true
                    if (splitted.some( (name) => name === variantAvailable.value ))
                        // if identical, filter the temp
                        {
                            temp = temp.filter(x => x.variant !== v.variant);
                        }
                })
                
                this.selectedVariantCombos = temp;

                //----------------------------
                // variantimages
                //----------------------------
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

    }

    editVariantAvailableTitleMethod(variantsAvailable: ProductVariantAvailable, event){
        // Update the title on the category
        variantsAvailable.value = event.target.value;
    }

    uploadVariantImagesMethod(fileList: FileList, images, idx): Promise<void>
    {
        // Return if canceled
        if ( !fileList.length )
        {
            return;
        }
        
        const file = fileList[0];
        const allowedTypes = ['image/jpeg', 'image/png'];

        

        // Return if the file is not allowed
        if ( !allowedTypes.includes(file.type) )
        {
            return;
        }           

        

        // get the image id if any, then push into variantImagesToBeDeleted to be deleted BE
        if (this.selectedVariantCombos[idx]?.assetId) {
            // this.variantImagesToBeDeleted.push(this.selectedVariantCombos[idx].assetId)
        }

        // if (this.variantimages[idx].id) {
        //     this.variantImagesToBeDeleted.push(this.variantimages[idx].id)
        // }

        // call previewImage to assign 'preview' field with image url 
        this.previewImage(file).then(data => {
            // this.variantimages[idx] = { file: file, preview: data, new: true };

            this.selectedVariantCombos[idx].file = file;
            this.selectedVariantCombos[idx].preview = data;
            this.selectedVariantCombos[idx].newAsset = true;

            this._changeDetectorRef.markForCheck();
        })

        this._changeDetectorRef.markForCheck();

    }

    previewImage(file) {
        var promise = new Promise(async (resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (_event) => {
            resolve(reader.result)
          }
        });
        this._changeDetectorRef.markForCheck();
        return promise;

    }

    /**
     * Remove variant image
     */
    removeVariantImageMethod(imageIdx): void
    {
        
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete image',
            message: 'Are you sure you want to remove this image? This action cannot be undone!',
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
                if (imageIdx > -1) {

                    // get the image id if any, then push into variantImagesToBeDeleted to be deleted BE
                    if (this.selectedVariantCombos[imageIdx]?.assetId) {
                        // this.variantImagesToBeDeleted.push(this.selectedVariantCombos[imageIdx].assetId)
                    }
                    
                    // // get the image id if any, then push into variantImagesToBeDeleted to be deleted BE
                    // if (this.variantimages[imageIdx].id) {
                    //     this.variantImagesToBeDeleted.push(this.variantimages[imageIdx].id)
                    // }

                    // empty preview for that index to simulate 'delete'
                    this.selectedVariantCombos[imageIdx].preview = '';

                    // set newAsset to false
                    this.selectedVariantCombos[imageIdx].newAsset = false;
                                    
                }
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Open variants panel
     */
    openVariantsPanel(variant:any, idx): void
    {

        this.selectedProductVariant = variant;
        
        if (this.selectedProductVariant){

            // get index of filteredVariants that have same id with variantId
            // let index = this.filteredProductVariants.findIndex(x => x.id === variant.id);

            this.variantIndex = idx;
    
            // get the object of filteredVariantsTag in filteredVariants
            this.productVariantAvailable = this.filteredProductVariants[idx].productVariantsAvailable;
            this.filteredProductVariantAvailable = this.filteredProductVariants[idx].productVariantsAvailable;

        } else {
            this.filteredProductVariantAvailable = [];
        }

        // Create the overlay
        this._variantsPanelOverlayRef = this._overlay.create({
            backdropClass   : '',
            hasBackdrop     : true,
            scrollStrategy  : this._overlay.scrollStrategies.block(),
            positionStrategy: this._overlay.position()
                                .flexibleConnectedTo(this._variantsPanelOrigin.nativeElement)
                                .withFlexibleDimensions(true)
                                .withViewportMargin(64)
                                .withLockedPosition(true)
                                .withPositions([
                                    {
                                        originX : 'start',
                                        originY : 'bottom',
                                        overlayX: 'start',
                                        overlayY: 'top'
                                    }
                                ])
        });

        // Subscribe to the attachments observable
        this._variantsPanelOverlayRef.attachments().subscribe(() => {

            // Add a class to the origin
            this._renderer2.addClass(this._variantsPanelOrigin.nativeElement, 'panel-opened');

            // Focus to the search input once the overlay has been attached
            this._variantsPanelOverlayRef.overlayElement.querySelector('input').focus();
        });

        // Create a portal from the template
        const templatePortal = new TemplatePortal(this._variantsPanel, this._viewContainerRef);

        // Attach the portal to the overlay
        this._variantsPanelOverlayRef.attach(templatePortal);

        // Subscribe to the backdrop click
        this._variantsPanelOverlayRef.backdropClick().subscribe(() => {

            // Remove the class from the origin
            this._renderer2.removeClass(this._variantsPanelOrigin.nativeElement, 'panel-opened');

            // If overlay exists and attached...
            if ( this._variantsPanelOverlayRef && this._variantsPanelOverlayRef.hasAttached() )
            {

                // Detach it
                this._variantsPanelOverlayRef.detach();

                // Reset the variant filter
                this.filteredProductVariantAvailable = this.productVariantAvailable;

                // // Toggle the edit mode off
                this.productVariantAvailableEditMode = false;
            }

            // If template portal exists and attached...
            if ( templatePortal && templatePortal.isAttached )
            {
                // Detach it
                templatePortal.detach();
            }
        });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Generate variant combinations
     * 
     * @param combos 
     * @param itemCode 
     * @param nameComboOutput 
     * @param n 
     * @returns 
     */
    getallCombinations(combos, itemCode = "", nameComboOutput = "", n = 0) {
        var nameCombo = "";
        if (n == combos.length) {
            if (nameComboOutput.substring(1) != "") {
            // this.selectedVariantCombos.push({ itemCode: itemCode, variant: nameComboOutput.substring(1), price: 0, quantity: 0, sku: 0, status: "NOTAVAILABLE" })
            this.selectedVariantCombos.push({ itemCode: itemCode, variant: nameComboOutput.substring(1), price: 0, quantity: 0, sku: nameComboOutput.substring(1).toLowerCase().replace(" / ", "-"), status: "NOTAVAILABLE" })
            // this.variantimages.push([])
          }
          return nameComboOutput.substring(1);
        }
    
        for (var i = 0; i < combos[n].values.length; i++) {
          if (nameComboOutput != "") {
            nameCombo = nameComboOutput + " / " + combos[n].values[i];
          }
          else {
            nameCombo = nameComboOutput + " " + combos[n].values[i];
          }

          this.getallCombinations(combos, itemCode, nameCombo, n + 1)
        }

        // get unique values from object array. 
        // This is to avoid duplicate variants in selectedVariantCombos array
        let resArr = [];
        this.selectedVariantCombos.filter(function(item){

            let i = resArr.findIndex(x => (x.variant == item.variant));

            if (i <= -1){
                resArr.push(item);
            }
            return null;
            });

        this.selectedVariantCombos = resArr;
        
    }

    /**
     * Show flash message
     */
    showFlashMessage(type: 'success' | 'error'): void
    {
        // Show the message
        this.flashMessage = type;

        // Mark for check
        this._changeDetectorRef.markForCheck();

        // Hide it after 3 seconds
        setTimeout(() => {

            this.flashMessage = null;

            // Mark for check
            this._changeDetectorRef.markForCheck();
        }, 3000);
    }



    //---------------
    // Combo section
    //---------------

    /**
     * Filter product
     *
     * @param event
     */

    filterProducts(event): void
    {
        // Get the value
        const value = event.target.value.toLowerCase();

        // Filter the categories
        this.filteredProductsOptions = this._filteredProductsOptions.filter(product => product.name.toLowerCase().includes(value));
    }
 
    filterProductsInputKeyDown(event): void
    {
        // Return if the pressed key is not 'Enter'
        if ( event.key !== 'Enter' )
        {
            return;
        }

        // If there is no category available...
        if ( this.filteredProductsOptions.length === 0 )
        {
        //  // Create the category
        //  this.createCategory(event.target.value);

        //  // Clear the input
        //  event.target.value = '';

        //  // Return
        //  return;
        }

        // If there is a category...
        const product = this.filteredProductsOptions[0];
        const isProductApplied = this.selectedProduct.id;

        // If the found category is already applied to the product...
        if ( isProductApplied )
        {
            // Remove the category from the product
            this.removeProductFromOption(product);
        }
        else
        {
            // Otherwise add the category to the product
            this.addProductToOption(product);
        }
    }

    /**
     * Remove category from the product
     *
     * @param category
     */
    removeProductFromOption(product: Product): void
    {
        // Update the selected product form
        this.selectedProductsOptions.push(product)

        // Update the selected product form
        this.addProductForm.get('step1').get('categoryId').patchValue(this.selectedProduct.categoryId);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Add  product
     *
     * @param category
     */
    addProductToOption(product: Product): void
    {
        // Update the selected product form
        this.selectedProductsOptions.push(product)

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    selectProductOption(optionId){
        // If the product is already selected...
        if ( this.selectedProductsOption && this.selectedProductsOption.id === optionId )
        {
            // Clear the form
            this.selectedProductsOption = null;
        }

        // Get the product by id
        this._inventoryService.getProductsOptionById(optionId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((packages) => {
                this.selectedProductsOption = packages;
            });
    }

    deleteProductOption(optionId){
        // If the product is already selected...
        if ( this.selectedProductsOption && this.selectedProductsOption.id === optionId )
        {
            // Clear the form
            this.selectedProductsOption = null;
        }


        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete option',
            message: 'Are you sure you want to delete this option? This option will be removed permenantly!',
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
                // Delete the variant from the server
                this._inventoryService.deleteProductsOptionById(optionId, this.selectedProduct.id)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((response)=>{

                        // Find the index of the deleted product
                        const index = this.productsCombos$.findIndex(item => item.id === optionId);

                        // Delete the product
                        if(index > -1) {
                            this.productsCombos$.splice(index, 1);
                        }

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });
            }
        });
    }

    updateSelectedProductsOption(optionId = "") {

        // add / update _selectedProductsOption["packageId"] value 
        this._selectedProductsOption["packageId"] = this.selectedProduct.id;

        if (optionId !== ""){
            // update

            // this is to remove all other element except productId when updating
            let updateProductPackageOptionDetail = [];
            this._selectedProductsOption["productPackageOptionDetail"].forEach(item => {
                updateProductPackageOptionDetail.push({
                    productId: item.productId
                });
            });
            this._selectedProductsOption["productPackageOptionDetail"] = updateProductPackageOptionDetail;
            
            this._inventoryService.updateProductsOption(this.selectedProduct.id, this._selectedProductsOption, optionId )
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((response) => {

                    const index = this.productsCombos$.findIndex(item => item.id === optionId);
                    this.productsCombos$[index] = response;

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        } else {
            // add new
            this._inventoryService.createProductsOptionById(this.selectedProduct.id, this._selectedProductsOption)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((response) => {

                    // push to this.productsCombos$
                    this.productsCombos$.push(response);

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        }

        // Clear the form
        this.selectedProductsOption = null;
        // Clear the invisible form
        this._selectedProductsOption = {};

        for(let i=0;i < this.filteredProductsOptions.length;i++){
            this.optionChecked[i] = false;
        }
        
    }

    resetSelectedProductsOption(){
        this.selectedProductsOption = null;
    }

    validateProductsOptionName(value){
        
        // if this.selectedProductsOption have value // for update
        if (this.selectedProductsOption) {
            this._selectedProductsOption = this.selectedProductsOption;
        }

        this._selectedProductsOption["title"] = value;
    }

    insertProductsInOption(productId, isChecked: boolean) {

        // if this.selectedProductsOption have value // for update
        if (this.selectedProductsOption) {
            this._selectedProductsOption = this.selectedProductsOption;
        }

        if (isChecked) {

            // get product object in filteredProductsOptions
            let currentSelectedProductInOption = this.filteredProductsOptions.find(item => item.id === productId);

            // this is mostly triggered by (change)="insertProductsInOption"
            // this is triggered when creating new option, selectedProductsOption is null since it's new
            if (this._selectedProductsOption["productPackageOptionDetail"]) {
                // if there already a value in this._selectedProductsOption["productPackageOptionDetail"] ,
                // push a new one
                this._selectedProductsOption["productPackageOptionDetail"].push({
                    productId: currentSelectedProductInOption.id,
                    product: currentSelectedProductInOption
                });
            } else {
                // if this._selectedProductsOption["productPackageOptionDetail"] have no value, initiate the array first
                // then push the product id
                this._selectedProductsOption["productPackageOptionDetail"] = [];
                this._selectedProductsOption["productPackageOptionDetail"].push({
                    productId: currentSelectedProductInOption.id,
                    product: currentSelectedProductInOption
                });
            }
        } else {
            // this is mostly triggered by (change)="insertProductsInOption"
            // this is triggered when creating new option, selectedProductsOption is null since it's new
            if (this._selectedProductsOption["productPackageOptionDetail"]) {
                // if there already a value in this._selectedProductsOption["productPackageOptionDetail"] ,
                // push a new one
                let index = this._selectedProductsOption["productPackageOptionDetail"].findIndex(item => item.productId === productId);
                if (index > -1) {
                    // Delete the product from option
                    this._selectedProductsOption["productPackageOptionDetail"].splice(index, 1);
                }

                // this mean this._selectedProductsOption["productPackageOptionDetail"] is empty
                if (this._selectedProductsOption["productPackageOptionDetail"].length < 1) {
                }
            } else {
                // if this._selectedProductsOption["productPackageOptionDetail"] have no value, 
                // dis should not happen                
            }
        }

    }

    validateProductsInOption(productId) {
        let index;
        
        // this is mostly triggered by [checked]="validateProductsInOption(product.id)"
        // this is trigger when updating, since selectedProductsOption have values
        if (this.selectedProductsOption){
            index = this.selectedProductsOption.productPackageOptionDetail.findIndex(item => item.product.id === productId);
        }

        return (index > -1) ? true : false;
    }

    validateProductsOptionTotalAllowed(value){
        // if this.selectedProductsOption have value // for update
        if (this.selectedProductsOption) {
            this._selectedProductsOption = this.selectedProductsOption;
        }
        
        this._selectedProductsOption["totalAllow"] = value;
    }

    
    trackVariantAvailable(index: number, item: any)
    {
        return item ? item.id : undefined;
    }

    trackVariant(index: number, item: any)
    {
        
        return item ? item.id : undefined;
    }

    openProductPreview(){
        // window.open(this.selectedProductForm.get('seoUrl').value, '_blank');
    }
}
