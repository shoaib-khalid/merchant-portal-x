import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef, Inject, ViewChildren, QueryList } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { fromEvent, merge, Observable, of, Subject } from 'rxjs';
import { concatMap, debounceTime, delay, finalize, map, mergeMap, switchMap, take, takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Product, ProductVariant, ProductVariantAvailable, ProductInventory, ProductCategory, ProductPagination, ProductPackageOption, ProductAssets, DeliveryVehicleType, ApiResponseModel } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { Store } from 'app/core/store/store.types';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoresService } from 'app/core/store/store.service';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { MatPaginator } from '@angular/material/paginator';



@Component({
    selector: 'dialog-edit-product',
    templateUrl: './edit-product.component.html',
    styles         : [
        /* language=SCSS */
        `

            .custom-edit-product-dialog {

                :host ::ng-deep .mat-horizontal-content-container {
                    // max-height: 90vh;
                    padding: 0 0px 20px 0px;
                    // overflow-y: auto;
                }
                :host ::ng-deep .mat-horizontal-stepper-header-container {
                    // height: 60px;
                }
                :host ::ng-deep .mat-horizontal-stepper-header {
                    height: 60px;
                    padding-left: 8px;
                    padding-right: 8px;
                }

                :host ::ng-deep .mat-paginator .mat-paginator-container {
                    padding: 0px 16px;
                    justify-content: center;
                }
                :host ::ng-deep .mat-paginator-outer-container {
                    display: flex;
                    height: 40px;
                }
            }
            .content {

                max-height: 80vh;
                height: 80vh;

                @screen sm {
                    max-height: 560px;
                    height: 75vh;
                }
                // overflow-y: auto;
            }
            :host ::ng-deep .ql-container .ql-editor {
                min-height: 87px;
                max-height: 87px;
                height: 87px;
            }

            // variant section

            .variant-details-grid {
                height: 62vh;
                max-height: 468px;
            }

            // combo section
            
            .add-product-list {
                height: 21vh;
                max-height: 194px;
            }

            .combo-details-grid {
                height: 60vh;
                max-height: 470px;
            }

            .option-grid {
                grid-template-columns: 120px 112px 128px 112px;
                @screen lg {
                    grid-template-columns: 120px 112px auto 112px;
                }
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
  
export class EditProductComponent implements OnInit, OnDestroy
{
    @ViewChild('variantsPanelOrigin') private _variantsPanelOrigin: ElementRef;
    @ViewChild('variantsPanel') private _variantsPanel: TemplateRef<any>;
    // @ViewChildren(MatPaginator) private _productPaginator2: QueryList<MatPaginator>;
    @ViewChild('productPaginationCombo', {read: MatPaginator}) private _productPaginator: MatPaginator;

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
    products$: Observable<Product[]>;
    productType: string;
    newProductId: string = null; // product id after it is created
    creatingProduct: boolean; // use to disable next button until product is created
    allProductsFiltered: Product[]; // used for checking if product name already exist 
    productPagination: ProductPagination = { length: 0, page: 0, size: 0, lastPage: 0, startIndex: 0, endIndex: 0 };


    // inventories
    productInventoriesFA: FormArray;
    productInventories$: ProductInventory[] = [];


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
    productsForCombo$: Observable<Product[]>;
    productPaginationForCombo: ProductPagination;
    clearOptName: boolean = false;

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
    productAssets$: ProductAssets[] = [];
    variantimages: any = [];
    productAssetsFA: FormArray;
    imagesToBeDeleted: any = []; // images to be deleted from BE
    imagesWithId: any = [];



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
    // productVariants: any[] = []; // (variantComboOptions)
    variantToBeCreated: any[] = []; // use for creating on BE 
    variantToBeDeleted: any[] = []; // use for deleting on BE 
    selectedVariantCombos: any = []; // this is the list of combinations generated
    selectedProductVariant: ProductVariant;
    variantImagesToBeDeleted: any = []; // image to be deleted from BE
    productVariantsFA: FormArray;
    productVariants$: ProductVariant[] = [];


    variantIndex: number = 0; // set index when open overlay panel in variant available section


    // variant available section

    filteredProductVariantAvailable: any[] = []; // used in html to loop variant available
    productVariantAvailable: ProductVariantAvailable[] = []; 
    variantAvailableToBeCreated: any = []; // use for creating on BE 
    variantAvailableToBeDeleted: any = []; // use for deleting on BE 
    productVariantAvailableEditMode: boolean = false;
    productVariantAvailableValueEditMode:any = [];



    variantComboItems: any = []; // this is used for generating combinations
    variantComboOptions: any = []; //
    flashMessage: 'success' | 'error' | 'warning' | null = null;
    isLoading: boolean = false;

    // sku, price & quantity 
    // reason these 3 not in formbuilder is because it's not part of product but 
    // it's part of product inventory (it's here for display only)
    displaySku: string = "";
    displayPrice: number = 0;
    displayQuantity: number = 0;
    currentScreenSize: string[];
    deliveryVehicle: any;

    inputSearchProducts : string = '';
    selectedCategory:string ='';
    onChangeSelectProductValue: any = []; // for product checkbox in combo section
    totalAllowed: number = 0;

    storeVerticalCode : string = '';
    parentCategoriesOptions: ProductCategory[];
    selectedParentCategory: string ='';



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
        public dialogRef: MatDialogRef<EditProductComponent>,
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
        // Horizontol stepper
        this.addProductForm = this._formBuilder.group({
            step1: this._formBuilder.group({
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
                isVariants       : [false],
                isPackage        : [false], // combo
                productAssets    : this._formBuilder.array([]),
                productInventories: this._formBuilder.array([]),
                productVariants  : this._formBuilder.array([]),
                isBulkItem       : [false],
                vehicleType      : [''],
                isCustomNote     : [false],
                isNoteOptional   : [true],
                customNote       : [''],
                // form completion
                valid            : [false]
            }),
            variantsSection     : this._formBuilder.array([]),
            comboSection : this._formBuilder.group({
                optionName       : ['', [Validators.required]],
                categoryId       : [''],
            })
        });


        // // get the product type
        // this.productType = this.data.productType;

        // get the product id

        this.setDetails(this.data['productId']);

        // Get the products
        // this.products$ = this._inventoryService.products$;

        // Get the products for combo
        this.productsForCombo$ = this._inventoryService.productsForCombo$;

        this.productsForCombo$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((products: Product[]) => {

                this.filteredProductsOptions = products;
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the pagination
        this._inventoryService.productPaginationForCombo$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: ProductPagination) => {

                // Update the pagination
                this.productPaginationForCombo = pagination;
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });


        // Get the stores
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {

                // Update the pagination
                this.store$ = store;
                this.storeVerticalCode =this.store$.verticalCode;

                // set packingSize to S if verticalCode FnB
                if (this.store$.verticalCode === "FnB" || this.store$.verticalCode === "FnB_PK"){
                    this.addProductForm.get('step1').get('packingSize').patchValue('S');
                    this.checkinput.packingSize = true;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        //get all values for parent categories with specied vertical code
        this._inventoryService.getParentCategories(0, 20, 'name', 'asc', '',this.storeVerticalCode)
        .subscribe((response:ApiResponseModel<ProductCategory[]>)=>{
            
             this.parentCategoriesOptions = response.data["content"];
             return this.parentCategoriesOptions;
        })

        // Get delivery vehicle type
        this._inventoryService.getDeliveryVehicleType()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((vehicles: any) => {

                // Get the vehicles except MOTORCYCLE
                this.deliveryVehicle = vehicles.filter(veh => veh.vehicleType !== 'MOTORCYCLE')
                
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
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // Dispose the overlays if they are still on the DOM
        if ( this._variantsPanelOverlayRef )
        {
            this._variantsPanelOverlayRef.dispose();
        }
    }

    ngAfterViewInit(): void
    {
        // Mark for check
        this._changeDetectorRef.markForCheck();

        setTimeout(() => {

            // Mark for check
            this._changeDetectorRef.markForCheck();        

            
            
            if ( this._productPaginator )
            {
                // Mark for check
                this._changeDetectorRef.markForCheck();
        
                merge(this._productPaginator.page).pipe(
                    switchMap(() => {                    

                        // set loading to true
                        this.isLoading = true;

                        return this._inventoryService.getProductsForCombo(this._productPaginator.pageIndex, this._productPaginator.pageSize, 'name', 'asc',this.inputSearchProducts,'ACTIVE,INACTIVE',this.selectedCategory);
                    
                    }),
                    map(() => {
                        // set loading to false
                        this.isLoading = false;
                    })
                ).subscribe();
            }

            // Mark for check
            this._changeDetectorRef.markForCheck();

        }, 150);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    // --------------------------------------
    // Product Section
    // --------------------------------------
    /**
     * Set product details
     *
     * @param productId
     */
    setDetails(productId: string): void
    {


        // If the product is already selected...
        if ( this.selectedProduct && this.selectedProduct.id === productId )
        {
            // Close the details
        //  this.closeDetails();
            return;
        }

        // Get the product by id
        this._inventoryService.getProductById(productId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {

                let product = response["data"];
                
                // check for product that does not have product inventories, and add them
                if (product.productInventories.length < 1) {
                    // tempSku is generated automatically since there are no product inventory
                    let tempSku = product.name.substring(1).toLowerCase().replace(" / ", "-");
                    // Add Inventory to product
                    this._inventoryService.addInventoryToProduct(product, { sku: tempSku, quantity: 0, price: 0, itemCode: productId + "aa" } )
                        .subscribe((response)=>{

                            // update product
                            product.productInventories = [response];

                            // update sku, price, quantity display since it's not part of product but product inventory
                            //  this.displayPrice = response.price;
                            //  this.displayQuantity = response.quantity;
                            //  this.displaySku = response.sku;

                            this.addProductForm.get('step1').get('sku').setValue(response.sku);
                            this.addProductForm.get('step1').get('price').setValue(response.price);
                            this.addProductForm.get('step1').get('availableStock').setValue(response.quantity);

                            this.loadProductDetails(product);
                        });
                } else {
                    this.loadProductDetails(product);
                }    

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }
 
    // Extension of toggleDetails()
    loadProductDetails (product: Product) {

        // Set the selected product
        this.selectedProduct = product;

        // Fill the form
        this.addProductForm.get('step1').patchValue(product);

        // Fill the form for SKU , Price & Quantity productInventories[0]
        // this because SKU , Price & Quantity migh have variants
        // this is only for display, so we display the productInventories[0] 
        // this.displaySku = product.productInventories[0].sku;
        // this.displayPrice = product.productInventories[0].price;
        // this.displayQuantity = product.productInventories[0].quantity;

        this.addProductForm.get('step1').get('sku').setValue(product.productInventories[0].sku);
        this.addProductForm.get('step1').get('price').setValue(product.productInventories[0].price);
        this.addProductForm.get('step1').get('availableStock').setValue(this.totalInventories(product.productInventories));

        if (this.addProductForm.get('step1').get('customNote').value || this.addProductForm.get('step1').get('isNoteOptional').value === false ){
            this.addProductForm.get('step1').get('isCustomNote').setValue(true);
        }
        
        // disable the input if product has variants
        if (product.productVariants.length > 0) {
            this.addProductForm.get('step1').get('sku').disable();
            this.addProductForm.get('step1').get('price').disable();    
            this.addProductForm.get('step1').get('availableStock').disable();    
        }

        // ---------------------
        // IsBulkItem Toggle
        // --------------------

        // turn off the bulk item toggle if vehicleType is null
        if (this.addProductForm.get('step1').get('vehicleType').value === null){
            this.addProductForm.get('step1').get('isBulkItem').setValue(false)
        }
        // if vehicleType is motor, also turn off the toggle
        else if (this.addProductForm.get('step1').get('vehicleType').value === 'MOTORCYCLE'){
            this.addProductForm.get('step1').get('isBulkItem').setValue(false)
        }
        // else, turn on the toggle
        else    
            this.addProductForm.get('step1').get('isBulkItem').setValue(true)


    
        // ---------------------
        // IsVariant Toggle 
        // ---------------------

        // set isVariants = true is productInventories.length > 0
        product.productVariants.length > 0 ? this.addProductForm.get('step1').get('isVariants').patchValue(true) : this.addProductForm.get('step1').get('isVariants').patchValue(false);

        // ---------------------
        // Images
        // ---------------------

        // Sort productAssets and place itemCode null in front, after that variants image
        let imagesObjSorted = product.productAssets.sort(this.dynamicSort("itemCode"));
        let imageArr = imagesObjSorted.map(item => item.url);

        imagesObjSorted.forEach(item => {
            this.imagesWithId.push({id: item.id, url: item.url})
        })
        
        this.images = imageArr;

        // get thumbnail index
        let _thumbnailIndex = null;

        // if has variants
        if (this.addProductForm.get('step1').get('isVariants').value === true){

            let m = 0;

            for (let i = 0; i < imagesObjSorted.length; i++){

                // if no itemCode, continue the loop, and increase m by one
                if (imagesObjSorted[i].itemCode == null){
                    m++;
                    continue;
                }
                // if thumbnail is true, take i and minus with m. This is to offset the index of assets with itemcode
                if (imagesObjSorted[i].isThumbnail === true){
                    _thumbnailIndex = i - m;
                }
            }
        }
        // if no variant
        else {

            _thumbnailIndex = imagesObjSorted.findIndex(item => item.isThumbnail === true)
        }

        this.thumbnailIndex = _thumbnailIndex === -1 ? 0 : _thumbnailIndex;

        // ---------------------
        // Product Assets
        // ---------------------

        this.productAssets$ = product.productAssets;

        this.productAssetsFA = this.addProductForm.get('step1').get('productAssets') as FormArray;
        // this.productAssets.clear();


        this.imagesFile = [];

        this.productAssets$.forEach(item => {
            this.productAssetsFA.push(this._formBuilder.group(item));
            this.imagesFile.push(null) // push imagesFile with null to defined now many array in imagesFile
        });

        // ---------------------
        // Product Inventories
        // ---------------------
            
        this.productInventories$ = product.productInventories;
        this.productInventoriesFA = this.addProductForm.get('step1').get('productInventories') as FormArray;
        // this.productInventories.clear();

        this.productInventories$.forEach(item => {
            this.productInventoriesFA.push(this._formBuilder.group(item));
        });

        // ---------------------
        // Variants
        // ---------------------

        // Set to this productVariants 
        this.productVariants$ = product.productVariants;
        
        this.productVariantsFA = this.addProductForm.get('step1').get('productVariants') as FormArray;
        // this.productVariants.clear();

        this.productVariants$.forEach(item => {
            let _item = this._formBuilder.group({
                id: item.id,
                name: item.name,
                productVariantsAvailable: [item.productVariantsAvailable] // idk why, but this is the only workable way to archive array in this._formBuilder.group
            });

            this.productVariantsFA.push(_item);
        });

        // this.filteredProductVariants = this.productVariants.value;


        // Generate variants combination

        this.generateVariantCombo();

        // ---------------------
        // Category
        // ---------------------

        // Add the category
        this.selectedProduct.categoryId = product.categoryId;

        // Update the selected product form
        this.addProductForm.get('step1').get('categoryId').patchValue(this.selectedProduct.categoryId);

        //to get the details of catgeory and show the tier category
        this._inventoryService.getCategoriesById(product.categoryId).subscribe((res:ProductCategory)=>{
            this.selectedParentCategory = res.parentCategoryId;

        })

        // Sort the filtered categories, put selected category on top
        // First get selected array index by using this.selectedProduct.categoryId

        let selectedProductCategoryIndex = this.filteredProductCategories.findIndex(item => item.id === this.selectedProduct.categoryId);
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

        // ---------------------
        // Inventory Alarm
        // ---------------------

        this.selectedProduct.minQuantityForAlarm = product.minQuantityForAlarm;

        // Update minQuantityForAlarm
        this.addProductForm.get('step1').get('minQuantityForAlarm').patchValue(this.selectedProduct.minQuantityForAlarm);

        // Update the selected product form
        this.addProductForm.get('step1').get('minQuantityForAlarm').patchValue(this.selectedProduct.minQuantityForAlarm);

        // ---------------------
        // Product Combo Package
        // ---------------------

        // get product combo list
        if (this.selectedProduct.isPackage === true) {
            this._inventoryService.getProductPackageOptions(product.id)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((response)=>{
                    this.productsCombos$ = response["data"];
                });
        }
        
    }

    generateVariantCombo() {

        //set variantImages to null
        this.variantimages = [];

        // set to null
        this.variantAvailableToBeCreated = [];
        this.variantAvailableToBeDeleted = [];
        this.variantToBeCreated = []; 
        this.variantToBeDeleted = []; 
        this.selectedVariantCombos = [];

        // initialise empty variantItems
        // this variantItems only for front end use to display variant combination
        let variantItems:any = [];
        let variantOptions:any = [];

        // set a new variant object to display @ front end
        // sort object if there is more than 1 variants
        if (this.selectedProduct.productVariants.length > 0) {
            // sort this selected productVariants
            this.sortObjects(this.selectedProduct.productVariants)
            // this.variantChecked = true;
            // this.toggleDefaultInventory(true)
            
            // next sort this.selectedProduct.productVariantsAvailable
            this.selectedProduct.productVariants.forEach((element: ProductVariant, index) => {
                this.sortObjects(element.productVariantsAvailable)
                // this.options.push({ name: element.name, id: element.id })

                // push empty values array and ids array for each productVariantsAvailable
                // variantOptions.push({ name: element.name, id: element.id })
                variantOptions.push(element)
                variantItems.push({ values: [], ids: [] })

                // push productVariantsAvailable.value and productVariantsAvailable.id to the 
                // created items above
                element.productVariantsAvailable.forEach(item => {
                    variantItems[index].values.push(item.value);
                    variantItems[index].ids.push(item.id);
                });
            });
        }
        
        this.variantComboItems = variantItems
        this.variantComboOptions = variantOptions
        this.filteredProductVariants = this.variantComboOptions        

        this.getallCombinations(this.variantComboItems)

        
        //set inventory
        const productIdLength = this.selectedProduct.id.length;
        (this.selectedProduct.productInventories).forEach((item: ProductInventory, index) => {

            if (item.itemCode.slice(-1) != "a") {
                const index = parseInt(item.itemCode.substring(productIdLength)); 

                if (this.selectedVariantCombos[index]) {
                    this.selectedVariantCombos[index].itemCode = item.itemCode;
                    this.selectedVariantCombos[index].price = item.price;
                    this.selectedVariantCombos[index].sku = item.sku;
                    this.selectedVariantCombos[index].quantity = item.quantity;
                    this.selectedVariantCombos[index].status = item.status;
                    this.selectedVariantCombos[index].preview = '';
                    this.selectedVariantCombos[index].newAsset = false;
                    this.selectedVariantCombos[index].isThumbnail = false;
                    this.selectedVariantCombos[index].file = '';
                }                
            }
        });

        
        const pIdLen = this.selectedProduct.id.length;
        
        this.selectedProduct.productAssets.forEach(element => {
            if (element.itemCode) {
                this.variantimages[parseInt(element.itemCode.substring(pIdLen))] = ({ itemCode: element.itemCode, preview: element.url, assetId: element.id, isThumbnail: element.isThumbnail })
                
            }
        });
        

        // get selectedVariantCombos
        const arr1 = this.selectedVariantCombos;

        // remove images that does not have itemCode 
        // so this means arr2 will contains images that related to variants only 
        // const arr2 = (this.selectedProduct.productAssets).filter((item) => 
        //     item.itemCode !== null
        // );
        const arr2 = this.variantimages;

        const map = new Map();
        arr1.forEach(item => map.set(item.itemCode, item));
        arr2.forEach(item => map.set(item.itemCode, {...map.get(item.itemCode), ...item}));
        const mergedArr = Array.from(map.values());

        // remove empty object if any
        let clean = mergedArr.filter(element => {
            if (Object.keys(element).length !== 0) {
                return true;
              }
            
              return false;
        })
        
        this.selectedVariantCombos = clean;

    }


    // This fuction used to sort object
    dynamicSort(property) {
        var sortOrder = 1;
        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a,b) {
            /* next line works with strings and numbers, 
            * and you may want to customize it to your needs
            */

            let aProp = a[property] ? a[property] : '';
            let bProp = b[property] ? b[property] : '';

            var result = ( aProp.toLowerCase() < bProp.toLowerCase()) ? -1 : (aProp.toLowerCase() > bProp.toLowerCase()) ? 1 : 0;
            return (result * sortOrder);
        }
    }

    sortObjects(array) {
        array.sort(function (a, b) {
        return a.sequenceNumber - b.sequenceNumber;
        });
    }


    generateSku(){
        if (this.addProductForm.get('step1').get('isVariants').value === true) {
            if ((this.addProductForm.get('step1').get('name').value && !this.addProductForm.get('step1').get('sku').value) ||
                (this.addProductForm.get('step1').get('name').value.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '') === this.addProductForm.get('sku').value) 
            ){
                this.addProductForm.get('step1').get('sku').patchValue(this.addProductForm.get('step1').get('name').value.trim().toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''));
                this.checkinput.sku = true;
            }
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

        //to display the tier category
        this.selectedParentCategory = category.parentCategoryId;
        
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
        this.addProductForm.get('step1').get('categoryId').patchValue("");

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

        // Return and throw warning dialog if image filename is more than 100 characters
        if ( fileList[0].name.length > 100 )
        {
            this._fuseConfirmationService.open({
                title  : 'The file name is too long',
                message: 'The file name cannot exceed 100 characters (including spaces).',
                icon       : {
                    show : true,
                    name : 'heroicons_outline:exclamation',
                    color: 'warning'
                },
                actions: {
                    
                    cancel: {
                        label: 'OK',
                        show: true
                        },
                    confirm: {
                        show: false,
                    }
                    }
            });

            return;
        }


        // Return and throw warning dialog if image file size is big
        let maxSize = 1048576;
        var maxSizeInMB = (maxSize / (1024*1024)).toFixed(2);
        
        if (fileList[0].size > maxSize ) {
            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Image size limit',
                message: 'Your uploaded image exceeds the maximum size of ' + maxSizeInMB + ' MB !',
                icon: {
                    show: true,
                    name: "image_not_supported",
                    color: "warn"
                },
                actions: {
                    
                    cancel: {
                        label: 'OK',
                        show: true
                        },
                    confirm: {
                        show: false,
                    }
                    }
            });
            return;
        }

        
        var reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onload = (_event)  => {
            // add new image
            if(!images.length === true) {
                this.images.push(reader.result);
                this.imagesFile.push(file);
                this.currentImageIndex = this.images.length - 1;
                
            } 
            // replace current image
            else {
                this.images[this.currentImageIndex] = reader.result + "";
                this.imagesFile[this.currentImageIndex] = file;
                this.imagesToBeDeleted.push({id: this.addProductForm.get('step1').get('productAssets').value[this.currentImageIndex].id, index: this.currentImageIndex})

                this.imagesWithId[this.currentImageIndex] = { id: null, url: reader.result + ""}
            }
            
            // set as dirty to remove pristine condition of the form control
            this.addProductForm.get('step1').markAsDirty();

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

        // if (index === this.thumbnailIndex){

        //     this._fuseConfirmationService.open({
        //     title  : 'Reminder',
        //     message: 'You cannot delete a thumbnail image.',
        //     icon       : {
        //         show : true,
        //         name : 'heroicons_outline:exclamation',
        //         color: 'warning'
        //     },
        //     actions: {
                
        //         cancel: {
        //             label: 'OK',
        //             show: true
        //             },
        //         confirm: {
        //             show: false,
        //         }
        //         }
        //     });

        // }
        // else {


        // }
        if (index > -1) {
            this.images.splice(index, 1);
            this.imagesFile.splice(index, 1);
            this.currentImageIndex = 0;
            if (this.imagesWithId[index]) {
                
                this.imagesToBeDeleted.push({id: this.imagesWithId[index].id, index: index})
            }
            this.imagesWithId.splice(index, 1);
        }

        if (this.images.length == 0) {
            this.thumbnailIndex = -1;
        }
        else if (this.images.length == 1) {
            this.thumbnailIndex = 0;
        }

        this._changeDetectorRef.markForCheck();
        
        // set as dirty to remove pristine condition of the form control
        this.addProductForm.get('step1').markAsDirty();
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

    /**
     * Update the selected product using the form data
     */
    async updateProductMethod(): Promise<void>
    {

        // Set loading to true
        this.isLoading = true;

        // Get store domain
        let storeFrontURL = 'https://' + this.store$.domain;

        // if the bulk item toggle stays close, then set to 'MOTORCYCLE'
        if (this.addProductForm.get('step1').get('isBulkItem').value === false){
            this.addProductForm.get('step1').get('vehicleType').setValue('MOTORCYCLE')
        }
        const step1FormGroup = this.addProductForm.get('step1') as FormGroup;
        
        // Get the product object
        const { sku, price, quantity, isCustomNote, ...product} = step1FormGroup.getRawValue();
        
        
        product.seoName = product.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        product.seoUrl = storeFrontURL + '/product/' + product.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        product.name = product.name.trim();

        // Get the product object for updating the product
        const { productAssets, productInventories, productReviews, productVariants, ...productToUpdate} = product;
        
        // Update the product on the server
        await this._inventoryService.updateProduct(this.selectedProduct.id, productToUpdate)
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(async () => {

            // this.products$
            // .pipe(take(1)) 
            // .subscribe(products => {

            //     // filter after update
            //     this.filterProductOptionsMethod(products);
            // })

            
            // if got variants
            if (this.addProductForm.get('step1').get('isVariants').value === true) {

                // if the combinations were changed, delete entire inventory and create them 
                if (this.variantToBeCreated.length > 0 || this.variantToBeDeleted.length > 0 || this.variantAvailableToBeCreated.length > 0 || this.variantAvailableToBeDeleted.length > 0){
                    // DELETE ENTIRE INVENTORY
                    await this.deleteEntireInventory()
                    
                    // INVENTORY
                    if (this.selectedVariantCombos.length > 0){
                        for (let i = 0; i < this.selectedVariantCombos.length; i++) {
                    
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
                } 
                // if no changes were made to the combinations, just update the inventory
                else {

                    for (let i = 0; i < this.selectedVariantCombos.length; i++) {
                    
                        // }
                        const body = {
                            price: this.selectedVariantCombos[i].price,
                            compareAtPrice: 0,
                            quantity: this.selectedVariantCombos[i].quantity,
                            sku: this.selectedVariantCombos[i].sku,
                            status: this.selectedVariantCombos[i].status
                        }
    
                        await this._inventoryService.updateInventoryToProduct(this.selectedProduct.id, this.productInventories$[i].itemCode, body).toPromise()
                        .then((response)=>{
    
                        });
                    }

                }
        
                // VARIANT
                // Delete the variant from the BE
                if (this.variantToBeDeleted.length > 0){
    
                    this.variantToBeDeleted.forEach(variant => {
                        this._inventoryService.deleteVariant(this.selectedProduct.id, variant.id , variant)
                            .pipe(takeUntil(this._unsubscribeAll))
                            .subscribe((response)=>{
                                // this.removeVariantFromProduct(response)
                            });
                    })
                }
    
                // create new variants
                const variantIds = await this.createVariantInBE()
    
                // Delete the variant available from the BE
                if (this.variantAvailableToBeDeleted.length > 0){
                    
                    this.variantAvailableToBeDeleted.forEach(options => {
                        this._inventoryService.deleteVariantAvailable(options, this.selectedProduct.id)
                            .pipe(takeUntil(this._unsubscribeAll))
                            .subscribe((response)=>{
                                
                            });
    
                    })
                }
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
    
            }
    
            // else means no variants
            else {
                // Update the inventory product on the server
                let _productInventories = {
                    price: step1FormGroup.value.price,
                    compareAtprice: 0,
                    quantity: step1FormGroup.value.availableStock,
                    sku: step1FormGroup.value.sku,
                    status: "AVAILABLE"
                } 
                
                await this._inventoryService.updateInventoryToProduct(this.selectedProduct.id, this.productInventories$[0].itemCode, _productInventories).toPromise().then(() => {
                    // Show a success message
                    // this.showFlashMessage('success');
                });
    
                

                

                //////////////////////////////////////////////////////////////////////

                // // If got product assets
                // if (product.productAssets) {
                //     let expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
                //     let regex = new RegExp(expression);
                //     let iteration = 0; // this iteration used by new product added to existing old product (not update tau)
                    
                //     this.addProductForm.get('step1').get('productAssets').value.forEach((item, i) => {
                //     // this.images.forEach((item, i) => {
                //         let assetIndex = product.productAssets.findIndex(element => element.id === item.id)                        
                        
                //         let _thumbnailIndex = product.productAssets.findIndex(element => element.isThumbnail === true)
                //         if (assetIndex > -1) {
                //             if (!item.url.match(regex)) { // if url is not valid, it mean the data is new data
                                
        
                //                 // -----------------
                //                 // delete old one
                //                 // -----------------
        
                //                 this._inventoryService.deleteProductAssets(this.selectedProduct.id, item.id)
                //                 .pipe(takeUntil(this._unsubscribeAll))
                //                 .subscribe((deleteResponse)=>{
        
                //                     // -----------------
                //                     // create a new one
                //                     // ----------------
        
                //                     let formData = new FormData();
                //                     formData.append('file',this.imagesFile[i]);
                //                     this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === this.thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false }, i)
                //                         .pipe(takeUntil(this._unsubscribeAll))
                //                         .subscribe((addResponse)=>{
        
                //                             // update the deleted product assets
                //                             let _updatedProduct = product.productAssets;
                //                             _updatedProduct[assetIndex] = addResponse;
        
                //                             // patch the value
                //                             this.addProductForm.get('step1').get('productAssets').patchValue(_updatedProduct);
        
                //                             // Mark for check
                //                             this._changeDetectorRef.markForCheck();
                //                         });
        
                //                     // Mark for check
                //                     this._changeDetectorRef.markForCheck();
                //                 });
        
        
                //             } else if (i === this.thumbnailIndex)
                //                 { // this mean thumbnail index change, diffent from backend
                //                     // update the image (only thumbnail)


                //                     let updateItemIndex = item;
                //                     updateItemIndex.isThumbnail = true;
            
                //                     this._inventoryService.updateProductAssets(this.selectedProduct.id, updateItemIndex, item.id)
                //                         .pipe(takeUntil(this._unsubscribeAll))
                //                         .subscribe((response)=>{
                //                             // Mark for check
                //                             this._changeDetectorRef.markForCheck();
                //                         });

                //                 } 
                //             else {
                                
                //             }
                //         } else {
        
                //             // -----------------
                //             // create a new one
                //             // ----------------
        
                //             iteration = iteration + 1;
        
                //             let formData = new FormData();
                //             formData.append('file',this.imagesFile[i]);

                //             this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === this.thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false }, i)
                //                 .pipe(takeUntil(this._unsubscribeAll))
                //                 .subscribe((addResponse)=>{
        
                //                     // update the deleted product assets
                //                     // let _updatedProduct = this.selectedProductForm.get('productAssets').value;
                //                     // _updatedProduct[i + iteration -1] = addResponse;
        
                //                     // if (this.selectedProductForm.get('productAssets').value.length > 0 ){
                //                     //     // patch the value if have existing value 
                //                         this.addProductForm.get('step1').get('productAssets').value[i] = addResponse;
                //                     // } else {
                //                         // patch the value if empty 
                //                         // this.selectedProductForm.get('productAssets').patchValue(_updatedProduct);
                //                     // }
        
                //                     // Mark for check
                //                     this._changeDetectorRef.markForCheck();
                //                 });
                //         }
                //     })

                //     // if new images added and got old one as well 
                //     this.imagesFile.forEach((item, i )=> {
                        
                //         if (item){
                //             let formData = new FormData();
                //             formData.append('file',this.imagesFile[i]);
                //             this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === this.thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false })
                //                 .pipe(takeUntil(this._unsubscribeAll))
                //                 .subscribe((response)=>{

                //                     this.addProductForm.get('step1').get('productAssets').value[i] = response;
                //                     // Mark for check
                //                     this._changeDetectorRef.markForCheck();
                //                 });
                //             }
                //     })

                // } 
                // else {
                //     for (let i = 0; i < this.imagesFile.length; i++) {
                //         // create a new one
                //         let formData = new FormData();
                //         formData.append('file',this.imagesFile[i]);
                //         this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === this.thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false })
                //             .pipe(takeUntil(this._unsubscribeAll))
                //             .subscribe((response)=>{

                //                 this.addProductForm.get('step1').get('productAssets').value[i] = response;
                //                 // Mark for check
                //                 this._changeDetectorRef.markForCheck();
                //             });
                //     }
                // }

                
            }
            // Show a success message
            this.showFlashMessage('success');

            // Set delay before closing the details window
            setTimeout(() => {

                // Set loading to false
                this.isLoading = false;

                // close the window
                this.cancelAddProduct()
    
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }, 1000);

        });

        // create image
        this.imagesFile.forEach((item, i ) => {
            if (item){
                let formData = new FormData();
                formData.append('file',this.imagesFile[i]);
                this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === this.thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false })
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((response)=>{

                        this.addProductForm.get('step1').get('productAssets').value[i] = response;
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });
                }
        })

        // update the image (only thumbnail)
        this.imagesWithId.forEach((asset, i) => {
                
            if (i === this.thumbnailIndex && asset.id) {
                
                let updateItemIndex = asset;
                updateItemIndex.isThumbnail = true;

                this._inventoryService.updateProductAssets(this.selectedProduct.id, updateItemIndex, asset.id)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((response)=>{
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });
            }

        })

        // Delete main product images
        for (let i = 0; i < this.imagesToBeDeleted.length; i++) {
            
            await this._inventoryService.deleteProductAssets(this.selectedProduct.id, this.imagesToBeDeleted[i].id).toPromise().then(data => {

                this.thumbnailIndex
                this._changeDetectorRef.markForCheck();
            });
        }


        // DELETE VARIANT IMAGES
        for (let i = 0; i < this.variantImagesToBeDeleted.length; i++) {
            await this._inventoryService.deleteProductAssets(this.selectedProduct.id, this.variantImagesToBeDeleted[i]).toPromise().then(data => {
                this._changeDetectorRef.markForCheck();
            });
        }

        // set the array to null
        this.variantImagesToBeDeleted = [];
        this.imagesToBeDeleted = [];


        // CREATE VARIANT IMAGES
        for (let i = 0; i < this.selectedVariantCombos.length; i++) {
                
            // if new, create new asset
            if (this.selectedVariantCombos[i].newAsset == true) {
            
                let formdata = new FormData();
                formdata.append("file", this.selectedVariantCombos[i].file);
                await this._inventoryService.addProductAssets(this.selectedProduct.id, formdata, (i === this.thumbnailIndex) ? { isThumbnail: true , itemCode: this.selectedProduct.id + i } : { isThumbnail: false, itemCode: this.selectedProduct.id + i }, i)
                .toPromise().then(data => {
                    this._changeDetectorRef.markForCheck();
                });
            }
            // if it is an old one, update it (update thumbnail)
            else if (i === this.thumbnailIndex && this.selectedVariantCombos[i].newAsset == false && this.selectedVariantCombos[i].assetId) {
                await this._inventoryService.updateProductAssets(this.selectedProduct.id, { isThumbnail: true , itemCode: this.selectedProduct.id + i }, this.selectedVariantCombos[i].assetId)
                .toPromise().then(data => {
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
            }
        }
        
    }


    // async postVariantMethod(){
        
    //     // if it is variants
    //     if (this.addProductForm.get('step1').get('isVariants').value === true) {

    //         // DELETE ENTIRE INVENTORY
    //         await this.deleteEntireInventory()
                    
    //         // INVENTORY
    //         if (this.selectedVariantCombos.length > 0){
    //             for (var i = 0; i < this.selectedVariantCombos.length; i++) {
            
    //                 // }
    //                 const body = {
    //                     // itemCode: this.selectedProduct.id + "-" + i,
    //                     itemCode: this.selectedProduct.id + i,
    //                     price: this.selectedVariantCombos[i].price,
    //                     compareAtPrice: 0,
    //                     quantity: this.selectedVariantCombos[i].quantity,
    //                     sku: this.selectedVariantCombos[i].sku,
    //                     status: this.selectedVariantCombos[i].status
    //                 }
    
    //                 await this._inventoryService.addInventoryToProduct(this.selectedProduct, body).toPromise()
    //                 .then((response)=>{
    
    //                 });
    //             }
                
    //         }
    
    
    //         // create new variants
    //         const variantIds = await this.createVariantInBE()
    
    //         let variantAvailablesCreated = [];
    //         // if got new variant availables, pass the variantIds from the createVariant endpoint
    //         if (this.variantAvailableToBeCreated.length > 0){
                
    //             variantAvailablesCreated = await this.createVariantAvailableInBE(variantIds);
    
                
    //         }
    //         else {
    
    //             await this._inventoryService.getVariantAvailable(this.selectedProduct.id).then((response) => {
    
    //                 variantAvailablesCreated = response;
                    
    //             })
    
    //         }
    
    //         await this.addInventoryItem(variantAvailablesCreated);

    //         // CREATE VARIANT IMAGES
    //         for (let i = 0; i < this.selectedVariantCombos.length; i++) {
                
    //             // if new, create new asset
    //             if (this.selectedVariantCombos[i].newAsset == true) {
                
    //                 let formdata = new FormData();
    //                 formdata.append("file", this.selectedVariantCombos[i].file);
    //                 await this._inventoryService.addProductAssets(this.selectedProduct.id, formdata, (i === this.thumbnailIndex) ? { isThumbnail: true , itemCode: this.selectedProduct.id + i } : { isThumbnail: false, itemCode: this.selectedProduct.id + i }, i)
    //                 .toPromise().then(data => {
    //                     this._changeDetectorRef.markForCheck();
    //                     // Show a success message
    //                     this.showFlashMessage('success');
    //                     // Set delay before closing the window
    //                     setTimeout(() => {

    //                         // close the window
    //                         this.cancelAddProduct()
                
    //                         // Mark for check
    //                         this._changeDetectorRef.markForCheck();
    //                     }, 1000);

    //                 });
    //             }
    //             // if it is an old one, update it (update thumbnail)
    //             else if ((i === this.thumbnailIndex) && (this.selectedVariantCombos[i].newAsset == false) && (this.selectedVariantCombos[i].file != '')) {
    //                 await this._inventoryService.updateProductAssets(this.selectedProduct.id, { isThumbnail: true , itemCode: this.selectedProduct.id + i }, this.selectedVariantCombos[i].assetId)
    //                 .toPromise().then(data => {
    //                 // Mark for check
    //                 this._changeDetectorRef.markForCheck();
    //                 });
    //             }
    //         }
    
    //     }
    //     // else means combo
    //     else {
    //         // Show a success message
    //         this.showFlashMessage('success');
    //         // Set delay before closing the window
    //         setTimeout(() => {
    
    //             // close the window
    //             this.cancelAddProduct()
    
    //             // Mark for check
    //             this._changeDetectorRef.markForCheck();
    //         }, 1000);
    //     }
    // }

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
        this.selectedProduct = null;
        (this.addProductForm.get('step1').get('productInventories') as FormArray).clear();
        (this.addProductForm.get('step1').get('productVariants') as FormArray).clear();
        (this.addProductForm.get('step1').get('productAssets') as FormArray).clear();
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

    checkInput(input, event = null){
        // check input
        if ((this.addProductForm.get('step1').get(input) && this.addProductForm.get('step1').get(input).value) || 
            (input === 'category' && event.target.checked)
            ) {
            this.checkinput[input] = true;
        } else {
            this.checkinput[input] = false;
        }
    }

    disabledTrackStock(isTrackStock: boolean) {
        if (isTrackStock === false){
            this.addProductForm.get('step1').get('allowOutOfStockPurchases').patchValue(false);
            this.addProductForm.get('step1').get('minQuantityForAlarm').patchValue(-1);
        }
    }

    setThumbnail(currentImageIndex: number){
        this.thumbnailIndex = currentImageIndex;

        // set as dirty to remove pristine condition of the form control
        this.addProductForm.get('step1').markAsDirty();
    
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
        this.filteredProductVariants = this.productVariants$.filter(variant => variant.name.toLowerCase().includes(value));


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

    deleteAllVariantsConfirmation(){

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete variants',
            message: 'Are you sure you want to disable this variants? Current variants of this product will be removed permenantly!',
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
                // go through all the variants, and delete it
                this.selectedProduct.productVariants.forEach(item => {
                    this._inventoryService.deleteVariant(this.selectedProduct.id, item.id, item).subscribe(response => {

                    });
                });

                // go through the assets and delete them
                this.selectedVariantCombos.forEach(asset => {
                    // if have itemCode means it is for variants
                    if (asset.itemCode){
                        this._inventoryService.deleteProductAssets(this.selectedProduct.id, asset.assetId).toPromise().then(data => {
                            this._changeDetectorRef.markForCheck();
                        });

                    }
                })
                // set the variant combinations array to empty
                this.selectedVariantCombos = [];
                this.variantComboItems = [];
                this.variantComboOptions = [];

                // enable back the fields if variant toggle is set to 'No'
                this.addProductForm.get('step1').get('sku').enable();
                this.addProductForm.get('step1').get('price').enable();    
                this.addProductForm.get('step1').get('availableStock').enable();   

            } else {
                // Update the selected product form
                this.addProductForm.get('step1').get('isVariants').patchValue(true);
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
        
    }

    /**
     * Should the create variant button be visible
     *
     * @param inputValue
     */
    shouldShowCreateVariantButton(inputValue: string): boolean
    {
        
        return !!!(inputValue === '' || this.productVariants$.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);
        // return !!!(inputValue === '' || this.productVariants.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);
        // return !!!(inputValue === '' || this.variantComboOptions.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);

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

    // push to the array loop
        let item = {
            id:null,
            name: name,
            productVariantsAvailable: [],
        };
        this.productVariants$.push(item);    
        this.filteredProductVariants= this.productVariants$;    
        
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
                if (variant.id){
                    // Use to delete on BE
                    this.variantToBeDeleted.push(variant)
                }

                // Remove from array to be created
                this.variantToBeCreated.splice(variantIdx, 1);

                // Delete the variant from formArray - formArray cannot use splice. Need to use removeAt
                this.productVariants$.splice(variantIdx, 1);
                this.filteredProductVariants = this.productVariants$;
                //  this.variantComboOptions = this.productVariants.value;
                
                // Delete the variant from variantComboItems
                this.variantComboItems.splice(variantIdx, 1);
                // this.variantComboOptions.splice(variantIdx, 1);
                
                // this.filteredProductVariants = this.variantComboOptions;
                this.selectedVariantCombos = []
             
                this.getallCombinations(this.variantComboItems)
 
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

        this.selectedVariantCombos = []

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
                    this.variantAvailableToBeDeleted.push(variantAvailable)
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

                this.selectedVariantCombos = []

                // to generate the combinations
                this.getallCombinations(this.variantComboItems)

                //----------------------------
                // selectedVariantCombos
                //----------------------------

                // to remove combinations with deleted options

                // let splitted = [];
                // let temp = this.selectedVariantCombos;

                // this.selectedVariantCombos.forEach( v => {

                //     // first, split the variant name
                //     splitted = v.variant.split(" / ")

                //     // then, check if the splitted name is identical to the variant available to be deleted, if same, return true
                //     if (splitted.some( (name) => name === variantAvailable.value ))
                //         // if identical, filter the temp
                //         {
                //             temp = temp.filter(x => x.variant !== v.variant);
                //         }
                // })
                
                // this.selectedVariantCombos = temp;

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
            this.variantImagesToBeDeleted.push(this.selectedVariantCombos[idx].assetId)
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
                        this.variantImagesToBeDeleted.push(this.selectedVariantCombos[imageIdx].assetId)
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
    showFlashMessage(type: 'success' | 'error' | 'warning'): void
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
        // this.filteredProductsOptions = this._filteredProductsOptions.filter(product => product.name.toLowerCase().includes(value));

        this.inputSearchProducts = value;

        fromEvent(event.target,'keyup')
        .pipe(
            takeUntil(this._unsubscribeAll),
            debounceTime(500),
            switchMap((event:any) => {
                        
                return this._inventoryService.getProductsForCombo(0, 10, 'name', 'asc', event.target.value,'ACTIVE,INACTIVE')
            }),
            map(() => {
                this.isLoading = false;
            })
        )
        .subscribe();

    }

    onSelectCategoryList(event) {

        this.selectedCategory = event.value;

        if (this.selectedCategory )
        {
            return this._inventoryService.getProductsForCombo(0, 10, 'name', 'asc', this.inputSearchProducts,'ACTIVE,INACTIVE',this.selectedCategory).subscribe();
        } 
        else {
            return this._inventoryService.getProductsForCombo(0, 10, 'name', 'asc', this.inputSearchProducts,'ACTIVE,INACTIVE').subscribe();

        }

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

    selectProductOption(optionId) {

        // If the product is already selected...
        if ( this.selectedProductsOption && this.selectedProductsOption.id === optionId )
        {
            // Clear the form
            this.selectedProductsOption = null;
            this.onChangeSelectProductValue.length = 0;
        }

        // Get the product by id
        this._inventoryService.getProductsOptionById(optionId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((packages) => {
                this.selectedProductsOption = packages;

                // this is for checkbox
                this.onChangeSelectProductValue = this.selectedProductsOption["productPackageOptionDetail"].map(x => x.productId);

                // this is for Total Allowed input field, to make it dirty
                this.addProductForm.get('comboSection').get('categoryId').setValue(this.onChangeSelectProductValue);
            });

    }

    deleteProductOption(optionId) {
        // If the product is already selected...
        if ( this.selectedProductsOption && this.selectedProductsOption.id === optionId )
        {
            // Clear the form
            this.selectedProductsOption = null;
            this.onChangeSelectProductValue.length = 0;
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

        // if (this._selectedProductsOption["totalAllow"] > this.onChangeSelectProductValue.length) {
        //     // Show a error message
        //     // Open the confirmation dialog
        //     this._fuseConfirmationService.open({
        //         title  : 'Reminder',
        //         message: 'Total allowed cannot be more than products in option.',
        //         icon       : {
        //             show : true,
        //             name : 'heroicons_outline:exclamation',
        //             color: 'warning'
        //         },
        //         actions: {
                    
        //             cancel: {
        //                 label: 'OK',
        //                 show: true
        //                 },
        //             confirm: {
        //                 show: false,
        //             }
        //             }
        //     });
            
            
        // } else {

        // }
        this.clearOptName = true;

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

                    this.clearOptName = false;

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

                    this.clearOptName = false;

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        }

        // Clear the form
        this.selectedProductsOption = null;
        // Clear the invisible form
        this._selectedProductsOption = {};
        // Clear checkbox
        this.onChangeSelectProductValue.length = 0;


        // for(let i=0;i < this.filteredProductsOptions.length;i++){
        //     this.optionChecked[i] = false;
        // }
        
    }

    resetSelectedProductsOption() {
        this.selectedProductsOption = null;
        // Clear checkbox
        this.onChangeSelectProductValue.length = 0;
        this.addProductForm.get('comboSection').get('categoryId').reset;
        this.totalAllowed = 0;
        this._selectedProductsOption = {};
        
    }

    validateProductsOptionName(value) {
        
        // if this.selectedProductsOption have value // for update
        if (this.selectedProductsOption) {
            this._selectedProductsOption = this.selectedProductsOption;
        }

        this._selectedProductsOption["title"] = value;
    }

    insertProductsInOption(productId, isChecked: MatCheckboxChange) {

        // if this.selectedProductsOption have value // for update
        if (this.selectedProductsOption) {
            this._selectedProductsOption = this.selectedProductsOption;
        }

        if (isChecked.checked) {

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

        this.onChangeSelectProductValue = this._selectedProductsOption["productPackageOptionDetail"].map(x => x.productId);
        this.addProductForm.get('comboSection').get('categoryId').patchValue(this.onChangeSelectProductValue);
        
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

    validateProductsOptionTotalAllowed(value) {
        // if this.selectedProductsOption have value // for update
        if (this.selectedProductsOption) {
            this._selectedProductsOption = this.selectedProductsOption;
        }
        
        this._selectedProductsOption["totalAllow"] = value;
        this.totalAllowed = value;
    }

    variantSkuChanged(event, i) {
        this.selectedVariantCombos[i].sku = event.target.value;
    
    }

    variantStockChanged(event, i) {
        this.selectedVariantCombos[i].quantity = event.target.value;
    
    }

    variantPriceChanged(event, i) {
        this.selectedVariantCombos[i].price = event.target.value;
    }

    /**
     * Delete the selected product using the form data
     */
    deleteSelectedProduct(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete product',
            message: 'Are you sure you want to delete this product? This action cannot be undone!',
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

                // Delete the product on the server
                this._inventoryService.deleteProduct(this.selectedProduct.id).subscribe(() => {

                //  this.products$
                //      .pipe(take(1)) 
                //      .subscribe(products => {

                //          // filter after delete
                //          this.filterProductOptionsMethod(products);
                //      })

                    // Close the details
                    this.cancelAddProduct();
                });
            }
        });
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

    /**
     * 
     * Check if the product name is already exists
     * 
     * @param value 
     */
    async checkProductName(name: string){


       
        // Check if the entered name is identical to the original name
        if (name.trim() !== this.selectedProduct.name.trim()){

            let status = await this._inventoryService.getExistingProductName(name.trim());
            if (status === 409){
                this.addProductForm.get('step1').get('name').setErrors({productAlreadyExists: true});
            }
        }

    }

    /**
     * Return the value of product quantity
     * 
     * @param productInventories 
     * @returns 
     */
    totalInventories(productInventories: ProductInventory[] = []) {

        // if has variants
        if (productInventories.length > 1) {
            const quantity = productInventories.map(x => x.quantity)

            let total = quantity.reduce((acc, val) => acc + val)
            
            return total;
            
        } 
        else if (productInventories.length === 1) {
            return productInventories[0].quantity;
        }
        else {
            return 0;
        }

    }

    
}
