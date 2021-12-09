import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Product, ProductVariant, ProductVariantAvailable, ProductInventory, ProductCategory, ProductPagination, ProductPackageOption } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { MatDialog } from '@angular/material/dialog';
import { AddProductComponent } from '../add-product/add-product.component';

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
                    grid-template-columns: 48px 112px auto 112px 72px;
                }

                @screen lg {
                    grid-template-columns: 48px 112px auto 112px 96px 96px 72px;
                }
            }

            .option-grid {
                grid-template-columns: 120px 112px auto 112px;
            }
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
    _products: Product[];
    filteredProductsOptions: Product[] = [];
    selectedProductsOptions: Product[] = [];
    selectedProductsOption: ProductPackageOption = null;
    _selectedProductsOption = {};
    optionChecked = [];

    // product variant
    productVariants$: ProductVariant[] = [];
    filteredProductVariants: ProductVariant[] = [];
    selectedProductVariants: ProductVariant;

    productVariantsEditMode: boolean = false;
    productVariantsValueEditMode:any = [];
    showVariantsSection: boolean = false;

    // product variant available
    productVariantAvailable$: ProductVariantAvailable[] = [];
    filteredProductVariantAvailable: ProductVariantAvailable[] = [];
    selectedProductVariantAvailable: ProductVariantAvailable[] = [];
    
    productVariantAvailableEditMode: boolean = false;
    productVariantAvailableValueEditMode:any = [];

    // product inventory
    productInventory$: ProductInventory[] = [];
    filteredProductInventory: ProductInventory[] = [];
    selectedProductInventory: ProductInventory;

    // product category
    productCategories$: ProductCategory[];
    filteredProductCategories: ProductCategory[];
    selectedProductCategory: ProductCategory;
    
    productCategoriesEditMode: boolean = false;
    productCategoriesValueEditMode:any = [];

    // product assets
    images: any = [];
    imagesFile: any = [];
    currentImageIndex: number = 0;

    // sku, price & quantity 
    // reason these 3 not in formbuilder is because it's not part of product but 
    // it's part of product inventory (it's here for display only)
    displaySku: string = "";
    displayPrice: number = 0;
    displayQuantity: number = 0;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: FormControl = new FormControl();

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

    selectedVariantCombos: any = [];

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
            description      : [''],
            // storeId          : [''], // not used
            categoryId       : [''],
            status           : ['INACTIVE'],
            // thumbnailUrl     : [''],
            // vendor           : [''], // not used
            // region           : [''], // not used
            // seoUrl           : [''], // not used
            // seoName          : [''], // not used
            trackQuantity    : [false],
            allowOutOfStockPurchases: [false],
            minQuantityForAlarm: [-1],
            packingSize      : [''],
            // created          : [''],
            // updated          : [''],
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
            // productInventories : this._formBuilder.array([{
            //     itemCode                : [''],
            //     price                   : [0],
            //     quantity                : [''],
            //     productId               : [''],
            //     productInventoryItems   : this._formBuilder.array([{
            //         itemCode                    : [''],
            //         productVariantAvailableId   : [''],
            //         productId                   : [''],
            //         sequenceNumber              : [''],
            //         productVariantAvailable     : [{
            //             id              : [''],
            //             value           : [''],
            //             productId       : [''],
            //             productVariantId: [''],
            //             sequenceNumber  : [0],
            //         }],
            //     }]),
            //     sku                     : ['']
            // }]),
            // productReviews        : [''], // not used
            // productAssets         : this._formBuilder.array([{
            //     id                  : [''],
            //     itemCode            : [''],
            //     name                : [''],
            //     url                 : [''],
            //     productId           : [''],
            //     isThumbnail         : [false],
            // }]),
            // productDeliveryDetail : [''], // not used


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

        // Assign to local products
        this.products$
            .pipe(takeUntil(this._unsubscribeAll))    
            .subscribe((response)=>{
                this._products = response;

                // remove object for array of object where item.isPackage !== true
                let _filteredProductsOptions = response.filter(item => item.isPackage !== true );

                this.filteredProductsOptions = _filteredProductsOptions;
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
                    return this._inventoryService.getProducts(0, 10, 'name', 'asc', query);
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
                        return this._inventoryService.getProducts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction);
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

        // set showVariantsSection , showCombosSection to false
        this.showVariantsSection = false;
        this.showCombosSection = false;

        // Get the product by id
        this._inventoryService.getProductById(productId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((product) => {

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

                // set isVariants = true is productInventories.length > 0
                product.productInventories.length > 0 ? this.selectedProductForm.get('isVariants').patchValue(true) : this.selectedProductForm.get('isVariants').patchValue(false);

                // Get product image by product id
                
                let imagesObjSorted = product.productAssets.sort(this.dynamicSort("itemCode"));
                let imageArr = imagesObjSorted.map(item => item.url);

                // console.log("asal kejadian image", imageArr)

                this.images = imageArr;
                
                // Set to this productVariants 
                this.productVariants$ = product.productVariants;
                this.filteredProductVariants = product.productVariants;


                // reset selectedVariantCombos to empty 
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
                }

                // next sort this.selectedProduct.productVariantsAvailable
                this.selectedProduct.productVariants.forEach((element: ProductVariant, index) => {
                    this.sortObjects(element.productVariantsAvailable)
                    // this.options.push({ name: element.name, id: element.id })

                    // push empty values array and ids array for each productVariantsAvailable
                    variantOptions.push({ name: element.name, id: element.id })
                    variantItems.push({ values: [], ids: [] })

                    // push productVariantsAvailable.value and productVariantsAvailable.id to the 
                    // created items above
                    element.productVariantsAvailable.forEach(item => {
                        variantItems[index].values.push(item.value);
                        variantItems[index].ids.push(item.id);
                    });
                });
                
                this.getallCombinations(variantItems)
                
                const productIdLength = this.selectedProduct.id.length;
                (this.selectedProduct.productInventories).forEach((item: ProductInventory, index) => {
                    if (item.itemCode.slice(-1) != "a") {
                        const index = parseInt(item.itemCode.substring(productIdLength));
                        // console.log("selectedVariantCombos: ",this.selectedVariantCombos)
                        if (this.selectedVariantCombos[index]) {
                            // console.log("item.price :",item.price)
                            this.selectedVariantCombos[index].itemCode = item.itemCode;
                            this.selectedVariantCombos[index].price = item.price;
                            this.selectedVariantCombos[index].sku = item.sku;
                            this.selectedVariantCombos[index].quantity = item.quantity;
                            // this.variantCombos[index].status = item.status;
                        }
                    }
                });

                // console.log("this.selectedVariantCombos", this.selectedVariantCombos)

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

                this.selectedProduct.minQuantityForAlarm = product.minQuantityForAlarm;

                // Update minQuantityForAlarm
                this.selectedProductForm.get('minQuantityForAlarm').patchValue(this.selectedProduct.minQuantityForAlarm);

                // Update the selected product form
                this.selectedProductForm.get('minQuantityForAlarm').patchValue(this.selectedProduct.minQuantityForAlarm);

                // get product combo list
                if (this.selectedProduct.isPackage === true) {
                    this._inventoryService.getProductPackageOptions(productId)
                        .pipe(takeUntil(this._unsubscribeAll))
                        .subscribe((response)=>{
                            this.productsCombos$ = response["data"];
                        });
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }
    
    /**
     * this create product check category first before creating them
     */
    initCreateProduct(productType: string){
        
        const dialogRef = this._dialog.open(AddProductComponent, { disableClose: true });
        dialogRef.afterClosed().subscribe(result => {

            if (result.valid === false) {
                return;
            }

            if (productType === "normal") {
                // get category by name = no-category
                this._inventoryService.getCategories("no-category").subscribe(async (res)=>{
    
                    let _noCategory = res["data"].find(obj => obj.name === "no-category");
    
                    // if there is no category with "no-category" name, create one    
                    if (!_noCategory || _noCategory["name"] !== "no-category"){
                        await this._inventoryService.createCategory({
                            name: "no-category",
                            parentCategoryId: "",
                            storeId: this.storeId$,
                            thumbnailUrl: ""
                        }).subscribe((res)=>{
                            if (res["status"] !== 201){
                                console.log("an error has occur",res)
                            } else {
                                this.createProduct(res["data"].id, productType, result);
                            }
                        });
                    } else {
                        this.createProduct(_noCategory.id, productType, result);
                    }
                });
            } else if (productType === "combo") {
                // get category by name =Combos
                this._inventoryService.getCategories("Combos").subscribe(async (res)=>{
    
                    let _noCategory = res["data"].find(obj => obj.name === "Combos");
    
                    // if there is no category with "Combos" name, create one   
                    if (!_noCategory || _noCategory["name"] !== "Combos"){
                        await this._inventoryService.createCategory({
                            name: "Combos",
                            parentCategoryId: "",
                            storeId: this.storeId$,
                            thumbnailUrl: ""
                        }).subscribe((res)=>{
                            if (res["status"] !== 201){
                                console.log("an error has occur",res)
                            } else {
                                this.createProduct(res["data"].id, productType, result);
                            }
                        });
                    } else {
                        this.createProduct(_noCategory.id, productType, result);
                    }
                });
            }
        });
    }

    /**
     * Create product
     */
    createProduct(categoryId: string, productType: string, productBody): void
    {

        const { sku, availableStock, price, images, imagefiles, ...newProductBody } = productBody;

        // Create the product
        this._inventoryService.createProduct(categoryId, productType, newProductBody)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(async (newProduct) => {

                // Add Inventory to product
                this._inventoryService.addInventoryToProduct(newProduct["data"], { sku: sku, availableStock: availableStock, price:price } )
                    .subscribe((response)=>{
                        // update sku, price, quantity display since it's not part of product but product inventory
                        this.displayPrice = response.price;
                        this.displayQuantity = response.quantity;
                        this.displaySku = response.sku;
                    });

                // Update the assets product on the server (backend kena enable update)
                if (imagefiles) {
                    for (var i = 0; i < imagefiles.length; i++) {
                        // create a new one
                        let formData = new FormData();
                        formData.append('file',imagefiles[i]);
                        this._inventoryService.addProductAssets(newProduct["data"].id, formData, (i === 0) ? { isThumbnail: true } : { isThumbnail: false })
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
                }

                // Go to new product
                this.selectedProduct = newProduct["data"];
                                        
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
    updateSelectedProduct(): void
    {
        // Get
        // let storeFrontDomain = this._apiServer.settings.storeFrontDomain;
        let storeFrontDomain = 'symplified.ai';
        let storeFrontURL = 'https://' + this.store$.domain + '.' + storeFrontDomain;
        
        // Get the product object
        const { sku, price, quantity, ...product} = this.selectedProductForm.getRawValue();

        product.seoName = product.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        product.seoUrl = storeFrontURL + '/product/name/' + product.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');

        // Update the product on the server
        this._inventoryService.updateProduct(this.selectedProduct.id, product)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                // Show a success message
                this.showFlashMessage('success');
            });

        // Update the inventory product on the server (backend kena enable update)
        // this._inventoryService.updateInventoryToProduct(product.id, productInventories).subscribe(() => {
        //     // Show a success message
        //     this.showFlashMessage('success');
        // });

        // Update the assets product on the server (backend kena enable update)
        if (product.productAssets) {

        } else {

            for (var i = 0; i < this.imagesFile.length; i++) {
                // create a new one
                let formData = new FormData();
                formData.append('file',this.imagesFile[i]);
                this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === 0) ? { isThumbnail: true } : { isThumbnail: false })
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((response)=>{
                        if (response.isThumbnail){
                            this.selectedProduct.thumbnailUrl = response.url;
                        }

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });
            }

        }
        
        // this._inventoryService.updateInventoryToProduct(product.id, productInventories).subscribe(() => {
        //     // Show a success message
        //     this.showFlashMessage('success');
        // });
    }
 
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
        this.filteredProductsOptions = this._products.filter(product => product.name.toLowerCase().includes(value));
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
            message: 'Are you sure you want to delete this option? This option will be remove permenantly!',
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
                    console.log("you need to add at least 1 product")
                }
            } else {
                // if this._selectedProductsOption["productPackageOptionDetail"] have no value, 
                // dis should not happen                
                console.log("this should not happen")
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

    displayCombos(){
        this.showCombosSection = !this.showCombosSection;
    }

    // --------------------------------------
    // Product Variant Section
    // --------------------------------------

    getVariantCombosName(variantCombosArr){
        let variantCombosName: string = "";
        // this features is to sort, due to native of this.variants always sorted by id
        (this.productVariants$).forEach(item => {
            // here it will find the matched id, and print the combo name 
            // it will print by this.variants.id ascending
            variantCombosArr.forEach(variantId => {
            // console.log("variantId :", variantId);
                let index = item.productVariantsAvailable.findIndex(variant => variant.id === variantId);
                if (index > -1) {
                    variantCombosName += item.productVariantsAvailable[index].value + "/";
                }
            });
        });
        
        return variantCombosName.slice(0,-1);
    }

    getallCombinations(combos, itemCode = "", nameComboOutput = "", n = 0) {
        var nameCombo = "";
        if (n == combos.length) {
            if (nameComboOutput.substring(1) != "") {
            this.selectedVariantCombos.push({ itemCode: itemCode, variant: nameComboOutput.substring(1), price: 0, quantity: 0, sku: 0, status: "AVAILABLE" })
            // this.images.push([])
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
    }

    setVariants() {
        
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
        if ( event.key !== 'Enter' )
        {
            return;
        }

        // If there is no variant available...
        if ( this.filteredProductVariants.length === 0 )
        {
            // Create the variant
            // this.createVariant(event.target.value);

            // Clear the input
            event.target.value = '';

            // Return
            return;
        }

        // If there is a variant...
        const variant = this.filteredProductVariants[0];
        const isVariantApplied = this.selectedProduct.productVariants.find(item => item.id === variant.id);

        // If the found variant is already applied to the product...
        if ( isVariantApplied )
        {
            // Remove the variant from the product
            this.removeVariantFromProduct(variant);
        }
        else
        {
            // Otherwise add the variant to the product
            this.addVariantToProduct(variant);
        }
    }

    /**
     * Create a new variant
     *
     * @param title
     */
    createVariant(name: string): void
    {
        const variant = {
            name
        };
        
        // Create variant on the server
        this._inventoryService.createVariant(variant, this.selectedProduct.id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                // Add the variant to the product
                this.addVariantToProduct(response);
            });
    }

    updateLocalVariantTitle(variants: ProductVariant, event){
        // Update the title on the category
        variants.name = event.target.value;
    }

    updateServerVariantTitle(variants: ProductVariant, event){

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
    deleteVariant(variant: ProductVariant): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete variant',
            message: 'Are you sure you want to delete this variant? This variant will be remove permenantly!',
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
                this._inventoryService.deleteVariant(variant, this.selectedProduct.id)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((response)=>{
                        this.removeVariantFromProduct(response)
                    });
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
        this.selectedProductForm.get('productVariants').patchValue(this.selectedProduct.productVariants);

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
        // Remove the variant
        this.selectedProduct.productVariants.splice(this.selectedProduct.productVariants.findIndex(item => item.id === variant.id), 1);

        // Update the selected product form
        this.selectedProductForm.get('productVariants').patchValue(this.selectedProduct.productVariants);

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
        return !!!(inputValue === '' || this.productVariants$.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);
    }

    /**
     * Open variants panel
     */
    openVariantsPanel(variant: ProductVariant): void
    {

        this.selectedProductVariants = variant;
        
        if (this.selectedProductVariants){

            // get index of filteredVariants that have same id with variantId
            let index = this.filteredProductVariants.findIndex(x => x.id === variant.id);
    
            // get the object of filteredVariantsTag in filteredVariants
            this.productVariantAvailable$ = this.filteredProductVariants[index].productVariantsAvailable;
            this.filteredProductVariantAvailable = this.filteredProductVariants[index].productVariantsAvailable;

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

                console.log("VARIANT DELETED")
                // Close the details
                // this.closeDetails();
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
        if ( this.selectedProductInventory && this.selectedProductInventory.itemCode === itemCode )
        {
            console.log("X MASUK PON")
            // Close the details
            this.closeVariantDetails();
            return;
        }
        
        // Get variant list
        let index = (this.selectedProduct.productInventories).findIndex(item => item.itemCode === itemCode);
        this.selectedProductInventory = this.selectedProduct.productInventories[index];

        
        console.log("index : ",index)
        console.log("itemCode : ",itemCode);
        console.log("this.variants : ",this.selectedProduct.productInventories)
        console.log("this.variants[index] : ",this.selectedProduct.productInventories[index])
        console.log("this.selectedItemCode : ",this.selectedProductInventory);
        
        // Get the variant details by id
        // this._inventoryService.getProductById(variantId)
        //     .subscribe(async (variant) => {
        //         // Set the selected variant
        //         this.selectedVariantList = variant;
        //     });
            
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Close the details
     */
    closeVariantDetails(): void
    {
        this.selectedProductInventory = null;
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

        console.log("this.productVariantAvailable$ :",this.productVariantAvailable$)
        console.log("this.productVariantAvailable$ value :",value)

        // Filter the variants
        this.filteredProductVariantAvailable = this.productVariantAvailable$.filter(variantAvailable => variantAvailable.value.toLowerCase().includes(value));

        console.log("this.filteredProductVariantAvailable: ", this.filteredProductVariantAvailable)
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
            this.addVariantAvailableToProduct(variantTag, variantId);
        }
    }

    /**
     * Create a new variant
     *
     * @param value
     */
    createVariantAvailable(value: string): void
    {
        const variant = {
            productId: this.selectedProduct.id,
            productVariantId: this.selectedProductVariants.id,
            value
        };
        
        // Create variant on the server
        this._inventoryService.createVariantAvailable(variant, this.selectedProduct.id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => { 
                // Add the variant to the product
                this.addVariantAvailableToProduct(response,this.selectedProductVariants.id);

                // reset current filteredProductVariantAvailable
                this.filteredProductVariantAvailable = this.productVariantAvailable$;
            });
    }
 
    updateLocalVariantAvailableTitle(variantsAvailable: ProductVariantAvailable, event){
        // Update the title on the category
        variantsAvailable.value = event.target.value;
    }

    updateServerVariantAvailableTitle(variantsAvailable: ProductVariantAvailable, event){

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
    deleteVariantAvailable(variantAvailable: ProductVariantAvailable): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete variant',
            message: 'Are you sure you want to delete this variant value ? This variant value will be remove permenantly!',
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
                this._inventoryService.deleteVariantAvailable(variantAvailable, this.selectedProduct.id)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((response)=>{
                        this.removeVariantAvailableFromProduct(response)
                    });
            }
        });
    }
 
     /**
      * Add variant to the product
      *
      * @param variant
      */
    addVariantAvailableToProduct(productVariantAvailable: ProductVariantAvailable, variantId: string): void
    {
        let selectedProductVariant = this.selectedProduct.productVariants.find(variant=> variant.id === variantId);
        
        // Add the productVariantAvailable
        selectedProductVariant.productVariantsAvailable.unshift(productVariantAvailable);

        // Get Current Selected Variant (since variant not changed in this case)
        // things that change is variant available
        let currentSelectedVariant = this.selectedProductForm.get('productVariants').value;
        currentSelectedVariant.push(selectedProductVariant);

        // Update the selected product form
        this.selectedProductForm.get('productVariants').patchValue(currentSelectedVariant);
        
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
        return !!!(inputValue === '' || this.productVariantAvailable$.findIndex(variantTag => variantTag.value.toLowerCase() === inputValue.toLowerCase()) > -1);
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
            } else {
                this.images[this.currentImageIndex] = reader.result + "";
            }

            this.imagesEditMode = false; 
            this._changeDetectorRef.markForCheck();
        }

        const product = this.selectedProductForm.getRawValue();
        
        // // Get the product object
        // const product = this.selectedProductForm.getRawValue();

        // // Remove the currentImageIndex field
        // delete product.currentImageIndex;

        // // Update the product on the server
        // this._inventoryService.updateProduct(product.id, product).subscribe(() => {

        //     // Show a success message
        //     this.showFlashMessage('success');
        // });

        // Update the selected product
        
        // this._inventoryService.uploadImages(this.selectedProduct.id, file).subscribe();
    }

    /**
     * Upload avatar
     *
     * @param fileList
     */
    // uploadImages(fileList: FileList, images): Promise<void>
    // {
    //     // Return if canceled
    //     if ( !fileList.length )
    //     {
    //         return;
    //     }

    //     const allowedTypes = ['image/jpeg', 'image/png'];
        
    //     let file = [];
    //     for( let i = 0; i < fileList.length; i ++){
            
    //         file[i] = fileList;
    //         // Return if the file is not allowed
    //         if ( !allowedTypes.includes(file[i].type) )
    //         {
    //             return;
    //         }
            
    //         var reader = new FileReader();
    //         reader.readAsDataURL(file[i]); 
    //         reader.onload = (_event)  => {
    //             if(!images.length === true) {
    //                 this.images.push(reader.result);
    //                 this.imagesFile.push(file[i]);
    //             } else {
    //                 this.images[this.currentImageIndex] = reader.result + "";
    //             }
    
    //             this.imagesEditMode = false; 
    //             this._changeDetectorRef.markForCheck();
    //         }
    
    //         const product = this.selectedProductForm.getRawValue();
    //     }
    // }

    /**
     * Remove the image
     */
    removeImage(): void
    {
        const index = this.currentImageIndex;
        if (index > -1) {
            this.selectedProductForm.get('images').value.splice(index, 1);
        }

        // // Get the form control for 'avatar'
        // const avatarFormControl = this._inventoryService.get('avatar');

        // // Set the avatar as null
        // avatarFormControl.setValue(null);

        // // Set the file input value as null
        // this._avatarFileInput.nativeElement.value = null;

        // // Update the contact
        // this.contact.avatar = null;
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
}
