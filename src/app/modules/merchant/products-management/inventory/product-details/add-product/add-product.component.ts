import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { fromEvent, lastValueFrom, merge, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, finalize, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Product, ProductVariant, ProductVariantAvailable, ProductInventory, ProductCategory, ProductPagination, ProductPackageOption, ApiResponseModel, ProductInventoryItem, ProductAssets, ParentCategory } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { Store } from 'app/core/store/store.types';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoresService } from 'app/core/store/store.service';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { AddProductValidationService } from './add-product.validation.service';
import { MatPaginator } from '@angular/material/paginator';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDrawer, MatDrawerToggleResult } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryListComponent } from '../../product-list/inventory-list.component';
import { AddCategoryComponent } from '../../../add-category/add-category.component';
import { ToastrService } from 'ngx-toastr';


@Component({
    selector: 'app-add-product',
    templateUrl: './add-product-new.component.html',
    styles         : [
        /* language=SCSS */
        `
            :host ::ng-deep .mat-horizontal-content-container {
                padding: 0 0px 20px 0px;
            }
            :host ::ng-deep .mat-horizontal-stepper-header-container {
                height: 40px;
                padding: 0 10px;
                background-color: var(--fuse-bg-default) !important;

                @screen sm {
                    padding: 0 40px;
                }
            }
            :host ::ng-deep .mat-horizontal-stepper-header {
                height: 40px;
                padding: 0 5px;
                border-radius: 0.5rem !important;
            }
            
            :host ::ng-deep .mat-paginator .mat-paginator-container {
                padding: 0px 16px;
                justify-content: center;
            }
            :host ::ng-deep .mat-paginator-outer-container {
                display: flex;
                height: 40px;
            }
            :host ::ng-deep .ql-container .ql-editor {
                min-height: 80px;
                max-height: 80px;
                height: 80px;
            }

            /* //-----------------
            // variant section
            //----------------- */

            .variant-details-grid {
                height: 62vh;
                max-height: 468px;
            }

            .variant-grid {
                grid-template-columns: 70px 102px 272px 240px 154px 86px;

                @screen md {
                    grid-template-columns: 70px 102px auto 240px 154px 154px;
                }
            }
            .variant-grid-no-barcode {
                grid-template-columns: 70px 102px 272px 154px 86px;

                @screen md {
                    grid-template-columns: 70px 102px auto 154px 154px;
                }
            }
            
            /* //-----------------
            // combo section
            //----------------- */
            
            .add-product-list {
                height: 21vh;
                max-height: 194px;
            }

            .combo-details-grid {
                height: 60vh;
                max-height: 470px;
                /* max-height: 60vh; */
            }
            .option-grid {
                grid-template-columns: 52px 120px 76px 182px 86px;
                @screen lg {
                    grid-template-columns: 52px 120px 76px auto 86px;
                }
            }

            /** Custom input number **/
            input[type='number']::-webkit-inner-spin-button,
            input[type='number']::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }

            input[type='number'] {
                -moz-appearance:textfield;
            }

            .cdk-drag-preview {
                box-sizing: border-box;
                border-radius: 4px;
                box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                            0 8px 10px 1px rgba(0, 0, 0, 0.14),
                            0 3px 14px 2px rgba(0, 0, 0, 0.12);
            }

            .cdk-drag-placeholder {
                opacity: 0;
            }

            .cdk-drag-animating {
                transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
            }

            .list-class.cdk-drop-list-dragging .contain-class:not(.cdk-drag-placeholder) {
                transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
            }

            ::ng-deep .multiline-tooltip{
                white-space: pre;
                max-width: unset !important;
            }

            ng-scrollbar {
                /* --scrollbar-size: 8px;
                --scrollbar-thumb-color: gray; */
                --scrollbar-hover-size: 12px;
                /* --scrollbar-track-color: rgba(0, 0, 0, 0.05); */
                --scrollbar-border-radius: 3px;
            }

            /* ng-scrollbar - This is needed to dirty fix bug in library where the overflow property becomes hidden if use with scrollViewport directive*/
            ::ng-deep .ng-scroll-viewport-wrapper {
                overflow: auto !important;
            }
        `
    ],
  })
  
export class AddProductComponent2 implements OnInit, OnDestroy
{
    @ViewChild('variantsPanelOrigin') private _variantsPanelOrigin: ElementRef;
    @ViewChild('variantsPanel') private _variantsPanel: TemplateRef<any>;
    @ViewChild('variantsPanelDeleteOrigin') private _variantsPanelDeleteOrigin: ElementRef;
    @ViewChild('variantsPanelDelete') private _variantsPanelDelete: TemplateRef<any>;
    @ViewChild('productPaginationCombo', {read: MatPaginator}) private _productPaginator: MatPaginator;
    @ViewChild('imageSearchPanelOrigin') private _imageSearchPanelOrigin: ElementRef;
    @ViewChild('imageSearchPanel') private _imageSearchPanel: TemplateRef<any>;
    @ViewChild('searchImageInput') public searchImageElement: ElementRef;
    @ViewChild('newVariantAvailableInput') public _newVariantAvailableInput: ElementRef;


    // get current store
    store$: Store;

    message: string = "";

    // product
    selectedProduct: Product | null = null;
    addProductForm: FormGroup;
    products$: Observable<Product[]>;
    createdProductForm: FormGroup;
    productType: 'combo' | 'normal' | 'variant' | 'addon' = 'normal';
    newProductId: string = null; // product id after it is created
    creatingProduct: boolean; // use to disable next button until product is created
    productPagination: ProductPagination = { length: 0, page: 0, size: 0, lastPage: 0, startIndex: 0, endIndex: 0 };

    // product combo package
    _products: Product[]; // use in combo section -> 'Add product' --before filter
    filteredProductsOptions: Product[] = []; // use in listing html
    selectedProductsOptions: Product[] = [];
    selectedProductsOption: ProductPackageOption = null;
    _selectedProductsOption: ProductPackageOption = {
        id: null,
        packageId: null,
        title: null,
        totalAllow: 0,
        productPackageOptionDetail: [],
        sequenceNumber: 0,
        minAllow: 0,
        allowSameItem: false
    };
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

    arr_ProductVisibilty = [
        { title: 'Publish', desc: 'Make product visible.' },
        { title: 'Delist', desc: 'Hide product.' },
        { title: 'Out-of-Stock', desc: 'No product available.' }
    ]; 
    tooltipText_ProductVisibilty = this.arr_ProductVisibilty
    .map((x) => (x.title + " : " + x.desc))
    .join("\n");

    arr_ProductType = [
        { title: 'Normal', desc: 'Regular product.' },
        { title: 'Variant', desc: 'With options or variants.' },
        { title: 'Combo', desc: 'Comes as a combo or bundle.' },
        { title: 'Add-On', desc: 'With additional options or add-ons.' }
    ]; 
    tooltipText_ProductType = this.arr_ProductType
    .map((x) => (x.title + " : " + x.desc))
    .join("\n");

    arr_ProductPrice_stock = [
        { title: 'Product Price', desc: 'Price for the product.' },
        { title: 'Stock Details', desc: 'Update or track stock (for E-commerce).' }
    ]; 
    tooltipText_ProductPrice_stock = this.arr_ProductPrice_stock
    .map((x) => (x.title + " : " + x.desc))
    .join("\n");

    // product assets
    productImages: {
        preview: string | ArrayBuffer,
        file: File,
        isThumbnail: boolean
    }[] = [];
    // thumbnailIndex: number = 0;
    currentImageIndex: number = 0;
    // imagesEditMode: boolean = false;
    imagesChangeMode: {
        isOn: boolean,
        mode: {
            create: boolean,
            edit: boolean
        }
    } = {
        isOn: false,
        mode: {
            create: false,
            edit: false
        }
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _variantsPanelOverlayRef: OverlayRef;
    private _variantsPanelDeleteOverlayRef: OverlayRef;
    private _imageSearchPanelOverlayRef: OverlayRef;

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
    filteredProductVariants: ProductVariant[] = []; // used in html to loop variant
    productVariants: ProductVariant[] = []; // (variantComboOptions)
    variantToBeCreated: ProductVariant[] = []; // use for creating on BE 
    selectedVariantCombos: {
        image: {
            preview?: string | ArrayBuffer,
            file?: File,
            isThumbnail?: boolean,
            newAsset?: boolean,
            assetId?: string,
        },
        itemCode: string,
        price: number,
        quantity: number,
        sku: string,
        status: string,
        variant: string,
        dineInPrice: number,
        barcode: string;
    }[]
    selectedProductVariant: ProductVariant;
    // variantImagesToBeDeleted: any = []; // image to be deleted from BE
    variantIndex: number = 0; // set index when open overlay panel in variant available section

    // variant available section
    filteredProductVariantAvailable: ProductVariantAvailable[] = []; // used in html to loop variant available
    productVariantAvailable: ProductVariantAvailable[] = []; 
    variantAvailableToBeCreated: ProductVariantAvailable[] = []; // use for creating on BE 
    productVariantAvailableEditMode: boolean = false;
    productVariantAvailableValueEditMode:any = [];

    variantComboItems: {
        values: string[],
        ids: string[]
    }[] = []; // this is used for generating combinations
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    currentScreenSize: string[];
    deliveryVehicle: any;

    inputSearchProducts : string = '';
    selectedCategory:string ='';
    onChangeSelectProductValue: any = []; // for product checkbox in combo section
    totalAllowed: number = 0; //max allowed
    minAllowed: number = 0;

    //for tier category
    selectedParentCategory: string ='';
    parentCategoriesOptions: ProductCategory[];
    storeVerticalCode : string = '';

    searchImageControl: FormControl = new FormControl();
    autoCompleteList: {url: string, name: string}[] = [];
    setOrderEnabled: boolean = false;
    dropUpperLevelCalled: boolean = false;


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
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        public _drawer: MatDrawer,
        private _inventoryListComponent: InventoryListComponent,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _toastr: ToastrService

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

        setTimeout(() => {
            // Open the drawer
            this._inventoryListComponent._drawer.open();
            
        }, 0);

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
                packingSize      : ['S', [Validators.required]],
                availableStock   : [1, [Validators.required]],
                sku              : ['', [Validators.required]],
                price            : ['', [Validators.required]],
                images           : [[]],
                imagefiles       : [[]],
                thumbnailIndex   : [0],
                isVariants       : [false],
                isPackage        : [false], // combo
                isBulkItem       : [false],
                vehicleType      : [''],
                isCustomNote     : [false],
                isNoteOptional   : [true],
                customNote       : [''],
                // form completion
                valid            : [false],
                dineInPrice      : ['', [Validators.required]],
                hasAddOn         : [false],
                barcode          : ['']
            }),
            variantsSection: this._formBuilder.group({
                firstName: ['', Validators.required],
                lastName : ['', Validators.required],
                userName : ['', Validators.required],
                about    : ['']
            }),
            comboSection : this._formBuilder.group({
                optionName       : ['', [Validators.required]],
                categoryId       : [''],
            }),
            addOnSection     : this._formBuilder.array([]),
        });

        this.createdProductForm = this._formBuilder.group({});

        // get the product type
        // this.productType = this.data['productType'];
        
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
                }

                // if isDelivery true, disable dineInPrice
                if (this.store$.isDelivery === true && this.store$.isDineIn === false) {
                    this.addProductForm.get('step1').get('dineInPrice').disable(); 
                } 
                else if (this.store$.isDelivery === false && this.store$.isDineIn === true) {
                    this.addProductForm.get('step1').get('price').disable(); 
                }
                else if (this.store$.isDelivery === true && this.store$.isDineIn === true) {
                    this.addProductForm.get('step1').get('price').enable(); 
                    this.addProductForm.get('step1').get('dineInPrice').enable(); 
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });


        // get all values for parent categories with specied vertical code
        this._inventoryService.parentCategories$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((response: ParentCategory[])=>{
            
                this.parentCategoriesOptions = response;
                
        })
            
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

        
        // Get delivery vehicle type
        this._inventoryService.getDeliveryVehicleType()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((vehicles: any) => {

                // Get the vehicles except MOTORCYCLE
                this.deliveryVehicle = vehicles.filter(veh => veh.vehicleType !== 'MOTORCYCLE')
                
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
        
        // Subscribe to search control reactive form
        this.searchImageControl.valueChanges
        .pipe(
            debounceTime(500),
            takeUntil(this._unsubscribeAll)
            ).subscribe(userInput => {                
                this.autoCompleteSetList(userInput);
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
        // Dispose the overlays if they are still on the DOM
        if ( this._imageSearchPanelOverlayRef )
        {
            this._imageSearchPanelOverlayRef.dispose();
        }
        if ( this._variantsPanelDeleteOverlayRef )
        {
            this._variantsPanelDeleteOverlayRef.dispose();
        }
    }

    ngAfterViewInit(): void
    {
        // Mark for check
        this._changeDetectorRef.markForCheck();

        setTimeout(() => {

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

    generateSku(value: string){

        this.addProductForm.get('step1').get('sku').patchValue(value.trim().toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''));
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
     */
    createCategory() {

        const categoriesLimit = this.productCategories$.length;

        if (categoriesLimit >= 30) {            
            // Open the confirmation dialog
            this._fuseConfirmationService.open({
                title   : "Categories Limit",
                message : "Your category creation has reached it's limit of 30 categories!",
                icon    : {
                    show    : true,
                    name    : "heroicons_outline:ban",
                    color   : "warn" },
                actions : {
                    confirm : {
                        label: 'OK'
                    },
                    cancel  : {
                        show: false,
                        label: "Cancel"
                        }
                    }
            });
        } else {

            const dialogRef = this._dialog.open(AddCategoryComponent, { disableClose: true });
            dialogRef.afterClosed().subscribe(result => {
                
                if (result.status === true) {

                    let biggestSeq = Math.max(...this.productCategories$.map(x => x.sequenceNumber))

                    let categoryBody = {
                        name:result.value.name,
                        storeId: this.store$.id,
                        parentCategoryId: result.value.parentCategoryId,
                        thumbnailUrl: null,
                        sequenceNumber: biggestSeq > -1 ? biggestSeq + 1 : 1
                    };

                    const formData = new FormData();
                    formData.append("file", result.value.imagefiles[0]);
            
                    // Create category on the server
                    this._inventoryService.createCategory(categoryBody, formData)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: (categoryResp: ProductCategory) => {
                        },
                        error: (error) => {
                            if (error.status === 409) {
                                // Open the confirmation dialog
                                this._fuseConfirmationService.open({
                                    title  : 'Name already exist',
                                    message: 'The category name inserted is already exist, please create a new category with a different name',
                                    actions: {
                                        confirm: { label: 'OK' },
                                        cancel : { show : false }
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }  
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
    toggleImagesEditMode(isOn: boolean, type: string): void
    {
        this.imagesChangeMode.isOn = isOn;
        if (type === 'Edit') {
            // this.imagesEditMode = !this.imagesEditMode;
            this.imagesChangeMode.mode.edit = isOn;
            
        }
        else if (type === 'Add') {
            // this.imagesAddMode = !this.imagesAddMode;
            this.imagesChangeMode.mode.create = isOn;
        }
        else {
            this.imagesChangeMode.mode.edit = isOn;
            this.imagesChangeMode.mode.create = isOn;
        }
    }
     
    /**
     * Upload avatar
     *
     * @param fileList
     */
    uploadImages(fileList: FileList, images): Promise<void>
    {
        const maxImage = 10;

        // Return if canceled
        if ( !fileList.length )
        {
            return;
        }

        if ( this.productImages.length >= maxImage) {
            this._toastr.error(`Max image upload limit reached (${maxImage} images allowed).`, `Max Image Limit Reached`);

            // this._fuseConfirmationService.open({
            //     title  : `Max ${maxImage} images`,
            //     message: `Cannot be more than ${maxImage} images`,
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
            // });

            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png'];
        // Return and throw warning dialog if image file size is big
        const maxSize = 1048576;
        const maxSizeInMB = (maxSize / (1024*1024)).toFixed(2);

        for (let index = 0; index < fileList.length; index++) {
            const file = fileList[index];

            // Return and throw warning dialog if image filename is more than 100 characters
            if ( file.name.length > 100 ) {
                // console.warn(`Image ${index + 1}'s name is too long`);
                this._toastr.error(`Image filename exceeds max length of 100 characters.`, 'Image Filename Too Long');
                
                // this._fuseConfirmationService.open({
                //     title  : 'The file name is too long',
                //     message: 'The file name cannot exceed 100 characters (including spaces).',
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
                // });

                // return;
            }

            if (file.size > maxSize ) {
                // console.warn(`Image ${index + 1}'s size is too big. Max size is ${maxSizeInMB}MB`);
                this._toastr.error(`Image size exceeds max limit (${maxSizeInMB}MB).`, 'Image Size Too Large');

            }
            
            // Check if the file is an image and allowed type and length not more than 100 chars and not exceed max size
            if (file.type.match(/^image\//) && allowedTypes.includes(file.type) && file.name.length < 100 && file.size < maxSize) 
            {

                // // Create an image element to get its dimensions
                // const img = new Image();
                // img.src = URL.createObjectURL(file);

                const reader = new FileReader();
                reader.readAsDataURL(file); 
                reader.onload = (_event)  => {

                    if (!images.length === true && this.productImages.length < maxImage) {

                        this.productImages.push({preview: reader.result, file: file, isThumbnail: false})
                        this.currentImageIndex = this.productImages.length - 1;

                    } else {

                        this.productImages[this.currentImageIndex].preview = reader.result + "";
                    }

        
                    // Close edit mode
                    this.toggleImagesEditMode(false, '')
                    // this.imagesAddMode = false;
                    this._changeDetectorRef.markForCheck();

                    // // Check if the image resolution is not 500 x 500 pixels
                    // if (img.width <= 500 && img.height <= 500) {
                        
                    // }
                    // else {
                    //     console.log(`Image ${index + 1}'s resolution is too big. It should not exceed 500 x 500px`);
                    // }
                }
            }
        }        
        
    }

    /**
     * Remove the image
     */
    removeImage(index: number): void
    {
        
        // const index = this.currentImageIndex;
        if (index > -1) {
            // this.images.splice(index, 1);
            // this.imagesFile.splice(index, 1);
            this.productImages.splice(index, 1);

            // Reset current index
            // this.currentImageIndex = 0;

            // Close edit mode
            this.toggleImagesEditMode(false, '')
        }
    }

    /**
     * Cycle through images of selected product
     */
    cycleImages(forward: boolean = true): void
    {
        // Get the image count and current image index
        const count = this.productImages.length;
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

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    resetCycleImages(){
        this.currentImageIndex = 0;
        // Mark for check
        this._changeDetectorRef.markForCheck();
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
     * Create product
     */
    addNewProductMethod(): void
    {
        this.creatingProduct = true;

        // if the bulk item toggle stays close, then set to 'motorcycle'
        if (this.addProductForm.get('step1').get('isBulkItem').value === false){
            this.addProductForm.get('step1').get('vehicleType').setValue('MOTORCYCLE');
        }

        const step1FormGroup = this.addProductForm.get('step1') as FormGroup;

        const {valid, ...productBody} = step1FormGroup.getRawValue();

        const { sku, availableStock, price, images, imagefiles, thumbnailIndex, isCustomNote, dineInPrice, barcode, ...newProductBody } = productBody;
        
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
        newProductBody["name"] = newProductBody.name.trim();
        newProductBody["isCustomPrice"] = false;

        // Create the product
        this._inventoryService.createProduct(newProductBody)
            .pipe(
                finalize(() => {
                    this.creatingProduct = false;
                })
            )
            .subscribe(async (newProduct: Product) => {

                this.newProductId = newProduct.id;
                this.selectedProduct = newProduct;    

                const invBody = {
                    itemCode: newProduct.id + "aa",
                    price: price,
                    compareAtprice: 0,
                    quantity: availableStock,
                    sku: sku,
                    dineInPrice: dineInPrice,
                    barcode: barcode
                };
                
                // Add Inventory to product
                this._inventoryService.addInventoryToProduct(newProduct, invBody )
                    .subscribe((inventoryResponse: ProductInventory)=>{

                        if ( this.addProductForm.get('step1').get('isVariants').value === false ) {
                            // Post assets
                            this.postProductImages();
                        }
                        
                    });
                
                // Set filtered variants to empty array
                this.filteredProductVariants = [];

                // If Normal product
                if (this.addProductForm.get('step1').get('isVariants').value === false && this.addProductForm.get('step1').get('isPackage').value === false &&
                    this.addProductForm.get('step1').get('hasAddOn').value === false) {
                    
                    // Show a success message
                    this.showFlashMessage('success');
                    // Set delay before closing the window
                    setTimeout(() => {

                        // Go back to the list
                        this._router.navigate(['.'], {relativeTo: this._activatedRoute.parent});
            
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }, 1000);
                }

                // get product combo list
                if (this.addProductForm.get('step1').get('isPackage').value === true) {
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
                    
            // INVENTORY
            if (this.selectedVariantCombos.length > 0){
                // INVENTORY
                let inventoryBodies = this.selectedVariantCombos.map((item, i) => {
                    return {
                        itemCode: this.selectedProduct.id + i,
                        price: this.store$.isDelivery ? item.price : null,
                        compareAtPrice: 0,
                        quantity: item.quantity,
                        status: item.status,
                        SKU: item.sku,
                        productId: this.selectedProduct.id,
                        // dineInPrice null, backend will auto calculate
                        dineInPrice: this.store$.isDineIn ? item.dineInPrice : null,
                        barcode: item.barcode
                    }
                })

                await lastValueFrom(this._inventoryService.addInventoryToProductBulk(this.selectedProduct.id, inventoryBodies))
                .then((items: ProductInventory[]) => {});
            }
    
            // create new variants
            const newVariants: ProductVariant[] = await this.createVariantInBE()
            
            let variantAvailablesCreated: ProductVariantAvailable[] = [];
            // if got new variant availables, pass the variantIds from the createVariant endpoint
            if (this.variantAvailableToBeCreated.length > 0){
                variantAvailablesCreated = await this.createVariantAvailableInBE(newVariants);
            }
            else {
                await lastValueFrom(this._inventoryService.getVariantAvailable(this.selectedProduct.id)).then((response: ProductVariantAvailable[]) => {
                    variantAvailablesCreated = response;
                })
            }
            await this.addInventoryItem(variantAvailablesCreated);

            // Post assets
            this.postProductImages();

            // Show a success message
            this.showFlashMessage('success');
            // Set delay before closing the window
            setTimeout(() => {
    
                // Go back to the list
                this._router.navigate(['.'], {relativeTo: this._activatedRoute.parent});
    
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
    
                // Go back to the list
                this._router.navigate(['.'], {relativeTo: this._activatedRoute.parent});
    
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
        let newVariants: ProductVariant[] = [];

        for (const variant of this.filteredProductVariants) {

            // if variant.id is null, means it is new, so, call POST method
            if(!variant.id) {

                let variantBody = {
                    name : variant.name,
                    sequenceNumber : m
                }
                
                let response = await lastValueFrom(this._inventoryService.createVariant(variantBody, this.selectedProduct.id));

                newVariants.push(response)
            }
            m++;
        }
        return newVariants;
    }

    /**
     * Create variant availables
     * 
     * @param variantIds
     */
    async createVariantAvailableInBE(newVariants: ProductVariant[]) {

        let bodies = [];
        let variantAvailablesCreated: ProductVariantAvailable[] = [];

        // loop the newly created variants
        for (let i = 0; i < newVariants.length; i++){

            // loop the list of variant availables that need to be created to BE
            for (let j = 0; j < this.variantAvailableToBeCreated.length; j++){

                // if name is same..
                if (newVariants[i].name ===  this.variantAvailableToBeCreated[j].variantName){

                    // .. set the variant id to the new variant available
                    this.variantAvailableToBeCreated[j].productVariantId = newVariants[i].id;
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
        await lastValueFrom(this._inventoryService.createVariantAvailableBulk(bodies, this.selectedProduct.id))
            .then((response) => { 
                variantAvailablesCreated = response['data'];
            });
            return variantAvailablesCreated;
    }

    /**
     * Add inventory items to backend
     * 
     * @param productVariantAvailableIds 
     */
    async addInventoryItem(productVariantAvailable: ProductVariantAvailable[]) {

        let bodies = [];
        for (let i = 0; i < this.selectedVariantCombos.length; i++) {
            const combosSplitted = this.selectedVariantCombos[i].variant.split("/");
        
            for (let j = 0; j < combosSplitted.length; j++) {
                
                for (let m = 0; m < productVariantAvailable.length; m++){
                                    
                    if (combosSplitted[j].trim() == productVariantAvailable[m].value.trim()){
                        let body = {
                            itemCode: this.selectedProduct.id + i,
                            productId: this.selectedProduct.id,
                            productVariantAvailable: {
                                id: productVariantAvailable[m].id,
                                productId: productVariantAvailable[m].productId,
                                productVariantId: productVariantAvailable[m].productVariantId,
                                sequenceNumber: productVariantAvailable[m].sequenceNumber,
                                value: productVariantAvailable[m].value
                            },
                            productVariantAvailableId: productVariantAvailable[m].id,
                            sequenceNumber: productVariantAvailable[m].sequenceNumber,
                        }
                        bodies.push(body);
                    }
                }
            }
        }
        this._inventoryService.addInventoryItemToProductBulk(this.selectedProduct.id, this.selectedProduct.storeId, bodies)
            .subscribe((items: ProductInventoryItem[]) => {});
    }
    
    cancelAddProduct(){
        
        // Go back to the list
        this._router.navigate(['.'], {relativeTo: this._activatedRoute.parent});
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

    setThumbnail(currentImageIndex: number, isVariant: boolean = false){
        // this.thumbnailIndex = currentImageIndex;

        // set all image thumbnail to false first
        this.productImages.map(item => item.isThumbnail = false);
        if (this.selectedVariantCombos && this.selectedVariantCombos.length > 0) {
            this.selectedVariantCombos.map(item => item.image.isThumbnail = false);
        }

        // For variant
        if (isVariant) {
            this.selectedVariantCombos[currentImageIndex].image.isThumbnail = true;
        }
        else {
            this.productImages[currentImageIndex].isThumbnail = true;
        }
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
                this._newVariantAvailableInput.nativeElement.value = '';

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
                    this.filteredProductVariantAvailable = this.productVariantAvailable;
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

        // Return and throw warning dialog if image file size is big
        let maxSize = 1048576;
        var maxSizeInMB = (maxSize / (1024*1024)).toFixed(2);
        
        if (fileList[0].size > maxSize ) {
            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Image size limit',
                message: 'Your uploaded image exceeds the maximum size of ' + maxSizeInMB + ' MB!',
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

        // get the image id if any, then push into variantImagesToBeDeleted to be deleted BE
        // if (this.selectedVariantCombos[idx]?.image.assetId) {
        //     // this.variantImagesToBeDeleted.push(this.selectedVariantCombos[idx].assetId)
        // }

        // call previewImage to assign 'preview' field with image url 
        this.previewImage(file).then((data: string | ArrayBuffer) => {

            this.selectedVariantCombos[idx].image.file = file;
            this.selectedVariantCombos[idx].image.preview = data;
            this.selectedVariantCombos[idx].image.newAsset = true;

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
    removeVariantImageMethod(imageIdx: number): void
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
                    if (this.selectedVariantCombos[imageIdx]?.image.assetId) {
                        // this.variantImagesToBeDeleted.push(this.selectedVariantCombos[imageIdx].assetId)
                    }
                    // empty preview for that index to simulate 'delete'
                    this.selectedVariantCombos[imageIdx].image.preview = '';

                    // set newAsset to false
                    this.selectedVariantCombos[imageIdx].image.newAsset = false;
                                    
                }
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Open variants panel
     */
    openVariantsPanel(variant:any, idx: number): void
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
     * Open variants panel
     */
    openVariantsPanelDelete(variant:any, idx): void
    {

        this.selectedProductVariant = variant;
        
        if (this.selectedProductVariant){

            this.variantIndex = idx;
    
            // get the object of filteredVariantsTag in filteredVariants
            this.productVariantAvailable = this.filteredProductVariants[idx].productVariantsAvailable;
            this.filteredProductVariantAvailable = this.filteredProductVariants[idx].productVariantsAvailable;

        } else {
            this.filteredProductVariantAvailable = [];
        }

        // Create the overlay
        this._variantsPanelDeleteOverlayRef = this._overlay.create({
            backdropClass   : '',
            hasBackdrop     : true,
            scrollStrategy  : this._overlay.scrollStrategies.block(),
            positionStrategy: this._overlay.position()
                                .flexibleConnectedTo(this._variantsPanelDeleteOrigin.nativeElement)
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
        this._variantsPanelDeleteOverlayRef.attachments().subscribe(() => {

            // Add a class to the origin
            this._renderer2.addClass(this._variantsPanelDeleteOrigin.nativeElement, 'panel-opened');

            // Focus to the search input once the overlay has been attached
            this._variantsPanelDeleteOverlayRef.overlayElement.querySelector('input').focus();
        });

        // Create a portal from the template
        const templatePortal = new TemplatePortal(this._variantsPanelDelete, this._viewContainerRef);

        // Attach the portal to the overlay
        this._variantsPanelDeleteOverlayRef.attach(templatePortal);

        // Subscribe to the backdrop click
        this._variantsPanelDeleteOverlayRef.backdropClick().subscribe(() => {

            // Remove the class from the origin
            this._renderer2.removeClass(this._variantsPanelDeleteOrigin.nativeElement, 'panel-opened');

            // If overlay exists and attached...
            if ( this._variantsPanelDeleteOverlayRef && this._variantsPanelDeleteOverlayRef.hasAttached() )
            {

                // Detach it
                this._variantsPanelDeleteOverlayRef.detach();

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
        let nameCombo = "";
        if (n == combos.length) {
            if (nameComboOutput.substring(1) != "") {
            this.selectedVariantCombos.push({ 
                image: { preview: null, file: null, isThumbnail: false, newAsset: false, assetId: null}, 
                itemCode: itemCode, 
                variant: nameComboOutput.substring(1), 
                price: this.store$.isDelivery ? 0 : null, 
                quantity: 0, 
                // dineInPrice null, back end will auto calculate 
                dineInPrice: this.store$.isDineIn ? 0 : null,
                sku: nameComboOutput.substring(1).toLowerCase().replace(" / ", "-"), 
                status: "NOTAVAILABLE" ,
                barcode: ''
            })
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

                // if this.selectedProductsOption have value // for update
                if (this.selectedProductsOption) {
                    this._selectedProductsOption = this.selectedProductsOption;
                    this.minAllowed = this.selectedProductsOption.minAllow;
                    this.totalAllowed = this.selectedProductsOption.totalAllow;
                }

                // this is for checkbox
                this.onChangeSelectProductValue = this.selectedProductsOption.productPackageOptionDetail.map(x => x.productId);

                // this is for Total Allowed input field, to make it dirty
                this.addProductForm.get('comboSection').get('categoryId').setValue(this.onChangeSelectProductValue);
            });

    }

    deleteProductOption(optionId){
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

        // Do nothing if totalAllow null
        if (this._selectedProductsOption.totalAllow === null || this._selectedProductsOption.totalAllow == 0) return;

        this.clearOptName = true;

        // add / update _selectedProductsOption["packageId"] value 
        this._selectedProductsOption.packageId = this.selectedProduct.id;  

        // set the sequence number for this._selectedProductsOption.productPackageOptionDetail
        this._selectedProductsOption.productPackageOptionDetail.forEach((x, index) => {
            x.sequenceNumber = index + 1;
        })

        // set the sequence number for this._selectedProductsOption
        let optionDetailIndex = this.productsCombos$.findIndex(x => x.id === this._selectedProductsOption.id);
        if (optionDetailIndex > -1) {
            this._selectedProductsOption.sequenceNumber = optionDetailIndex + 1;
        }
        
        if (optionId !== ""){

            this._selectedProductsOption['minAllow'] = this._selectedProductsOption.minAllow ? this._selectedProductsOption.minAllow : 0;

            // update
            this._inventoryService.updateProductsOption(this.selectedProduct.id, this._selectedProductsOption, optionId )
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((response) => {

                    const index = this.productsCombos$.findIndex(item => item.id === optionId);
                    this.productsCombos$[index] = response;

                    this.clearOptName = false;
                    this.resetSelectedProductsOption();

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        } else {

            this._selectedProductsOption.sequenceNumber =  this.productsCombos$.length + 1;
            this._selectedProductsOption['minAllow'] = this._selectedProductsOption.minAllow ? this._selectedProductsOption.minAllow : 0;

            // add new
            this._inventoryService.createProductsOptionById(this.selectedProduct.id, this._selectedProductsOption)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((response) => {

                    // push to this.productsCombos$
                    this.productsCombos$.push(response);

                    this.clearOptName = false;
                    this.resetSelectedProductsOption();

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        }

    }


    resetSelectedProductsOption() {
        this.selectedProductsOption = null;
        // Clear checkbox
        this.onChangeSelectProductValue.length = 0;
        this.addProductForm.get('comboSection').get('categoryId').reset;
        this.totalAllowed = 0;
        this.minAllowed = 0;
        this._selectedProductsOption = {
            id: null,
            packageId: null,
            title: null,
            totalAllow: 0,
            productPackageOptionDetail: [],
            sequenceNumber: 0,
            minAllow: 0,
            allowSameItem: false
        };
        
    }

    validateProductsOptionName(value){
        
        // if this.selectedProductsOption have value // for update
        if (this.selectedProductsOption) {
            this._selectedProductsOption = this.selectedProductsOption;
        }

        this._selectedProductsOption.title = value;
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
            if (this._selectedProductsOption.productPackageOptionDetail) {

                let sequence = this._selectedProductsOption.productPackageOptionDetail.length + 1;
                // if there already a value in this._selectedProductsOption["productPackageOptionDetail"] ,
                // push a new one
                this._selectedProductsOption.productPackageOptionDetail.push({
                    productId: currentSelectedProductInOption.id,
                    product: currentSelectedProductInOption,
                    sequenceNumber: sequence
                });
            } else {
                // if this._selectedProductsOption["productPackageOptionDetail"] have no value, initiate the array first
                // then push the product id
                this._selectedProductsOption.productPackageOptionDetail = [];
                this._selectedProductsOption.productPackageOptionDetail.push({
                    productId: currentSelectedProductInOption.id,
                    product: currentSelectedProductInOption,
                    sequenceNumber: 1
                });
            }
        } else {
            // this is mostly triggered by (change)="insertProductsInOption"
            // this is triggered when creating new option, selectedProductsOption is null since it's new
            if (this._selectedProductsOption.productPackageOptionDetail) {
                // if there already a value in this._selectedProductsOption["productPackageOptionDetail"] ,
                // push a new one
                let index = this._selectedProductsOption.productPackageOptionDetail.findIndex(item => item.productId === productId);
                if (index > -1) {
                    // Delete the product from option
                    this._selectedProductsOption.productPackageOptionDetail.splice(index, 1);
                }

                // this mean this._selectedProductsOption["productPackageOptionDetail"] is empty
                if (this._selectedProductsOption.productPackageOptionDetail.length < 1) {
                }
            }
        }

        this.onChangeSelectProductValue = this._selectedProductsOption.productPackageOptionDetail.map(x => x.productId);
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

    validateProductsOptionTotalAllowed(value, type: string) {
        // if this.selectedProductsOption have value // for update
        if (this.selectedProductsOption) {
            this._selectedProductsOption = this.selectedProductsOption;
        }

        if (type === 'min') {
            this._selectedProductsOption.minAllow = value;
            this.minAllowed = value;
        }
        else if (type === 'max') {
            this._selectedProductsOption.totalAllow = value;
            this.totalAllowed = value;
        }
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
     * Check if the product name already exists
     * 
     * @param value 
     */
    async checkProductName(name: string){

        let status = await this._inventoryService.getExistingProductName(name.trim());
        if (status === 409){
            this.addProductForm.get('step1').get('name').setErrors({productAlreadyExists: true});
        }
    }

    variantSkuChanged(event, i) {
        this.selectedVariantCombos[i].sku = event.target.value;
    
    }

    variantStockChanged(event, i) {
        this.selectedVariantCombos[i].quantity = event.target.value;
    
    }

    variantPriceChanged(type: 'deliverin' | 'dinein', event, i) {
        if (type === 'deliverin') {
            this.selectedVariantCombos[i].price = event.target.value;   
    
        }
        else if (type ='dinein') {
            this.selectedVariantCombos[i].dineInPrice = event.target.value;   
        }
    }

    variantBarcodeChanged(event, i) {
        this.selectedVariantCombos[i].barcode = event.target.value;
    
    }

    changeProductStatus(value: string) {

        this.addProductForm.get('step1').get('status').patchValue(value);

        if (value === 'OUTOFSTOCK') {
            this.addProductForm.get('step1').get('availableStock').patchValue(0);

            if (this.store$.verticalCode === 'FnB' || this.store$.verticalCode === 'FnB_PK') {
                this.addProductForm.get('step1').get('allowOutOfStockPurchases').patchValue(false);
            }
        }
        else if (value === 'ACTIVE' && (this.store$.verticalCode === 'FnB' || this.store$.verticalCode === 'FnB_PK')) {
            this.addProductForm.get('step1').get('allowOutOfStockPurchases').patchValue(true);
        }
    }

    /**
     * Open search image panel
     */
    openSearchImagePanel(): void
    {
        // Create the overlay
        this._imageSearchPanelOverlayRef = this._overlay.create({
            backdropClass   : '',
            hasBackdrop     : true,
            scrollStrategy  : this._overlay.scrollStrategies.block(),
            positionStrategy: this._overlay.position()
                                .flexibleConnectedTo(this._imageSearchPanelOrigin.nativeElement)
                                .withFlexibleDimensions(true)
                                .withViewportMargin(64)
                                .withLockedPosition(true)
                                .withPositions([
                                    {
                                        originX : 'start',
                                        originY : 'bottom',
                                        overlayX: this.currentScreenSize.includes('sm') ? 'start' : 'end',
                                        overlayY: 'top',
                                        // offsetY : 32,
                                        // offsetX : this.currentScreenSize.includes('sm') ? -81 : 64
                                    }
                                ])
        });

        // Subscribe to the attachments observable
        this._imageSearchPanelOverlayRef.attachments().subscribe(() => {

            // Add a class to the origin
            this._renderer2.addClass(this._imageSearchPanelOrigin.nativeElement, 'panel-opened');

            // Focus to the search input once the overlay has been attached
            this._imageSearchPanelOverlayRef.overlayElement.querySelector('input').focus();
        });

        // Create a portal from the template
        const templatePortal = new TemplatePortal(this._imageSearchPanel, this._viewContainerRef);

        // Attach the portal to the overlay
        this._imageSearchPanelOverlayRef.attach(templatePortal);

        // Subscribe to the backdrop click
        this._imageSearchPanelOverlayRef.backdropClick().subscribe(() => {

            // Remove the class from the origin
            this._renderer2.removeClass(this._imageSearchPanelOrigin.nativeElement, 'panel-opened');

            // If overlay exists and attached...
            if ( this._imageSearchPanelOverlayRef && this._imageSearchPanelOverlayRef.hasAttached() )
            {
                // Detach it
                this._imageSearchPanelOverlayRef.detach();
            }
            // If template portal exists and attached...
            if ( templatePortal && templatePortal.isAttached )
            {
                // Detach it
                templatePortal.detach();
            }
            this.searchImageControl.patchValue('');
        });
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    selectImage(value: {name: string, url: string}) {

        // this.productImages[this.currentImageIndex].preview = value.url;
        this.productImages.push({preview: value.url, file: null, isThumbnail: false})

        this.currentImageIndex = this.productImages.length - 1;

        // Close edit mode
        this.toggleImagesEditMode(false, '')
        
        //----------------------------
        // To simulate backdrop click
        //----------------------------
        // Create a portal from the template
        const templatePortal = new TemplatePortal(this._imageSearchPanel, this._viewContainerRef);

        // Remove the class from the origin
        this._renderer2.removeClass(this._imageSearchPanelOrigin.nativeElement, 'panel-opened');

        // If overlay exists and attached...
        if ( this._imageSearchPanelOverlayRef && this._imageSearchPanelOverlayRef.hasAttached() )
        {
            // Detach it
            this._imageSearchPanelOverlayRef.detach();
        }

        // If template portal exists and attached...
        if ( templatePortal && templatePortal.isAttached )
        {
            // Detach it
            templatePortal.detach();
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
        
    }
    /**
     * Set the filtered value to an array to be displayed
     * 
     * @param input 
     */
    autoCompleteSetList(input: string) {
        if (input && input !== '') {
            this._inventoryService.searchProduct(input)
                .subscribe((products: Product[]) => {
                    
                    this.autoCompleteList = products.map(product => {
                        return {
                            url: product.thumbnailUrl,
                            name: product.name
                        }
                    });
                })
        }
        else {
            this.autoCompleteList = [];
        }
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    blurInput() {
        // Remove focus
        setTimeout(() => this.searchImageElement.nativeElement.blur());

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    postProductImages(){

        let variantImagesArr = []

        if (this.selectedVariantCombos) {
            variantImagesArr = this.selectedVariantCombos.map((item, i) => {
                return {
                    file: item.image.file,
                    isThumbnail: item.image.isThumbnail,
                    preview: null,
                    itemCode: this.selectedProduct.id + i
                }
            });
        }

        let normalImagesArr = [];

        // If one of the variant images is thumbnail, set all normal images thumbnail to false
        if (variantImagesArr.some(item => item.isThumbnail === true)) {
            normalImagesArr = this.productImages.map(item => ({ ...item, isThumbnail: false}))
        }
        else {
            normalImagesArr = this.productImages;
        }

        // Filter out elements with file
        let mergedImages = [...normalImagesArr, ...variantImagesArr].filter(item => ((item.file !== null) || (item.preview !== null)))
        
        if (mergedImages.length > 0) {
            for (let index = 0; index < mergedImages.length; index++) {
                const element = mergedImages[index];

                // create a new one
                let formData = new FormData();
                
                if (element.file) {
                    formData.append('file', element.file);
                }
                else formData = null;

                this._inventoryService.addProductAssets( this.selectedProduct.id, formData, { isThumbnail: element.isThumbnail, itemCode: element.itemCode }, null, 
                    (element.file === null && element.preview !== null) ? element.preview : null)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((assetResponse: ProductAssets)=> {
                        if (assetResponse.isThumbnail){
                            this.selectedProduct.thumbnailUrl = assetResponse.url;
                        }

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });
            }
        }
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
                // Delete the product on the server
                this._inventoryService.deleteProduct(this.selectedProduct.id).subscribe(() => {
                    this.newProductId = null;
                });

                // Reset variant related values
                this.selectedVariantCombos = []; 
                this.variantComboItems = [];
                this.productVariants = [];
                this.filteredProductVariants = [];
                this.variantToBeCreated = [];

            } else {
                // Update the selected product form
                this.addProductForm.get('step1').get('isVariants').patchValue(true);
                this.addProductForm.get('step1').get('isPackage').patchValue(false);
                this.addProductForm.get('step1').get('hasAddOn').patchValue(false);
                this.productType = 'variant';
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
        
    }

    drop(event: CdkDragDrop<string[]>, index: any) {
        
        moveItemInArray(this.productsCombos$[index].productPackageOptionDetail, event.previousIndex, event.currentIndex);
        
        // Mark for check
        this._changeDetectorRef.markForCheck();

    }
    dropUpperLevel(event: CdkDragDrop<string[]>, index: any) {
        
        moveItemInArray(this.productsCombos$, event.previousIndex, event.currentIndex);
        this.dropUpperLevelCalled = true;
        
        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    reorderList(toggleValue: boolean) {
        if (toggleValue === false && this.dropUpperLevelCalled === true) {
            
            // Update the sequence number
            this.productsCombos$.forEach((combo, index) => {
                this._inventoryService.updateProductsOption(this.selectedProduct.id, {sequenceNumber: index + 1}, combo.id )
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((response) => {
    
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });
                this.dropUpperLevelCalled = false;
                this.setOrderEnabled = false;
            })
        }
    }

    /**
     * Close the drawer
     */
    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this._inventoryListComponent._drawer.close();
    }

    changeProductType(value: string) {

        if (value === 'variant') {
            this.addProductForm.get('step1').get('isVariants').patchValue(true);

            this.addProductForm.get('step1').get('isPackage').patchValue(false);
            this.addProductForm.get('step1').get('hasAddOn').patchValue(false);
        }
        else if (value === 'combo') {
            this.addProductForm.get('step1').get('isPackage').patchValue(true);

            this.addProductForm.get('step1').get('isVariants').patchValue(false);
            this.addProductForm.get('step1').get('hasAddOn').patchValue(false);
        }
        else if (value === 'addon') {
            this.addProductForm.get('step1').get('hasAddOn').patchValue(true);

            this.addProductForm.get('step1').get('isVariants').patchValue(false);
            this.addProductForm.get('step1').get('isPackage').patchValue(false);
        }
        else {
            this.addProductForm.get('step1').get('isVariants').patchValue(false);
            this.addProductForm.get('step1').get('isPackage').patchValue(false);
            this.addProductForm.get('step1').get('hasAddOn').patchValue(false);
        }
    }

    getDataFromAddOnComponent(value) {
        // Get data for update button enable/disable state
        this.setOrderEnabled = value;
    }

    toggleAllowSameItem(toggleValue: boolean) {
        this._selectedProductsOption['allowSameItem'] = toggleValue;
    }

}
