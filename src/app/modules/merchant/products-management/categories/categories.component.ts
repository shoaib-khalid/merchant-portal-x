import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatDialog } from '@angular/material/dialog';
import { InventoryService } from 'app/core/product/inventory.service';
import { ProductCategory, ProductCategoryPagination } from 'app/core/product/inventory.types';
import { AddCategoryComponent } from '../add-category/add-category.component';
import { DiscountPagination } from '../../discounts-management/list/discounts.types';
import { Product } from 'app/core/product/inventory.types';

@Component({
    selector       : 'categories',
    templateUrl    : './categories.component.html',
    styles         : [
        /* language=SCSS */
        `
            .categories-grid {
                grid-template-columns: 48px auto 40px;

                @screen sm {
                    grid-template-columns: 48px 112px auto 40px;
                }
            }
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class CategoriesComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    // store id
    storeId: string;

    // products$: Observable<Product[]>;
    categories$: Observable<ProductCategory[]>;
    selectedCategory: ProductCategory | null = null;
    categoriesForm: FormGroup;

    pagination: ProductCategoryPagination;

    // discount tier
    calculationType: string;
    discountAmount: number;
    // endTotalSalesAmount: number;
    startTotalSalesAmount: number;

    // Image part    
    files: any;


    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: FormControl = new FormControl();

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: FormBuilder,
        private _inventoryService: InventoryService,
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
        // Create the selected discount form
        this.categoriesForm = this._formBuilder.group({
            id                    : [''],
            name                  : ['', [Validators.required]],
            thumbnailUrl          : [''],
            parentCategoryId      : [''],
            storeId               : [''], // not used
        });

        // Get the categories
        this.categories$ = this._inventoryService.categories$;


        // Get the pagination
        this._inventoryService.pagination$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((pagination: ProductCategoryPagination) => {

            // Update the pagination
            this.pagination = pagination;

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
                    return this._inventoryService.getByQueryCategories(0, 10, 'name', 'asc', query);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();

        // Logo & Banner
        this.files = [
            { 
                type: "logo", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "500", 
                recommendedImageHeight: "500", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            }
        ];
        
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
                         return this._inventoryService.getByQueryCategories(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction);
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
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle discount details
     *
     * @param discountId
     */
    toggleDetails(categoryId: string): void
    {
        // If the discount is already selected...
        if ( this.selectedCategory && this.selectedCategory.id === categoryId )
        {
            // Close the details
            this.closeDetails();
            return;
        }
            
        // Get the discount by id
        this._inventoryService.getCategoriesById(categoryId)
            .subscribe((categories) => {
                
                // Set the selected discount
                this.selectedCategory = categories;
                
                // Fill the form
                this.categoriesForm.patchValue(categories);
                
                // set category thumbnailUrl
                this.files[0].fileSource = categories.thumbnailUrl;
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
        });

    }

    deleteSelectedCategory(categoryId: string): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete category',
            message: 'Are you sure you want to remove this category? This action cannot be undone!',
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
                this._inventoryService.deleteCategory(categoryId).subscribe(() => {

                    // Close the details
                    this.closeDetails();
                });
            }
        });
    }

    /**
     * Create category
     */
    createCategory(): void
    {
        const dialogRef = this._dialog.open(AddCategoryComponent, { disableClose: true });
        dialogRef.afterClosed().subscribe(result => {
            let category = {
                name:result.name,
                storeId: this.storeId$,
                parentCategoryId: null,
                thumbnailUrl:null,
            };
            const formData = new FormData();
            formData.append("file", result.imagefiles[0]);
    
            // Create category on the server
            this._inventoryService.createCategory(category, formData)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((response) => {
                    response["data"]; 
                });            
        });
    }

    /**
     * Update the selected category using the form data
     */
    updateCategory(): void
    {
        let formData = null;
        let fileSource = null;
        if (this.files[0].selectedFiles) {
            // create a new one
            formData = new FormData();
            formData.append('file',this.files[0].selectedFiles[0]);

            // load sourceFile with new data
            fileSource = this.files[0].fileSource;
        }

        let categoryData = this.categoriesForm.getRawValue();

        // Update the category on the server
        this._inventoryService.updateCategory(this.selectedCategory.id, categoryData, formData, fileSource)
            .pipe(debounceTime(300))
            .subscribe(()=>{
                this.showFlashMessage('success');
            });
    }

    deleteCategory(){

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete category',
            message: 'Are you sure you want to disable this category? Current category of this product will be remove permenantly!',
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
                // Delete the category on the server
                this._inventoryService.deleteCategory(this.selectedCategory.id)
                    .pipe(debounceTime(300))
                    .subscribe();
            }
                
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

    }

    /**
     * Close the details
     */
    closeDetails(): void
    {
        this.selectedCategory = null;
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

 /**
     * 
     * @param event 
     */
  selectFiles(fileType,event: any): void {
      
    // find index of object this.files
    let index = this.files.findIndex(preview => preview.type === fileType);

    // set each of the attributes
    this.files[index].fileSource = null;
    this.files[index].selectedFileName = "";
    this.files[index].selectedFiles = event.target.files;
    
    if (this.files[index].selectedFiles && this.files[index].selectedFiles[0]) {
        const numberOfFiles = this.files[index].selectedFiles.length;
        for (let i = 0; i < numberOfFiles; i++) {
        const reader = new FileReader();
        
        reader.onload = (e: any) => {
            
            // set this.files[index].delete to false 
            this.files[index].toDelete = false;

            this.files[index].fileSource = e.target.result;

            var image = new Image();
            image.src = e.target.result;

            image.onload = (imageInfo: any) => {
                this.files[index].selectedImageWidth = imageInfo.path[0].width;
                this.files[index].selectedImageHeight = imageInfo.path[0].height;

                this._changeDetectorRef.markForCheck();
            };

            this._changeDetectorRef.markForCheck();                
        };
        reader.readAsDataURL(this.files[index].selectedFiles[i]);
        this.files[index].selectedFileName = this.files[index].selectedFiles[i].name;
        }
    }
    this._changeDetectorRef.markForCheck();
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
}

