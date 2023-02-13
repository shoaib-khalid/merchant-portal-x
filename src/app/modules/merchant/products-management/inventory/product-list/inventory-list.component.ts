import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators, UntypedFormArray, FormControlName} from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { merge, Observable, tap, delay, Subject, of, forkJoin } from 'rxjs';
import { debounceTime, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Product, ProductVariant, ProductVariantAvailable, ProductInventory, ProductCategory, ProductPagination, ProductPackageOption, ProductAssets } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { MatDialog } from '@angular/material/dialog';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { UserService } from 'app/core/user/user.service';
import { Client } from 'app/core/user/user.types';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { DuplicateProductsModalComponent } from '../product-duplicate-modal/product-duplicate-modal.component';


@Component({
    selector       : 'inventory-list',
    templateUrl    : './inventory-list.component.html',
    styleUrls    : ['./inventory-list.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class InventoryListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('matDrawer', {static: true}) _drawer: MatDrawer;

    // get current store
    store$: Store;
    // product
    products$: Observable<Product[]>;
    selectedProduct: Product | null = null;
    selectedProductForm: UntypedFormGroup;
    productsList: Product[] = [];

    pagination: ProductPagination;
    
    // -----------------------
    // product inventory
    // -----------------------

    productInventories: UntypedFormArray;
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

    categoryFilterControl: UntypedFormControl = new UntypedFormControl();
    filterByCatId: string = "";

    localCategoryFilterControl: UntypedFormControl = new UntypedFormControl();
    localFilterByCatId: string = "";

    // ------------------
    // product assets
    // ------------------

    productAssets: UntypedFormArray;
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
    searchInputControl: UntypedFormControl = new UntypedFormControl();

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
    client: Client;
    displayDuplicateProduct: boolean = false;
    storeList: UntypedFormControl = new UntypedFormControl();
    stores: Store[] = [];
    selectedStore: Store = null;
    stores$: Observable<Store[]>;
    storesForm: UntypedFormControl = new UntypedFormControl();
    isDuplicating: boolean = false;
    cloneErrorMessage: string = null;

    inventoryListCondition = '';
    allSelected: boolean = false;
    selection = new SelectionModel<Product>(true, []);
    drawerMode: 'side' | 'over';
    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _inventoryService: InventoryService,
        private _storesService: StoresService,
        private _overlay: Overlay,
        private _renderer2: Renderer2,
        private _viewContainerRef: ViewContainerRef,
        public _dialog: MatDialog,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _userService: UserService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,

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
            name             : ['', [Validators.required]],
            description      : ['', [Validators.required]],
            categoryId       : ['', [Validators.required]],
            status           : ['', [Validators.required]],
            seoUrl           : [''],
            trackQuantity    : [false],
            allowOutOfStockPurchases: [false], 
            minQuantityForAlarm: [-1],
            packingSize      : ['', [Validators.required]],
            productVariants  : this._formBuilder.array([]),
            productInventories: this._formBuilder.array([]),
            productReviews        : [''], // not used
            productAssets: this._formBuilder.array([]),
            productDeliveryDetail : [''], // not used
            isVariants       : [false],
            isPackage        : [false],
        });
        

        // Subscribe to user changes
        this._userService.clientForInv$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((client: Client) => {
                this.client = client;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the stores
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {

                // Update the pagination
                this.store$ = store;

                // if e-commerce
                if ((this.store$.verticalCode === 'E-Commerce' || this.store$.verticalCode === 'ECommerce_PK' || this.store$.verticalCode === 'e-commerce-b2b2c')){
                    // if isDelivery and isDineIn
                    if (this.store$.isDelivery === true && this.store$.isDineIn === true) {
                        this.inventoryListCondition = 'e-commerce-2-prices'
                    }
                    else {
                        this.inventoryListCondition = 'e-commerce-1-price'
                    }
                }
                /* if fnb */
                else {
                    // if isDelivery and isDineIn
                    if (this.store$.isDelivery === true && this.store$.isDineIn === true) {
                        this.inventoryListCondition = 'fnb-2-prices'
                    }
                    else {
                        this.inventoryListCondition = 'fnb-1-price'
                    }
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
            
    
        // Get the products
        this.products$ = this._inventoryService.products$;

        this.products$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((products: Product[]) => {
                if (products) {
                    this.productsList = products;
                    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            })
        
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
                    return this._inventoryService.getProducts(0, 10, 'name', 'asc', query, 'ACTIVE,INACTIVE,OUTOFSTOCK' , this.filterByCatId);
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
                    
                    return this._inventoryService.getProducts(0, 10, 'name', 'asc', '', 'ACTIVE,INACTIVE,OUTOFSTOCK', this.filterByCatId);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();


        // Get the stores
        this._storesService.storesList$
        .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(response => {

                this.stores = response;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        // this.setInitialValue();
        
        // set initial selection
        this.storeList.setValue([]);
        this.storeList.valueChanges
            .pipe(takeUntil(this._unsubscribeAll), debounceTime(300))
            .subscribe((result) => {
                
                this._storesService.getStoresList("", 0, 20, 'name', 'asc', result )
                .subscribe((response)=>{
                    this.stores = response;
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            });

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
                        return this._inventoryService.getProducts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '', 'ACTIVE,INACTIVE,OUTOFSTOCK', this.filterByCatId);
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
        this._unsubscribeAll.next(null);
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


    /**
     * this create product check category first before creating them
     */
    
    initCreateProduct(productType: string){

        // Go to the new product
        this._router.navigate(['./create' ], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
        
        /* const dialogRef = this._dialog.open(AddProductComponent, { 
            panelClass: 'custom-add-product-dialog',
            width: '1150px',
            maxWidth: '100vw',
            height: this.currentScreenSize.includes('sm') ? '99vh' : '100%',
            maxHeight: this.currentScreenSize.includes('sm') ? '700px' : '100vh',
            disableClose: true, 
            data: { productType: productType } 
        });
        dialogRef.afterClosed().subscribe(result => {

            if (result.valid === false) {
                return;
            }

        }); */
    }

    editProduct(productId: string){

        this._router.navigate(['./', productId ], {relativeTo: this._activatedRoute});
        /* // Get the product by id
        this._inventoryService.getProductById(productId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                      
                this.drawerType = 'edit';
                this._drawer.open();
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }); */
        
        /* const dialogRef = this._dialog.open(EditProductComponent, { 
            panelClass: 'custom-edit-product-dialog',
            width: '1150px',
            maxWidth: '100vw',
            height: this.currentScreenSize.includes('sm') ? '99vh' : '100%',
            maxHeight: this.currentScreenSize.includes('sm') ? '700px' : '100vh',
            disableClose: true, 
            data: { productId: productId } 
        });
        dialogRef.afterClosed().subscribe(result => {

            if (result.valid === false) {
                return;
            }

        }); */
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
     * Close the details
     */
    closeDetails(): void
    {
        this.selectedProduct = null;
        (this.selectedProductForm.get('productInventories') as UntypedFormArray).clear();
        (this.selectedProductForm.get('productVariants') as UntypedFormArray).clear();
        (this.selectedProductForm.get('productAssets') as UntypedFormArray).clear();


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
     * Should the create category button be visible
     *
     * @param inputValue
     */
    shouldShowCreateCategoryButton(inputValue: string): boolean
    {
        return !!!(inputValue === '' || this.productCategories$.findIndex(category => category.name.toLowerCase() === inputValue.toLowerCase()) > -1);
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

    /**
     * Return the value of product quantity
     * 
     * @param productInventories 
     * @returns 
     */
    totalInventories(productInventories: ProductInventory[] = []){

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

    duplicateProducts() {

        if (this.selectedStore) {
            this._inventoryService.cloneStoreProducts(this.store$.id, this.selectedStore.id)
                .pipe(
                    tap(() => {
                        this.isDuplicating = true;
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }),
                    // Delay for 7 seconds
                    delay(7000),
                    switchMap(cloned => {
                        if (cloned.error) {
                            console.error('Cloning unsuccessful:', cloned.error)
                            this.cloneErrorMessage = cloned.error;
                            return of(null)
                        }
                        // If success only then we get products and categories
                        else {
                            this.cloneErrorMessage = null;
                            return forkJoin([
                                this._inventoryService.getProducts(0, 10, 'name', 'asc', '', 'ACTIVE,INACTIVE,OUTOFSTOCK', this.filterByCatId), 
                                this._inventoryService.getByQueryCategories( 0 , 30, 'sequenceNumber', 'asc')
                            ])
                        }
                    })
                )
                .subscribe(response => {
                    this.isDuplicating = false;
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                })
        }

    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.productsList.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.productsList.forEach(row => this.selection.select(row));

        
    }

    deleteProducts() {

        if (this.selection.selected.length > 0) {
            // Open the confirmation dialog
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Delete selected items',
                message: 'Are you sure you want to delete items? This action cannot be undone!',
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
                    this._inventoryService.deleteProductInBulk(this.selection.selected.map(x => x.id))
                    .pipe(
                        tap(() => {
                            this.selection.clear();
                        }),
                        // Delay
                        delay(300),
                        // If success only then we get products and categories
                        switchMap(status => {
                            if (status === 200) {
                                return forkJoin([
                                    this._inventoryService.getProducts(0, 10, 'name', 'asc', '', 'ACTIVE,INACTIVE,OUTOFSTOCK', this.filterByCatId), 
                                    this._inventoryService.getByQueryCategories( 0 , 30, 'sequenceNumber', 'asc')
                                ])
                            }
                            else {
                                return of(null);
                            }
                        })
                    )
                    .subscribe(() => {
                        
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });
            
                }
            });
        }

    }

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    duplicateSelectedProducts() {

        const dialog = this._dialog.open(DuplicateProductsModalComponent, { 
            disableClose: false,
            width: this.currentScreenSize.includes('sm') ? 'auto' : '80vw',
            data: this.selection.selected.map(x => x.id)
        });

        dialog.afterClosed().subscribe((result) => {

            if (result === 'closed') {
                this.selection.clear();
            }

            // Mark for check
            this._changeDetectorRef.markForCheck();

        })
    }

    changeSequence(value: any, product: Product) {

        let { productAssets, productInventories, productReviews, productVariants, thumbnailUrl, ...productToUpdate} = product;
        productToUpdate.sequenceNumber = +value.target.value;

        this._inventoryService.updateProduct(product.id, productToUpdate).subscribe();
        
    }

}
