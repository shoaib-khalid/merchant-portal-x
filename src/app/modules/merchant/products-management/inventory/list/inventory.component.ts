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
import { InventoryCategory, InventoryPagination, InventoryProduct, InventoryVariant, InventoryVariantsAvailable } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector       : 'inventory-list',
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
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class InventoryListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('variantsPanel') private _variantsPanel: TemplateRef<any>;
    @ViewChild('variantsPanelOrigin') private _variantsPanelOrigin: ElementRef;

    products$: Observable<InventoryProduct[]>;

    categories: InventoryCategory[];
    filteredCategories: InventoryCategory[];
    categoriesEditMode: boolean = false;

    checkedCategories: InventoryCategory[];
    unCheckedCategories: InventoryCategory[];

    variants: InventoryVariant[] = [];
    filteredVariants: InventoryVariant[] = [];
    variantsEditMode: boolean = false;

    // variantTag: InventoryVariantsAvailable;
    variantsTag: InventoryVariantsAvailable[] = [];
    filteredVariantsTag: InventoryVariantsAvailable[] = [];
    variantsTagEditMode: boolean = false;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: InventoryPagination;
    searchInputControl: FormControl = new FormControl();

    stores: Store[];
    
    selectedProduct: InventoryProduct | null = null;
    selectedProductForm: FormGroup;

    selectedVariant: InventoryVariant | null = null;

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
        private _storeService: StoresService,
        private _overlay: Overlay,
        private _renderer2: Renderer2,
        private _viewContainerRef: ViewContainerRef
    )
    {
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
            id               : [''],
            name             : ['', [Validators.required]],
            description      : [''],
            categoryId       : [''],
            variants         : [[]],
            variantsTag      : [[]],
            sku              : [''],
            stock            : [''],
            minQuantityForAlarm: [''],
            taxPercent       : [''],
            price            : [''],
            weight           : [''],
            thumbnail        : [''],
            images           : [[]],
            currentImageIndex: [0], // Image index that is currently being viewed
            filteredVariant  : [0],
            allowOutOfStockPurchases: [false],
            trackQuantity    : [false],
            status           : ['INACTIVE']
        });

        // Get the stores
        this._storeService.stores$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((stores: Store[]) => {

            // Update the pagination
            this.stores = stores;

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    

        // Get the pagination
        this._inventoryService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: InventoryPagination) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the categories
        this._inventoryService.categories$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((categories: InventoryCategory[]) => {

                // Update the categories
                this.categories = categories;
                this.filteredCategories = categories;
                this.unCheckedCategories = categories;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the products
        this.products$ = this._inventoryService.products$;

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
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
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

        // Get the product by id
        this._inventoryService.getProductById(productId)
            .subscribe(async (product) => {

                // Set the selected product
                this.selectedProduct = product;

                // Fill the form
                this.selectedProductForm.patchValue(product);

                // New part still bugged
                await this._inventoryService.getVariantsByProductId(product.id)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((variants: InventoryVariant[] = []) => {

                    // Set to this variants 
                    this.variants = variants;
                    this.filteredVariants = variants;

                    variants.forEach(element => {
                        this.variantsTag = element.productVariantsAvailable;
                        this.filteredVariantsTag = element.productVariantsAvailable;
                    });

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
                
                // Set to this variants 
                this.variants = product.variants;
                this.filteredVariants = product.variants;

                // Set to this variants 
                (product.variants).forEach(element => {
                    this.variantsTag = element.productVariantsAvailable;
                    this.filteredVariantsTag = element.productVariantsAvailable;
                });
                
                this.selectedProduct.variantsTag = this.variantsTag;

                // Add the category
                this.selectedProduct.categoryId = product.categoryId;
        
                // Update the selected product form
                this.selectedProductForm.get('categoryId').patchValue(this.selectedProduct.categoryId);


                this.selectedProduct.minQuantityForAlarm = product.minQuantityForAlarm;

                // Update the selected product form
                this.selectedProductForm.get('minQuantityForAlarm').patchValue(this.selectedProduct.minQuantityForAlarm);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void
    {
        this.selectedProduct = null;
    }

    /**
     * Cycle through images of selected product
     */
    cycleImages(forward: boolean = true): void
    {
        // Get the image count and current image index
        const count = this.selectedProductForm.get('images').value.length;
        const currentIndex = this.selectedProductForm.get('currentImageIndex').value;

        // Calculate the next and previous index
        const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
        const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

        // If cycling forward...
        if ( forward )
        {
            this.selectedProductForm.get('currentImageIndex').setValue(nextIndex);
        }
        // If cycling backwards...
        else
        {
            this.selectedProductForm.get('currentImageIndex').setValue(prevIndex);
        }
    }

    resetCycleImages(){
        this.selectedProductForm.get('currentImageIndex').setValue(0);
    }

    /**
     * 
     *  VARIANTS
     * 
     */
    
    /**
     * Toggle the variants edit mode
     */
    toggleVariantsEditMode(): void
    {
        this.variantsEditMode = !this.variantsEditMode;
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
        this.filteredVariants = this.variants.filter(variant => variant.name.toLowerCase().includes(value));
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
        if ( this.filteredVariants.length === 0 )
        {
            // Create the variant
            this.createVariant(event.target.value);

            // Clear the input
            event.target.value = '';

            // Return
            return;
        }

        // If there is a variant...
        const variant = this.filteredVariants[0];
        const isVariantApplied = this.selectedProduct.variants.find(id => id === variant.id);

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
        this._inventoryService.createVariant(variant)
            .subscribe((response) => {
                // Add the variant to the product
                this.addVariantToProduct(response);
            });
    }

    /**
     * Update the variant title
     *
     * @param variant
     * @param event
     */
    updateVariantTitle(variant: InventoryVariant, event): void
    {
        // Update the title on the variant
        variant.name = event.target.value;

        // Update the variant on the server
        this._inventoryService.updateVariant(variant.id, variant)
            .pipe(debounceTime(300))
            .subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Delete the variant
     *
     * @param variant
     */
    deleteVariant(variant: InventoryVariant): void
    {
        // Delete the variant from the server
        this._inventoryService.deleteVariant(variant.id).subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Add variant to the product
     *
     * @param variant
     */
    addVariantToProduct(variant: InventoryVariant): void
    {

        // Add the variant
        this.selectedProduct.variants.unshift(variant);

        // Update the selected product form
        this.selectedProductForm.get('variants').patchValue(this.selectedProduct.variants);

        this.variants = this.selectedProduct.variants;
        this.filteredVariants = this.selectedProduct.variants;
        
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove variant from the product
     *
     * @param variant
     */
    removeVariantFromProduct(variant: InventoryVariant): void
    {
        // Remove the variant
        this.selectedProduct.variants.splice(this.selectedProduct.variants.findIndex(item => item === variant.id), 1);

        // Update the selected product form
        this.selectedProductForm.get('variants').patchValue(this.selectedProduct.variants);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle product variant
     *
     * @param variant
     * @param change
     */
    toggleProductVariant(variant: InventoryVariant, change: MatCheckboxChange): void
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
        return !!!(inputValue === '' || this.variants.findIndex(variant => variant.name.toLowerCase() === inputValue.toLowerCase()) > -1);
    }

    /**
     * Open variants panel
     */
    openVariantsPanel(variant: InventoryVariant): void
    {

        this.selectedVariant = variant;
        
        if (this.selectedVariant){

            // get index of filteredVariants that have same id with variantId
            let index = this.filteredVariants.findIndex(x => x.id === variant.id);
    
            // get the object of filteredVariantsTag in filteredVariants
            this.filteredVariantsTag = this.filteredVariants[index].productVariantsAvailable;

        } else {
            this.filteredVariantsTag = [];
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
                this.filteredVariantsTag = this.variantsTag;

                // Toggle the edit mode off
                this.variantsTagEditMode = false;
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
     * 
     *  VARIANTS TAG
     * 
     */

    /**
     * Toggle the variants edit mode
     */
     toggleVariantsTagEditMode(): void
     {
         this.variantsTagEditMode = !this.variantsTagEditMode;
     }

    /**
     * Filter variants
     *
     * @param event
     */
     filterVariantsTag(event): void
     {
         // Get the value
         const value = event.target.value.toLowerCase();
 
         // Filter the variants
         this.filteredVariantsTag = this.variantsTag.filter(variantTag => variantTag.value.toLowerCase().includes(value));
     }
 
     /**
      * Filter variants input key down event
      *
      * @param event
      */
     filterVariantsTagInputKeyDown(event): void
     {
         // Return if the pressed key is not 'Enter'
         if ( event.key !== 'Enter' )
         {
             return;
         }
 
         // If there is no variant available...
         if ( this.filteredVariantsTag.length === 0 )
         {
             // Create the variant
             this.createVariantTag(event.target.value);
 
             // Clear the input
             event.target.value = '';
 
             // Return
             return;
         }
 
         // If there is a variant...
         const variantTag = this.filteredVariantsTag[0];
         const isVariantTagApplied = this.selectedProduct.variantsTag.find(id => id === variantTag.id);
 
         // If the found variant is already applied to the product...
         if ( isVariantTagApplied )
         {
             // Remove the variant from the product
             this.removeVariantTagFromProduct(variantTag);
         }
         else
         {
             // Otherwise add the variant to the product
             let variantId
             this.addVariantTagToProduct(variantTag, variantId);
         }
     }

    /**
     * Create a new variant
     *
     * @param value
     */
     createVariantTag(value: string): void
     {
        const variant = {
             value
         };
         
         // Create variant on the server
         this._inventoryService.createVariantTag(variant)
             .subscribe((response) => { 
                 // Add the variant to the product
                 this.addVariantTagToProduct(response,this.selectedVariant.id);
             });
     }
 
     /**
      * Update the variant title
      *
      * @param variant
      * @param event
      */
     updateVariantTitleList(variant: InventoryVariant, event): void
     {
         // Update the title on the variant
         variant.name = event.target.value;
 
         // Update the variant on the server
         this._inventoryService.updateVariant(variant.id, variant)
             .pipe(debounceTime(300))
             .subscribe();
 
         // Mark for check
         this._changeDetectorRef.markForCheck();
     }
 
     /**
      * Delete the variant
      *
      * @param variant
      */
     deleteVariantTag(variant: InventoryVariant): void
     {
         // Delete the variant from the server
         this._inventoryService.deleteVariant(variant.id).subscribe();
 
         // Mark for check
         this._changeDetectorRef.markForCheck();
     }
 
     /**
      * Add variant to the product
      *
      * @param variant
      */
     addVariantTagToProduct(variantTag: InventoryVariantsAvailable, variantId: string): void
     {

        let index = (this.selectedProduct.variants).findIndex(item => item.id === variantId);
        
        if (!this.selectedProduct.variants[index].productVariantsAvailable) {
            this.selectedProduct.variants[index].productVariantsAvailable = [];
        }
        
        // Add the variantTag
        this.selectedProduct.variants[index].productVariantsAvailable.unshift(variantTag);
 
        // Update the selected product form
        this.selectedProductForm.get('variants').patchValue(this.selectedProduct.variants);

        this.variants = this.selectedProduct.variants;
        this.filteredVariants = this.selectedProduct.variants;
        
        // Mark for check
        this._changeDetectorRef.markForCheck();
     }
 
     /**
      * Remove variantTag from the product
      *
      * @param variantTag
      */
     removeVariantTagFromProduct(variantTag: InventoryVariant): void
     {
         // Remove the variantTag
         this.selectedProduct.variants.splice(this.selectedProduct.variants.findIndex(item => item === variantTag.id), 1);
 
         // Update the selected product form
         this.selectedProductForm.get('variants').patchValue(this.selectedProduct.variants);
 
         // Mark for check
         this._changeDetectorRef.markForCheck();
     }

    /**
     * Toggle product variantTag
     *
     * @param variantTag
     * @param change
     */
     toggleProductVariantTag(variantTag: InventoryVariant, change: MatCheckboxChange): void
     {
         if ( change.checked )
         {
             this.addVariantToProduct(variantTag);
         }
         else
         {
             this.removeVariantFromProduct(variantTag);
         }
     }
 
     /**
      * Should the create variantTag button be visible
      *
      * @param inputValue
      */
     shouldShowCreateVariantTagButton(inputValue: string): boolean
     {
         return !!!(inputValue === '' || this.variantsTag.findIndex(variantTag => variantTag.value.toLowerCase() === inputValue.toLowerCase()) > -1);
     }


    /**
     * 
     * CATEGORY
     * 
     */

    /**
     * Toggle the categories edit mode
     */
     toggleCategoriesEditMode(): void
     {
         this.categoriesEditMode = !this.categoriesEditMode;
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
         this.filteredCategories = this.categories.filter(category => category.name.toLowerCase().includes(value));
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
         if ( this.filteredCategories.length === 0 )
         {
             // Create the category
             this.createCategory(event.target.value);
 
             // Clear the input
             event.target.value = '';
 
             // Return
             return;
         }
 
         // If there is a category...
         const category = this.filteredCategories[0];
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
     createCategory(name: string): void
     {
         const category = {
             name,
         };
 
         // Create category on the server
         this._inventoryService.createCategory(category)
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
     updateCategoryTitle(category: InventoryCategory, event): void
     {
         // Update the title on the category
         category.name = event.target.value;
 
         // Update the category on the server
         this._inventoryService.updateCategory(category.id, category)
             .pipe(debounceTime(300))
             .subscribe();
 
         // Mark for check
         this._changeDetectorRef.markForCheck();
     }
 
     /**
      * Delete the category
      *
      * @param category
      */
     deleteCategory(category: InventoryCategory): void
     {
         // Delete the category from the server
         this._inventoryService.deleteCategory(category.id).subscribe();
 
         // Mark for check
         this._changeDetectorRef.markForCheck();
     }

    /**
     * Add category to the product
     *
     * @param category
     */
     addCategoryToProduct(category: InventoryCategory): void
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
     removeCategoryFromProduct(category: InventoryCategory): void
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
     toggleProductCategory(category: InventoryCategory, change: MatCheckboxChange): void
     {
         if ( change.checked )
         {
             this.addCategoryToProduct(category);
         }
         else
         {
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
         return !!!(inputValue === '' || this.categories.findIndex(category => category.name.toLowerCase() === inputValue.toLowerCase()) > -1);
     }


    /**
     * 
     * IMAGES
     * 
     */

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
    uploadImages(fileList: FileList,imageIndex): Promise<void>
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
            if(!imageIndex.length === true) {
                this.selectedProduct.images.push(reader.result + "");
            } else {
                this.selectedProductForm.get('images').value[this.selectedProductForm.get('currentImageIndex').value] = reader.result + "";
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
     * Remove the image
     */
    removeImage(): void
    {
        const index = this.selectedProductForm.get('currentImageIndex').value;
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
     * 
     *  PRODUCTS
     * 
     */ 

    // this create product check category first before creating them
    initCreateProduct(){
        // get category by name = no-category
        this._inventoryService.getCategories("no-category").subscribe(async (res)=>{

            let _noCategory = res["data"].find(obj => obj.name === "no-category");

            // if there is no category with "no-category" name, create one
            console.log("logs this !!!",_noCategory)

            if (!_noCategory || _noCategory["name"] !== "no-category"){
                await this._inventoryService.createCategory({
                    name: "no-category"
                }).subscribe((res)=>{
                    if (res["status"] !== 201){
                        console.log("an error has occur",res)
                    } else {
                        this.createProduct(res["data"].id);
                    }
                });
            } else {
                this.createProduct(_noCategory.id);
            }
        });
    }


    /**
     * Create product
     */
    createProduct(categoryId): void
    {

        console.log("this problem", categoryId)

        // Create the product
        this._inventoryService.createProduct(categoryId).subscribe(async (newProduct) => {

            // Add Inventory to product
            await this._inventoryService.addInventoryToProduct(newProduct["data"]).subscribe();
            
            // Go to new product
            this.selectedProduct = newProduct["data"];
                                    
            // Set Category to Product 
            this.selectedProduct.categoryId = newProduct["data"].categoryId;

            // Set Price to 0 ... It's default anyway
            this.selectedProduct.price = 0;

            // Set Stock to 1 ... It's default anyway
            this.selectedProduct.stock = 1;

            // Set Stock to 1 ... It's default anyway
            this.selectedProduct.minQuantityForAlarm = -1;

            // Set Image to null ... It's default anyway
            this.selectedProduct.images = [];
            
            // Set filtered variants to empty array
            this.filteredVariants = [];
            
            // Set variants to empty array
            this.variants = [];

            // Set selectedProduct variants to empty array
            this.selectedProduct.variants = [];

            // Update current form with new product data
            this.selectedProductForm.patchValue(newProduct["data"]);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected product using the form data
     */
    updateSelectedProduct(): void
    {
        
        // Get the product object
        const productRaw = this.selectedProductForm.getRawValue();

        // Get Current Store domain
        const currentStoreIndex = (this.stores).findIndex(item => item.id === this._storeService.storeId$)

        // Get
        // let storeFrontDomain = this._apiServer.settings.storeFrontDomain;
        let storeFrontDomain = 'symplified.ai';

        let storeFrontURL = 'https://' + this.stores[currentStoreIndex].domain + '.' + storeFrontDomain;

        // Generate product service (backend) body
        const product = {
            id: productRaw.id,
            categoryId: productRaw.categoryId,
            name: productRaw.name,
            seoName: productRaw.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''),
            seoUrl: storeFrontURL + '/product/name/' + productRaw.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''),
            status: productRaw.status,
            description: productRaw.description,
            productInventories: productRaw.productInventories,
            storeId: productRaw.storeId,
            allowOutOfStockPurchases: productRaw.allowOutOfStockPurchases,
            trackQuantity: productRaw.trackQuantity,
            minQuantityForAlarm: productRaw.minQuantityForAlarm
        }

        // Remove the currentImageIndex field
        delete productRaw.currentImageIndex;

        console.log("updateSelectedProduct(): ",product)
        

        // Update the product on the server
        this._inventoryService.updateProduct(productRaw.id, product).subscribe(() => {

            // Show a success message
            this.showFlashMessage('success');
        });


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
                this._inventoryService.deleteProduct(product.id).subscribe(() => {

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
            var result = (a[property].toLowerCase() < b[property].toLowerCase()) ? -1 : (a[property].toLowerCase() > b[property].toLowerCase()) ? 1 : 0;
            return result * sortOrder;
        }
    }

    changeStatus(something){
        console.log("",something);
    }
}
