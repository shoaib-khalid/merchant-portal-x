import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, FormArray} from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { merge, Observable, of, Subject } from 'rxjs';
import { debounceTime, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Product, ProductVariant, ProductVariantAvailable, ProductInventory, ProductCategory, ProductPagination, ProductPackageOption, ProductAssets } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { MatDialog } from '@angular/material/dialog';
import { AddProductComponent } from '../add-product/add-product.component';
import {v4 as uuidv4} from 'uuid';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { EditProductComponent } from '../edit-product/edit-product.component';


@Component({
    selector       : 'inventory',
    templateUrl    : './inventory.component.html',
    styles         : [
        /* language=SCSS */
        `
            .inventory-grid {
                grid-template-columns: 48px auto 40px;

                @screen sm {
                    grid-template-columns: 48px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 48px 128px auto 112px 72px;
                }

                @screen lg {
                    grid-template-columns: 48px 128px auto 112px 96px 96px 72px;
                }
            }

            .inventory-grid-fnb {
                grid-template-columns: 48px auto 40px;

                @screen sm {
                    grid-template-columns: 48px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 48px 128px auto 112px 72px;
                }

                @screen lg {
                    grid-template-columns: 48px 128px auto 112px 96px 72px;
                }
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

                // @screen md {
                //     grid-template-columns: 68px auto auto 128px 84px 96px;
                // }

                // @screen lg {
                //     grid-template-columns: 68px auto 128px 128px 84px 96px;
                // }
            }
            /* to remove visible container when window dialog is opened  */
            // .mat-dialog-container {
            // padding: 0 !important;
            // }
            

        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class InventoryComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('variantsPanel') private _variantsPanel: TemplateRef<any>;
    @ViewChild('variantsPanelOrigin') private _variantsPanelOrigin: ElementRef;

    // get current store
    store$: Store;

    // product
    products$: Observable<Product[]>;
    selectedProduct: Product | null = null;
    selectedProductForm: FormGroup;

    pagination: ProductPagination;
    
    // product combo
    productsCombos$: ProductPackageOption[] = [];
    showCombosValueEditMode:any = [];
    showCombosSection: boolean = false;
    
    // product combo package
    _products: Product[]; // use in combo section -> 'Add product' --before filter
    filteredProductsOptions: Product[] = []; // use in listing html
    selectedProductsOptions: Product[] = [];
    selectedProductsOption: ProductPackageOption = null;
    _selectedProductsOption = {};
    optionChecked = [];
    _filteredProductsOptions: Product[] = []; // use in combo section -> 'Add product' --after filter


    // -----------------------
    // product variant
    // -----------------------

    productVariants: FormArray;
    productVariants$: ProductVariant[] = [];
    filteredProductVariants: any[] = []; // used in html to loop variant
    selectedProductVariants: ProductVariant;

    productVariantsEditMode: boolean = false;
    productVariantsValueEditMode:any = [];
    showVariantsSection: boolean = false;

    variantComboItems: any = []; // this is used for generating combinations
    variantComboOptions: any = []; //
    variantToBeCreated: any[] = []; // use for creating on BE 
    variantToBeDeleted: any[] = []; // use for deleting on BE 



    // product variant available
    productVariantAvailable: FormArray;
    productVariantAvailable$: ProductVariantAvailable[] = []; // used in html

    variantAvailableToBeCreated: any = []; // use for creating on BE 
    variantAvailableToBeDeleted: any = []; // use for deleting on BE 

    filteredProductVariantAvailable: any[] = [];
    selectedProductVariantAvailable: ProductVariantAvailable[] = [];
    
    productVariantAvailableEditMode: boolean = false;
    productVariantAvailableValueEditMode:any = [];

    // -----------------------
    // product inventory
    // -----------------------

    productInventories: FormArray;
    productInventories$: ProductInventory[] = [];
    filteredProductInventories: ProductInventory[] = [];
    selectedProductInventories: ProductInventory;

    indexOfProductInventories : number = 0;

    // product category
    productCategories$: ProductCategory[];
    filteredProductCategories: ProductCategory[];
    selectedProductCategory: ProductCategory;
    
    productCategoriesEditMode: boolean = false;
    productCategoriesValueEditMode:any = [];

    categoryFilterControl: FormControl = new FormControl();
    filterByCatId: string = "";

    localCategoryFilterControl: FormControl = new FormControl();
    localFilterByCatId: string = "";

    // ------------------
    // product assets
    // ------------------

    productAssets: FormArray;
    productAssets$: ProductAssets[] = [];

    // image
    images: any = [];
    imagesFile: any = [];
    currentImageIndex: number = 0;
    thumbnailIndex: number = 0;
    imagesEditMode: boolean = false;
    variantimagesEditMode: any = [];

    // variant image
    variantimages: any = [];
    variantimagesFile: any = [];
    currentVariantImageIndex: number = 0;
    variantImagesToBeDeleted: any = [];


    displayProductVariantAssets:any = [];

    selectedVariantCombos: any = []; // this is the list of combinations generated

    // sku, price & quantity 
    // reason these 3 not in formbuilder is because it's not part of product but 
    // it's part of product inventory (it's here for display only)
    displaySku: string = "";
    displayPrice: number = 0;
    displayQuantity: number = 0;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: FormControl = new FormControl();

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
    variantIndex: number = 0;
    
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
        private _overlay: Overlay,
        private _renderer2: Renderer2,
        private _viewContainerRef: ViewContainerRef,
        public _dialog: MatDialog,
        private _fuseMediaWatcherService: FuseMediaWatcherService,

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
        this.selectedProductForm = this._formBuilder.group({
            // id               : [''],
            name             : ['', [Validators.required]],
            description      : ['', [Validators.required]],
            // storeId          : [''], // not used
            categoryId       : ['', [Validators.required]],
            status           : ['', [Validators.required]],
            // thumbnailUrl     : [''],
            // vendor           : [''], // not used
            // region           : [''], // not used
            seoUrl           : [''],
            // seoName          : [''], // not used
            trackQuantity    : [false],
            allowOutOfStockPurchases: [false], 
            minQuantityForAlarm: [-1],
            packingSize      : ['', [Validators.required]],
            // created          : [''],
            // updated          : [''],

            productVariants  : this._formBuilder.array([]),

            // productVariants  : this._formBuilder.array([{
            //     id                      : [''],
            //     name                    : [''],
            //     productVariantsAvailable: this._formBuilder.array([{
            //         id                      : [''],
            //         value                   : [''],
            //         productId               : [''],
            //         productVariantId        : [''],
            //         sequenceNumber          : [0],
            //     }]),
            //     sequenceNumber          : [0],
            // }]),

            // productInventories : this._formBuilder.array([
            //    this._formBuilder.group({
            //         itemCode                : [''],
            //         price                   : [0],
            //         quantity                : [''],
            //         productId               : [''],
            //         sku                     : [''],
            //         status           : ['AVAILABLE'],
            //     })
            // ]),

            productInventories: this._formBuilder.array([]),

            productReviews        : [''], // not used

            productAssets: this._formBuilder.array([]),
            // productAssets         : this._formBuilder.array([{
            //     id                  : [''],
            //     itemCode            : [''],
            //     name                : [''],
            //     url                 : [''],
            //     productId           : [''],
            //     isThumbnail         : [false],
            // }]),
            productDeliveryDetail : [''], // not used


            // OLD HERE -----------------------------------

            // currentImageIndex: [0],
            // images           : [[]],
            // sku              : [''],
            // price            : [0],
            // quantity         : [0],
            isVariants       : [false],
            isPackage        : [false],
            // productPackage   : {
            //     id          : [''],
            //     packageId   : [''],
            //     title       : [''],
            //     totalAllow  : [0],
            //     productPackageOptionDetail  : this._formBuilder.array([{
            //         id                      : [''],
            //         productPackageOptionId  : [''],
            //         productId               : [''],
            //     }])
            // }
        });

        // Get the stores
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {

                // Update the pagination
                this.store$ = store;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
            
    
        // Get the products
        this.products$ = this._inventoryService.products$;
        
        // Get all products for combo section
        this._inventoryService.getAllProducts()
            .pipe(takeUntil(this._unsubscribeAll))    
            .subscribe((response)=>{

                this._products = response["data"].content
                
                // filter the product
                this.filterProductOptionsMethod(this._products);

            });
        
        // Get the pagination
        this._inventoryService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: ProductPagination) => {

                // Update the pagination
                this.pagination = pagination;

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


        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._inventoryService.getProducts(0, 10, 'name', 'asc', query, 'ACTIVE,INACTIVE' , this.filterByCatId);
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

        // Filter by category dropdown in product list
        this.categoryFilterControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((catId) => {

                    this.closeDetails();
                    this.filterByCatId = catId
                    this.isLoading = true;
                    
                    return this._inventoryService.getProducts(0, 10, 'name', 'asc', '', 'ACTIVE,INACTIVE', this.filterByCatId);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

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

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        setTimeout(() => {
            if ( this._sort && this._paginator )
            {
                // Set the initial sort
                this._sort.sort({
                    id          : 'name',
                    start       : 'asc',
                    disableClear: true
                });

                // Mark for check
                this._changeDetectorRef.markForCheck();

                // If the user changes the sort order...
                this._sort.sortChange
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe(() => {
                        // Reset back to the first page
                        this._paginator.pageIndex = 0;

                        // Close the details
                        this.closeDetails();
                    });

                // Get products if sort or page changes
                merge(this._sort.sortChange, this._paginator.page).pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._inventoryService.getProducts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '', 'ACTIVE,INACTIVE', this.filterByCatId);
                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                ).subscribe();
            }
        }, 0);
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

    /**
     * Toggle product details
     *
     * @param productId
     */
    toggleDetails(productId: string): void
    {


        // If the product is already selected...
        if ( this.selectedProduct && this.selectedProduct.id === productId )
        {
            // Close the details
            this.closeDetails();
            return;
        }

        //set the details
        // this.closeDetails();

        // set showVariantsSection , showCombosSection to false
        this.showVariantsSection = false;
        this.showCombosSection = false;


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
                            this.displayPrice = response.price;
                            this.displayQuantity = response.quantity;
                            this.displaySku = response.sku;

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
        this.selectedProductForm.patchValue(product);

        // Fill the form for SKU , Price & Quantity productInventories[0]
        // this because SKU , Price & Quantity migh have variants
        // this is only for display, so we display the productInventories[0] 
        this.displaySku = product.productInventories[0].sku;
        this.displayPrice = product.productInventories[0].price;
        this.displayQuantity = product.productInventories[0].quantity;

        // ---------------------
        // IsVariant Toogle 
        // ---------------------

        // set isVariants = true is productInventories.length > 0
        product.productVariants.length > 0 ? this.selectedProductForm.get('isVariants').patchValue(true) : this.selectedProductForm.get('isVariants').patchValue(false);

        // ---------------------
        // Images
        // ---------------------

        // Sort productAssets and place itemCode null in front, after that variants image
        let imagesObjSorted = product.productAssets.sort(this.dynamicSort("itemCode"));
        let imageArr = imagesObjSorted.map(item => item.url);

        this.images = imageArr;

        // get thumbnail index
        let _thumbnailIndex = null;

        // if has variants
        if (this.selectedProductForm.get('isVariants').value === true){

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

        this.productAssets = this.selectedProductForm.get('productAssets') as FormArray;
        // this.productAssets.clear();


        this.imagesFile = [];

        this.productAssets$.forEach(item => {
            this.productAssets.push(this._formBuilder.group(item));
            this.imagesFile.push(null) // push imagesFile with null to defined now many array in imagesFile
        });

        // ---------------------
        // Product Inventories
        // ---------------------
            
        this.productInventories$ = product.productInventories;

        this.productInventories = this.selectedProductForm.get('productInventories') as FormArray;
        // this.productInventories.clear();

        this.productInventories$.forEach(item => {
            this.productInventories.push(this._formBuilder.group(item));
        });

        // ---------------------
        // Variants
        // ---------------------

        // Set to this productVariants 
        this.productVariants$ = product.productVariants;

        this.productVariants = this.selectedProductForm.get('productVariants') as FormArray;
        // this.productVariants.clear();

        this.productVariants$.forEach(item => {
            let _item = this._formBuilder.group({
                id: item.id,
                name: item.name,
                productVariantsAvailable: [item.productVariantsAvailable] // idk why, but this is the only workable way to archive array in this._formBuilder.group
            });

            this.productVariants.push(_item);
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
        this.selectedProductForm.get('categoryId').patchValue(this.selectedProduct.categoryId);

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
        this.selectedProductForm.get('minQuantityForAlarm').patchValue(this.selectedProduct.minQuantityForAlarm);

        // Update the selected product form
        this.selectedProductForm.get('minQuantityForAlarm').patchValue(this.selectedProduct.minQuantityForAlarm);

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
    
    /**
     * this create product check category first before creating them
     */
    
    initCreateProduct(productType: string){
        
        const dialogRef = this._dialog.open(AddProductComponent, { disableClose: true, data: { productType: productType } });
        dialogRef.afterClosed().subscribe(result => {

            if (result.valid === false) {
                return;
            }

            const {valid, ...productBody} = result;

            this.createProduct(result.categoryId, productType, productBody);
        });
    }

    editProduct(productId: string){
        
        const dialogRef = this._dialog.open(EditProductComponent, { disableClose: true, data: { productId: productId } });
        dialogRef.afterClosed().subscribe(result => {

            if (result.valid === false) {
                return;
            }

        });
    }

    /**
     * Create product
     */
    createProduct(categoryId: string, productType: string, productBody): void
    {

        const { sku, availableStock, price, images, imagefiles, thumbnailIndex, ...newProductBody } = productBody;

        // Get store domain
        let storeFrontURL = 'https://' + this.store$.domain;

        newProductBody["categoryId"] = categoryId;
        newProductBody["seoName"] = newProductBody.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        newProductBody["seoUrl"] = storeFrontURL + "/product/" + newProductBody.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        newProductBody["storeId"] = this.store$.id;
        newProductBody["minQuantityForAlarm"] = newProductBody.minQuantityForAlarm === false ? -1 : newProductBody.minQuantityForAlarm;
        newProductBody["packingSize"] = newProductBody.packagingSize ? newProductBody.packagingSize : "S";
        newProductBody["isPackage"] = (productType === "combo") ? true : false;
        newProductBody["allowOutOfStockPurchases"] = ((this.store$.verticalCode === "FnB" || this.store$.verticalCode === "FnB_PK") && (newProductBody.status !== "OUTOFSTOCK")) ? true : false;

        // Create the product
        this._inventoryService.createProduct(newProductBody)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(async (newProduct) => {

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
                        this.displayPrice = response.price;
                        this.displayQuantity = response.quantity;
                        this.displaySku = response.sku;

                        // if type is combo..
                        if (productType === "combo"){

                            // open the details window..
                            this.toggleDetails(newProduct["data"].id);

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
                this.selectedProductForm.patchValue(newProduct["data"]);

                // Set image & isVariants to false ...
                this.selectedProductForm.get('isVariants').patchValue(false);
                
                // // Set filtered variants to empty array
                this.filteredProductVariants = [];
                
                // // Set variants to empty array
                // this.variants = [];

                // // Set selectedProduct variants to empty array
                // this.selectedProduct.variants = [];



                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }
 
    /**
     * Update the selected product using the form data
     */
    async updateSelectedProduct(): Promise<void>
    {
        // Get store domain
        let storeFrontURL = 'https://' + this.store$.domain;
        
        // Get the product object
        const { sku, price, quantity, ...product} = this.selectedProductForm.getRawValue();
        
        product.seoName = product.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        product.seoUrl = storeFrontURL + '/product/' + product.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');

        // Get the product object for updating the product
        const { productAssets, productInventories, productReviews, productVariants, ...productToUpdate} = product;
        
        // Update the product on the server
        await this._inventoryService.updateProduct(this.selectedProduct.id, productToUpdate)
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(async () => {

            this.products$
            .pipe(take(1)) 
            .subscribe(products => {

                // filter after update
                this.filterProductOptionsMethod(products);
            })

            // DELETE ENTIRE INVENTORY
            await this.deleteEntireInventory()

            // if got variants
            if (this.selectedProductForm.get('isVariants').value === true) {
                
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
                    // productId: this.selectedProduct.id,
                    itemCode: this.selectedProduct.id + "aa",
                    price: this.displayPrice,
                    compareAtprice: 0,
                    quantity: this.displayQuantity,
                    sku: this.displaySku,
                    status: "AVAILABLE"
                } 
                
                await this._inventoryService.addInventoryToProduct(this.selectedProduct, _productInventories).toPromise().then(() => {
                    // Show a success message
                    // this.showFlashMessage('success');
                });
    
    
                
                // If got product assets
                if (product.productAssets) {
                    let expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
                    let regex = new RegExp(expression);
                    let iteration = 0;// this iteration used by new product added to existing old product (not update tau)
                    this.selectedProductForm.get('productAssets').value.forEach((item, i) => {
                        let assetIndex = product.productAssets.findIndex(element => element.id === item.id)                        
                        
                        let _thumbnailIndex = product.productAssets.findIndex(element => element.isThumbnail === true)
                        if (assetIndex > -1) {
                            if (!item.url.match(regex)) { // if url is not valid, it mean the data is new data
        
                                // -----------------
                                // delete old one
                                // -----------------
        
                                this._inventoryService.deleteProductAssets(this.selectedProduct.id, item.id)
                                .pipe(takeUntil(this._unsubscribeAll))
                                .subscribe((deleteResponse)=>{
        
                                    // -----------------
                                    // create a new one
                                    // ----------------
        
                                    let formData = new FormData();
                                    formData.append('file',this.imagesFile[i]);
                                    this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === this.thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false }, i)
                                        .pipe(takeUntil(this._unsubscribeAll))
                                        .subscribe((addResponse)=>{
        
                                            // update the deleted product assets
                                            let _updatedProduct = product.productAssets;
                                            _updatedProduct[assetIndex] = addResponse;
        
                                            // patch the value
                                            this.selectedProductForm.get('productAssets').patchValue(_updatedProduct);
        
                                            // Mark for check
                                            this._changeDetectorRef.markForCheck();
                                        });
        
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                });
        
        
                            } else if (i === this.thumbnailIndex) { // this mean thumbnail index change, diffent from backend
                                // update the image (only thumbnail)
                                let updateItemIndex = item;
                                updateItemIndex.isThumbnail = true;
        
                                this._inventoryService.updateProductAssets(this.selectedProduct.id, updateItemIndex, item.id)
                                    .pipe(takeUntil(this._unsubscribeAll))
                                    .subscribe((response)=>{
                                        // Mark for check
                                        this._changeDetectorRef.markForCheck();
                                    });
                            } else {
                                
                            }
                        } else {
        
                            // -----------------
                            // create a new one
                            // ----------------
        
                            iteration = iteration + 1;
        
                            let formData = new FormData();
                            formData.append('file',this.imagesFile[i]);
        
                            this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === this.thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false }, i)
                                .pipe(takeUntil(this._unsubscribeAll))
                                .subscribe((addResponse)=>{
        
                                    // update the deleted product assets
                                    // let _updatedProduct = this.selectedProductForm.get('productAssets').value;
                                    // _updatedProduct[i + iteration -1] = addResponse;
        
                                    // if (this.selectedProductForm.get('productAssets').value.length > 0 ){
                                    //     // patch the value if have existing value 
                                        this.selectedProductForm.get('productAssets').value[i] = addResponse;
                                    // } else {
                                        // patch the value if empty 
                                        // this.selectedProductForm.get('productAssets').patchValue(_updatedProduct);
                                    // }
        
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                });
                        }
                    })
                } else {
                    for (let i = 0; i < this.imagesFile.length; i++) {
                        // create a new one
                        let formData = new FormData();
                        formData.append('file',this.imagesFile[i]);
                        this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === this.thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false })
                            .pipe(takeUntil(this._unsubscribeAll))
                            .subscribe((response)=>{

                                this.selectedProductForm.get('productAssets').value[i] = response;
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            });
                    }
                }
            }
            // Show a success message
            this.showFlashMessage('success');

            // Set delay before closing the details window
            setTimeout(() => {

                // close the details window
                this.toggleDetails(this.selectedProduct.id)
    
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }, 2000);

        });


        // DELETE VARIANT IMAGES
        for (let i = 0; i < this.variantImagesToBeDeleted.length; i++) {
            await this._inventoryService.deleteProductAssets(this.selectedProduct.id, this.variantImagesToBeDeleted[i]).toPromise().then(data => {
                this._changeDetectorRef.markForCheck();
            });
        }

        // set the array to null
        this.variantImagesToBeDeleted = [];


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
            else if (i === this.thumbnailIndex && this.selectedVariantCombos[i].newAsset == false) {
                await this._inventoryService.updateProductAssets(this.selectedProduct.id, { isThumbnail: true , itemCode: this.selectedProduct.id + i }, this.selectedVariantCombos[i].assetId)
                .toPromise().then(data => {
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
            }
          }



        //old
        // if (this.selectedProduct.productInventories.length === 1) {
        //     // Update the inventory product on the server (backend kena enable update)
        //     let _productInventories = {
        //         productId: this.selectedProduct.id,
        //         itemCode: this.selectedProduct.productInventories[0].itemCode,
        //         price: this.displayPrice,
        //         compareAtprice: 0,
        //         quantity: this.displayQuantity,
        //         sku: this.displaySku,
        //         status: "AVAILABLE"
        //     } 
        //     this._inventoryService.updateInventoryToProduct(this.selectedProduct.id, this.selectedProduct.productInventories[0].itemCode, _productInventories).subscribe(() => {
        //         // Show a success message
        //         this.showFlashMessage('success');
        //     });
        // }

        // Update the assets product on the server (backend kena enable update)
        
        
        // this._inventoryService.updateInventoryToProduct(product.id, productInventories).subscribe(() => {
        //     // Show a success message
        //     this.showFlashMessage('success');
        // });
        
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
     * Delete the variant images
     */
    // async deleteVariantImages() {
    //     for (var i = 0; i < this.variantImagesToBeDeleted.length; i++) {
    //       await this._inventoryService.deleteProductAssets(this.selectedProduct.id, this.variantImagesToBeDeleted[i]);
    //     }
    //     this.variantImagesToBeDeleted = [];
    //   }
 
    /**
     * Delete the selected product using the form data
     */
    deleteSelectedProduct(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete product',
            message: 'Are you sure you want to remove this product? This action cannot be undone!',
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

                // Get the product object
                const product = this.selectedProductForm.getRawValue();

                // Delete the product on the server
                this._inventoryService.deleteProduct(this.selectedProduct.id).subscribe(() => {

                    this.products$
                        .pipe(take(1)) 
                        .subscribe(products => {

                            // filter after delete
                            this.filterProductOptionsMethod(products);
                        })

                    // Close the details
                    this.closeDetails();
                });
            }
        });
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

    generateSku(){
        if (this.selectedProduct.productVariants){

        }
    }

    /**
     * Close the details
     */
    closeDetails(): void
    {
        this.selectedProduct = null;
        (this.selectedProductForm.get('productInventories') as FormArray).clear();
        (this.selectedProductForm.get('productVariants') as FormArray).clear();
        (this.selectedProductForm.get('productAssets') as FormArray).clear();


    }

    // --------------------------------------
    // Product Option/Combo/Package Section
    // --------------------------------------

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
        this.selectedProductForm.get('categoryId').patchValue(this.selectedProduct.categoryId);

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

    validateProductsOptionTotalAllowed(value){
        // if this.selectedProductsOption have value // for update
        if (this.selectedProductsOption) {
            this._selectedProductsOption = this.selectedProductsOption;
        }
        
        this._selectedProductsOption["totalAllow"] = value;
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

    // displayCombos(){
    //     this.showCombosSection = !this.showCombosSection;
    // }

    // --------------------------------------
    // Product Variant Section
    // --------------------------------------

    generateVariantCombo(){

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

        //old
        // this.getallCombinations(variantItems)

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

    /**
     * Delete entire inventory
     * 
     * @returns promise
     */
    async deleteEntireInventory() {
        var promise = new Promise(async (resolve, reject) => {
          for (var j = 0; j < this.productInventories$.length; j++) {
            await this._inventoryService.deleteInventoryToProduct(this.selectedProduct.id, this.productInventories$[j].itemCode).toPromise();
          }
          this.productInventories$ = [];
          resolve("done")
        });
        return promise;
    }


    async joinVariantAvailables(variantAvailables) {

        const data: any = await this._inventoryService.getVariantAvailable(this.selectedProduct.id);
        
        for (var i = 0; i < data.length; i++) {
        variantAvailables.push({ productVariantAvailableId: data[i].id, value: data[i].value })
        }
        return variantAvailables;
    
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

    async getVariantAvailableByValue(value, productAvailableIds) {
        let optionsId;
        for (var i = 0; i < productAvailableIds.length; i++) {
            if (productAvailableIds[i].value == value.trim()) {
                optionsId = productAvailableIds[i].productVariantAvailableId;
            break;
            }
        }
        return optionsId;
    }

    getVariantCombosName(variantCombosArr){
        let variantCombosName: string = "";
        // this features is to sort, due to native of this.variants always sorted by id
        (this.productVariants$).forEach(item => {
            // here it will find the matched id, and print the combo name 
            // it will print by this.variants.id ascending
            variantCombosArr.forEach(variantId => {
                let index = item.productVariantsAvailable.findIndex(variant => variant.id === variantId);
                if (index > -1) {
                    variantCombosName += item.productVariantsAvailable[index].value + "/";
                }
            });
        });
        
        return variantCombosName.slice(0,-1);
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

    sortObjects(array) {
        array.sort(function (a, b) {
        return a.sequenceNumber - b.sequenceNumber;
        });
    }

    variantsChanged(i, data, items, options, combos) {
        if (options[i].id) {
        //   this.apiCalls.addVariantValues(this.selectedProduct.id, { productVariantId: options[i].id, value: data.value, sequenceNumber: items.values.length - 1 })
        }
        combos = [];
        this.getallCombinations(items)
    }

    /**
     * Toggle the variants edit mode
     */
    toggleVariantsEditMode(): void
    {
        this.productVariantsEditMode = !this.productVariantsEditMode;
    }

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
        // this.filteredProductVariants = this.productVariants.value.filter(variant => variant.name.toLowerCase().includes(value));
        this.filteredProductVariants = this.variantComboOptions.filter(variant => variant.name.toLowerCase().includes(value));


    }

    /**
     * Filter variants input key down event
     *
     * @param event
     */
    filterVariantsInputKeyDown(event): void
    {
        // Return if the pressed key is not 'Enter'
        if ( event.key !== 'Enter' )
        {
            return;
        }

        // If there is no variant...
        if ( this.filteredProductVariants.length === 0 )
        {
            // Create the variant
            // this.createVariant(event.target.value); //iman comment this

            // Clear the input
            event.target.value = '';

            return;
        }

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
     * Create a new variant
     *
     * @param title
     */
    createVariant(name: string): void
    {

        this.productVariants.clear;

        let _item = this._formBuilder.group({
            id:null,
            name: name,
            productVariantsAvailable:this._formBuilder.array([]),
        });

        let item = {
            id:null,
            name: name,
            productVariantsAvailable: [],
        };

        this.variantToBeCreated.push(_item)
        this.productVariants.push(_item);
        this.variantComboOptions.push(item);
        this.filteredProductVariants= this.variantComboOptions;

        // add new empty array for variantComboItems
        this.variantComboItems.push({ values: [], ids: [] })
    
    }

    editVariantTitle(variants: ProductVariant, event){
        // Update the title on the category
        variants.name = event.target.value;
    }

    updateVariantTitle(variants: ProductVariant, event){

        alert("Update variant, backend not ready yet")
        // Update the category on the server
        // this._inventoryService.updateVariant(variants.id, variants)
        //     .pipe(debounceTime(300))
        //     .subscribe();
    }

    /**
     * Delete the variant
     *
     * @param variant
     */
    deleteVariant(variant: ProductVariant, variantIdx): void
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
                 this.productVariants.removeAt(variantIdx);
                //  this.variantComboOptions = this.productVariants.value;
                
                // Delete the variant from variantComboItems
                this.variantComboItems.splice(variantIdx, 1);
                this.variantComboOptions.splice(variantIdx, 1);
                
                this.filteredProductVariants = this.variantComboOptions;
                this.selectedVariantCombos = []
             
                this.getallCombinations(this.variantComboItems)

                //  this.variantComboOptions.splice(variantIdx, 1)
 
                 variant.productVariantsAvailable.forEach(x => {

                     // to remove combinations with deleted options
                     this.selectedVariantCombos = this.selectedVariantCombos.filter(y => !y.variant.includes(x.value));

                    })

                // remove variant available to be created, if not, api will return error    
                this.variantAvailableToBeCreated = this.variantAvailableToBeCreated.filter(y => !y.variantName.includes(variant.name));

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

    }

    /**
     * Add variant to the product
     *
     * @param variant
     */
    addVariantToProduct(variant: ProductVariant): void
    {

        // Add the variant
        this.selectedProduct.productVariants.unshift(variant);

        // Update the selected product form        
        this.productVariants = this.selectedProductForm.get('productVariants') as FormArray;
        this.productVariants.push(this._formBuilder.group(variant));

        this.productVariants$ = this.selectedProduct.productVariants;
        this.filteredProductVariants = this.selectedProduct.productVariants;
        
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove variant from the product
     *
     * @param variant
     */
    removeVariantFromProduct(variant: ProductVariant): void
    {
        let index = this.selectedProduct.productVariants.findIndex(item => item.id === variant.id);
        
        // Remove the variant
        this.selectedProduct.productVariants.splice(index, 1);

        // Update the selected product form
        this.productVariants = this.selectedProductForm.get('productVariants') as FormArray;
        this.productVariants.clear();
        
        this.selectedProduct.productVariants.forEach(item => {
            this.productVariants.push(this._formBuilder.group(item));
        });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle product variant
     *
     * @param variant
     * @param change
     */
    toggleProductVariant(variant: ProductVariant, change: MatCheckboxChange): void
    {
        if ( change.checked )
        {
            this.addVariantToProduct(variant);
        }
        else
        {
            this.removeVariantFromProduct(variant);
        }
    }

    /**
     * Should the create variant button be visible
     *
     * @param inputValue
     */
    shouldShowCreateVariantButton(inputValue: string): boolean
    {
        
        // return !!!(inputValue === '' || this.productVariants$.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);
        // return !!!(inputValue === '' || this.productVariants.value.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);
        return !!!(inputValue === '' || this.variantComboOptions.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);

    }

    /**
     * Open variants panel
     */
    openVariantsPanel(variant:any, idx): void
    {

        this.selectedProductVariants = variant;
        
        if (this.selectedProductVariants){

            // get index of filteredVariants that have same id with variantId
            // let index = this.filteredProductVariants.findIndex(x => x.id === variant.id);

            this.variantIndex = idx;
    
            // get the object of filteredVariantsTag in filteredVariants
            this.productVariantAvailable$ = this.filteredProductVariants[idx].productVariantsAvailable;
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
                this.filteredProductVariantAvailable = this.productVariantAvailable$;

                // Toggle the edit mode off
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
     * Delete the selected variants using the form data
     */
    deleteAllVariantsConfirmation(): void
    {

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete variants',
            message: 'Are you sure you want to disable this variants? Current variants of this product will be remove permenantly!',
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

                // set the variant combinations array to empty
                this.selectedVariantCombos = [];
                this.variantComboItems = [];
                this.variantComboOptions = [];

            } else {
                // Update the selected product form
                this.selectedProductForm.get('isVariants').patchValue(true);
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    displayVariants(){
        this.showVariantsSection = !this.showVariantsSection;
    }
    
    /**
     * Toggle variant details
     *
     * @param itemCode
     */
    toggleVariantDetails(itemCode: string): void
    {

        // If the variant is already selected...
        if ( this.selectedProductInventories && this.selectedProductInventories.itemCode === itemCode )
        { 
            // Close the details
            this.closeVariantDetails();
            return;
        }
        
        // Get variant list
        let index = (this.selectedProduct.productInventories).findIndex(item => item.itemCode === itemCode);
        this.selectedProductInventories = this.selectedProduct.productInventories[index];

        this.indexOfProductInventories = index;
            
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Close the details
     */
    closeVariantDetails(): void
    {
        this.selectedProductInventories = null;
    }

    // --------------------------------------
    // Product Variant Available Section
    // --------------------------------------

    /**
     * Toggle the variants Available edit mode
     */
    toggleVariantsAvailableEditMode(): void
    {
        this.productVariantAvailableEditMode = !this.productVariantAvailableEditMode;
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
        this.filteredProductVariantAvailable = this.productVariantAvailable$?.filter(variantAvailable => variantAvailable.value.toLowerCase().includes(value));

    }
 
     /**
      * Filter variants input key down event
      *
      * @param event
      */
    filterProductVariantAvailableInputKeyDown(event): void
    {
        // Return if the pressed key is not 'Enter'
        if ( event.key !== 'Enter' )
        {
            return;
        }

        // If there is no variant available...
        if ( this.filteredProductVariantAvailable.length === 0 )
        {
            // Create the variant
        //  this.createVariantTag(event.target.value);

            // Clear the input
            event.target.value = '';

            // Return
            return;
        }

        // If there is a variant...
        const variantTag = this.filteredProductVariantAvailable[0];
        const isVariantTagApplied = this.selectedProduct.productVariants.find(item => item.id === variantTag.id);

        // If the found variant is already applied to the product...
        if ( isVariantTagApplied )
        {
            // Remove the variant from the product
        //  this.removeVariantTagFromProduct(variantTag);
        }
        else
        {
            // Otherwise add the variant to the product
            let variantId
            this.addVariantAvailableToVariant(variantTag, variantId);
        }
    }

    /**
     * Create a new variant
     *
     * @param value
     */
    createVariantAvailable(value: string, variantIdx: number): void
    {
        
        // push new variant option (available) value to variant items array 
        this.variantComboItems[variantIdx].values.push(value);
        
        // if variant recently created then need to create the variant then push the variant available listing
        const variant = {
            value,
            productId: this.selectedProduct.id,
            productVariantId: this.selectedProductVariants.id !== null ? this.selectedProductVariants.id : '',
            sequenceNumber: this.variantComboItems[variantIdx].values.length - 1,
            variantName: this.selectedProductVariants.name
        }; 

        this.productVariantAvailable$.push(variant);

        //--- CAN USE THIS TO CREATE NEW VARIANT AVAILABLE TO BE
        this.variantAvailableToBeCreated.push(variant);

        this.filteredProductVariantAvailable= this.productVariantAvailable$;   

        // if this is the first variant available to be added to the variant, set selectedVariantCombos to empty
        if (variantIdx > 0 && this.variantComboItems[variantIdx].values.length < 2){
            this.selectedVariantCombos = []
        }

        // to generate the combinations
        this.getallCombinations(this.variantComboItems)


        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
 
    editVariantAvailableTitle(variantsAvailable: ProductVariantAvailable, event){
        // Update the title on the category
        variantsAvailable.value = event.target.value;
    }

    updateVariantAvailableTitle(variantsAvailable: ProductVariantAvailable, event){

        alert("Update variant available, backend not ready yet")
        // Update the category on the server
        // this._inventoryService.updateVariant(variants.id, variants)
        //     .pipe(debounceTime(300))
        //     .subscribe();
    }
 
    /**
     * Delete the variant available
     *
     * @param variant
     */
    deleteVariantAvailable(variantAvailable: ProductVariantAvailable, variantIdx): void
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
                // productVariantAvailable$
                //----------------------------

                // Find the index of the deleted variant available for productVariantAvailable$
                const index = this.productVariantAvailable$.indexOf(variantAvailable);

                // Delete the variant available from productVariantAvailable$
                if (index > -1) {
                    this.productVariantAvailable$.splice(index, 1);
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
 
     /**
      * Add variant to the product
      *
      * @param variant
      */
    addVariantAvailableToVariant(productVariantAvailable: ProductVariantAvailable, variantId: string): void
    {
        let index = this.productVariants$.findIndex(variant=> variant.id === variantId);
        
        // if null define empty array
        if (this.productVariants$[index].productVariantsAvailable === null){
            this.productVariants$[index].productVariantsAvailable = Array();
            this.productVariants$[index].productVariantsAvailable.push(productVariantAvailable);
        } 
        // Add the productVariantAvailable
        this.productVariants$[index].productVariantsAvailable.push(productVariantAvailable);

        // Update the product variant form
        this.productVariants = this.selectedProductForm.get('productVariants') as FormArray;
        this.productVariants.clear();
        
        this.productVariants$.forEach(item => {
            let _item = this._formBuilder.group({
                id: item.id,
                name: item.name,
                productVariantsAvailable: [item.productVariantsAvailable] // idk why, but this is the only workable way to archive array in this._formBuilder.group
            });

            this.productVariants.push(_item);
        });
        
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
 
    /**
     * Remove variantTag from the product
     *
     * @param variantTag
     */
    removeVariantAvailableFromProduct(variantAvailable: ProductVariantAvailable): void
    {

    // Find Index of variantAvailable.productVariantId

    let selectedroductVariants = this.selectedProduct.productVariants.find(variant=> variant.id === variantAvailable.productVariantId);

    // Remove the variant Available 
    selectedroductVariants.productVariantsAvailable.splice(selectedroductVariants.productVariantsAvailable.findIndex(item => item.id === variantAvailable.id), 1);

    // After selectedroductVariants.productVariantsAvailable.splice , no need to patch this.selectedProduct.productVariants
    // because inventory service observable already did that in removeVariantFromProduct (i think)

    // Mark for check
    this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle product variantTag
     *
     * @param variantTag
     * @param change
     */
    toggleProductVariantTag(variant: ProductVariant, change: MatCheckboxChange): void
    {
        if ( change.checked )
        {
            this.addVariantToProduct(variant);
        }
        else
        {
            this.removeVariantFromProduct(variant);
        }
    }
 
     /**
      * Should the create variantTag button be visible
      *
      * @param inputValue
      */
    shouldShowCreateVariantAvailableButton(inputValue: string): boolean
    {
        //conditional when we click the variant that was recently created it will has null value so we need to handle this issue in order to display create button for variant available
        if(this.productVariantAvailable$ === null){
            this.productVariantAvailable$ = [];
        }
 
        return !!!(inputValue === '' || this.productVariantAvailable$?.findIndex(variantTag => variantTag.value.toLowerCase() === inputValue.toLowerCase()) > -1);
        // return !!!(inputValue === '' || this.filteredProductVariantAvailable?.findIndex(variantTag => variantTag.value.toLowerCase() === inputValue.toLowerCase()) > -1);
  
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
        const isCategoryApplied = this.selectedProduct.categoryId;

        // If the found category is already applied to the product...
        if ( isCategoryApplied )
        {
            // Remove the category from the product
            this.removeCategoryFromProduct(category);
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
    editCategoryTitle(category: ProductCategory, event): void
    {
        // Update the title on the category
        category.name = event.target.value;
    }

    updateCategoryTitle(category: ProductCategory, event): void
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
        // Add the category
        this.selectedProduct.categoryId = category.id;

        // Update the selected product form
        this.selectedProductForm.get('categoryId').patchValue(this.selectedProduct.categoryId);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
 
     /**
      * Remove category from the product
      *
      * @param category
      */
    removeCategoryFromProduct(category: ProductCategory): void
    {
        // Remove the category
        this.selectedProduct.categoryId = null;

        // Update the selected product form
        this.selectedProductForm.get('categoryId').patchValue(this.selectedProduct.categoryId);

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
        } else {
            this.removeCategoryFromProduct(category);
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
    toggleImagesEditMode(imgType: string, index?:string): void
    {
        //set images Edit Mode for product image
        if (imgType == 'productImg'){
            this.imagesEditMode = !this.imagesEditMode;
            
        }
        //set images Edit Mode for variant image

        //TAK JADII, KENA BUAT BALIK
        else if (imgType == 'variantOptionImg'){
            this.variantimagesEditMode[index] = !this.variantimagesEditMode[index];
            

        }
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
                
                this.selectedProductForm.get('productAssets').value.push({
                    url: reader.result + "",
                    id: this.currentImageIndex,
                    isThumbnail: false
                });
                
                this.currentImageIndex = this.images.length - 1;
            } else {
                this.images[this.currentImageIndex] = reader.result + "";
                this.imagesFile[this.currentImageIndex] = file;

                this.selectedProductForm.get('productAssets').value[this.currentImageIndex].url = this.images[this.currentImageIndex];
            }

            this.imagesEditMode = false; 
            this._changeDetectorRef.markForCheck();
        }
    }

    uploadVariantImages(fileList: FileList, images, idx): Promise<void>
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
     * Remove the image
     */
    removeImage(): void
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
                const index = this.currentImageIndex;
                if (index > -1) {
                    this.images.splice(index, 1);
                    this.imagesFile.splice(index, 1);
                    
                    let expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
                    let regex = new RegExp(expression);
                    if (this.selectedProductForm.get('productAssets').value[index].url.match(regex)) { // if url is valid, then we delete backend
                        this._inventoryService.deleteProductAssets(this.selectedProduct.id, this.selectedProductForm.get('productAssets').value[index].id)
                        .pipe(takeUntil(this._unsubscribeAll))
                        .subscribe((deleteResponse)=>{
                            this.resetCycleImages();
                            this.imagesEditMode = false;
                        });
                    }
                    this.selectedProductForm.get('productAssets').value.splice(index, 1);
                    this.currentImageIndex = 0;
                }
            }
        });
    }

    /**
     * Remove variant image
     */
    removeVariantImage(imageIdx): void
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
                                      
                }
                this._changeDetectorRef.markForCheck();
            }
        });
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

    setThumbnail(currentImageIndex: number){
        this.thumbnailIndex = currentImageIndex;
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
        return item ? item.id : undefined;
    }

    trackVariantAvailable(index: number, item: any)
    {
        return item ? item.id : undefined;
    }

    trackVariant(index: number, item: any)
    {
        
        return item ? item.id : undefined;
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

    // Quil editor text limit
    textChanged($event) {
        const MAX_LENGTH = 500;
        if ($event.editor.getLength() > MAX_LENGTH) {
           $event.editor.deleteText(MAX_LENGTH, $event.editor.getLength());
        }
    }

    disabledTrackStock(isTrackStock: boolean) {
        if (isTrackStock === false){
            this.selectedProductForm.get('allowOutOfStockPurchases').patchValue(false);
            this.selectedProductForm.get('minQuantityForAlarm').patchValue(-1);
        }
    }

    openProductPreview(){
        window.open(this.selectedProductForm.get('seoUrl').value, '_blank');
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

    // this is when click update button in variant page
    createVariantCombinationsToBE(){
        console.log('UPDATE -> selectedVariantCombos object', this.selectedVariantCombos);
        console.log('this.filteredProductVariants', this.filteredProductVariants);
        console.log('this.variantToBeDeleted', this.variantToBeDeleted);
        console.log('this.variantAvailableToBeCreated', this.variantAvailableToBeCreated);
        console.log('this.variantAvailableToBeDeleted', this.variantAvailableToBeDeleted);
        console.log('this.variantComboItems', this.variantComboItems);
        console.log('this.variantComboOptions', this.variantComboOptions);
        console.log('this.variantImagesToBeDeleted', this.variantImagesToBeDeleted);
        console.log('variantimages', this.variantimages);
        console.log('this.filteredProductVariantAvailable', this.filteredProductVariantAvailable);
        
        // console.log('this.products$', this.products$);
    }
}
