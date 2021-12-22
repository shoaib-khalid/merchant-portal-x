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
import { ProductCategory } from 'app/core/product/inventory.types';
import { AddCategoryComponent } from '../add-category/add-category.component';
import { DiscountPagination } from '../../discounts-management/list/discounts.types';
import { Product } from 'app/core/product/inventory.types';

@Component({
    selector       : 'categories',
    templateUrl    : './categories.component.html',
    styles         : [
        /* language=SCSS */
        `
            .inventory-grid {
                grid-template-columns: 48px 112px auto 40px;

                @screen sm {
                    grid-template-columns: 48px 112px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 48px 112px auto 150px 96px;
                }

                @screen lg {
                    grid-template-columns: 48px auto 500px 96px;
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
            console.log("result>>>>>>",result);
    
            // Create category on the server
            this._inventoryService.createCategory(category,formData)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((response) => {
                    response["data"];
                    console.log('response["data"]',response["data"]);
    
                    
                });            
        });
    }

    /**
     * Update the selected category using the form data
     */
    updateCategory(category: ProductCategory): void
    {
        let formData = new FormData();
        // create a new one
        formData.append('file',this.files[0].selectedFiles[0]);

        // Update the category on the server
        this._inventoryService.updateCategory(category.id, category, formData)
            .pipe(debounceTime(300))
            .subscribe();
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
    
    // console.log("hghghgh", this.files)
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
        // console.log("this.files["+index+"].selectedFiles["+i+"]",this.files[index].selectedFiles[i])
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

