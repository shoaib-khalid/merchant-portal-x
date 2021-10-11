import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { InventoryBrand, InventoryCategory, InventoryPagination, InventoryProduct, InventoryVariant, InventoryVendor } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';

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

    products$: Observable<InventoryProduct[]>;

    // brands: InventoryBrand[];
    categories: InventoryCategory[];
    filteredCategories: InventoryCategory[];
    variants: InventoryVariant[];
    filteredVariants: InventoryVariant[];
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    pagination: InventoryPagination;
    searchInputControl: FormControl = new FormControl();
    selectedProduct: InventoryProduct | null = null;
    selectedProductForm: FormGroup;
    variantsEditMode: boolean = false;
    categoriesEditMode: boolean = false;
    imagesEditMode: boolean = false;
    vendors: InventoryVendor[];
    private _unsubscribeAll: Subject<any> = new Subject<any>();
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
        private _inventoryService: InventoryService
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
            category         : [''],
            name             : ['', [Validators.required]],
            description      : [''],
            variants             : [[]],
            sku              : [''],
            barcode          : [''],
            // brand            : [''],
            vendor           : [''],
            stock            : [''],
            reserved         : [''],
            cost             : [''],
            basePrice        : [''],
            taxPercent       : [''],
            price            : [''],
            weight           : [''],
            thumbnail        : [''],
            images           : [[]],
            currentImageIndex: [0], // Image index that is currently being viewed
            active           : [false]
        });

        // Get the brands
        // this._inventoryService.brands$
        //     .pipe(takeUntil(this._unsubscribeAll))
        //     .subscribe((brands: InventoryBrand[]) => {

        //         // Update the brands
        //         this.brands = brands;

        //         // Mark for check
        //         this._changeDetectorRef.markForCheck();
        //     });

        // Get the categories
        this._inventoryService.categories$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((categories: InventoryCategory[]) => {

                // Update the categories
                this.categories = categories;
                this.filteredCategories = categories;

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

        // Get the products
        this.products$ = this._inventoryService.products$;

        // Get the variants

        // Get the product by id
        // this._inventoryService.getProductById(productId)
        //     .subscribe((product) => {

        //         // Set the selected product
        //         this.selectedProduct = product;

        //         // Fill the form
        //         this.selectedProductForm.patchValue(product);

        //         this.variants = product.variants;
        //         this.filteredVariants = product.variants;

        //         // Mark for check
        //         this._changeDetectorRef.markForCheck();
        //     });

        this._inventoryService.products$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((variants: InventoryProduct[]) => {

                // Update the variants
                this.variants = variants;
                this.filteredVariants = variants;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the vendors
        this._inventoryService.vendors$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((vendors: InventoryVendor[]) => {

                // Update the vendors
                this.vendors = vendors;

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
            .subscribe((product) => {

                // Set the selected product
                this.selectedProduct = product;

                // Fill the form
                this.selectedProductForm.patchValue(product);
                
                // Set to this variants 
                this.variants = product.variants;
                this.filteredVariants = product.variants;

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

        console.log("value",value)
        console.log("event",event)

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
     * 
     * HERE
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
         const isCategoryApplied = this.selectedProduct.category;
 
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
             name
         };
 
         // Create category on the server
         this._inventoryService.createCategory(category)
             .subscribe((response) => {
 
                 // Add the category to the product
                 this.addCategoryToProduct(response);
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
         this.selectedProduct.category = category.id;
 
         // Update the selected product form
         this.selectedProductForm.get('category').patchValue(this.selectedProduct.category);
 
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
         this.selectedProduct.category = null;
 
         // Update the selected product form
         this.selectedProductForm.get('category').patchValue(this.selectedProduct.category);
 
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
     * HERE 2
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
     * Create product
     */
    createProduct(): void
    {
        // Create the product
        this._inventoryService.createProduct().subscribe((newProduct) => {

            // Go to new product
            this.selectedProduct = newProduct;

            // Fill the form
            this.selectedProductForm.patchValue(newProduct);

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
        const product = this.selectedProductForm.getRawValue();

        // Remove the currentImageIndex field
        delete product.currentImageIndex;

        // Update the product on the server
        this._inventoryService.updateProduct(product.id, product).subscribe(() => {

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
}
