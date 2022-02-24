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
    
    // // product combo
    // productsCombos$: ProductPackageOption[] = [];
    // showCombosValueEditMode:any = [];
    // showCombosSection: boolean = false;
    
    // // product combo package
    // _products: Product[]; // use in combo section -> 'Add product' --before filter
    // filteredProductsOptions: Product[] = []; // use in listing html
    // selectedProductsOptions: Product[] = [];
    // selectedProductsOption: ProductPackageOption = null;
    // _selectedProductsOption = {};
    // optionChecked = [];
    // _filteredProductsOptions: Product[] = []; // use in combo section -> 'Add product' --after filter


    // // -----------------------
    // // product variant
    // // -----------------------

    // productVariants: FormArray;
    // productVariants$: ProductVariant[] = [];
    // filteredProductVariants: any[] = []; // used in html to loop variant
    // selectedProductVariants: ProductVariant;

    // productVariantsEditMode: boolean = false;
    // productVariantsValueEditMode:any = [];
    // showVariantsSection: boolean = false;

    // variantComboItems: any = []; // this is used for generating combinations
    // variantComboOptions: any = []; //
    // variantToBeCreated: any[] = []; // use for creating on BE 
    // variantToBeDeleted: any[] = []; // use for deleting on BE 



    // // product variant available
    // productVariantAvailable: FormArray;
    // productVariantAvailable$: ProductVariantAvailable[] = []; // used in html

    // variantAvailableToBeCreated: any = []; // use for creating on BE 
    // variantAvailableToBeDeleted: any = []; // use for deleting on BE 

    // filteredProductVariantAvailable: any[] = [];
    // selectedProductVariantAvailable: ProductVariantAvailable[] = [];
    
    // productVariantAvailableEditMode: boolean = false;
    // productVariantAvailableValueEditMode:any = [];

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


    /**
     * this create product check category first before creating them
     */
    
    initCreateProduct(productType: string){
        
        const dialogRef = this._dialog.open(AddProductComponent, { 
            panelClass: 'custom-add-product-dialog',
            width: '1030px',
            // maxWidth:'70vw',
            // height: '70vh',
            // maxHeight: '70vh',
            disableClose: true, 
            data: { productType: productType } 
        });
        dialogRef.afterClosed().subscribe(result => {

            if (result.valid === false) {
                return;
            }

        });
    }

    editProduct(productId: string){
        
        const dialogRef = this._dialog.open(EditProductComponent, { 
            panelClass: 'custom-edit-product-dialog',
            width: '1030px',
            // maxWidth:'70vw',
            // height: '90vh',
            // maxHeight: '70vh',
            disableClose: true, 
            data: { productId: productId } 
        });
        dialogRef.afterClosed().subscribe(result => {

            if (result.valid === false) {
                return;
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


}
