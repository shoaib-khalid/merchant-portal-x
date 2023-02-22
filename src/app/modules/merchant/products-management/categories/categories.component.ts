import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { forkJoin, lastValueFrom, merge, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatDialog } from '@angular/material/dialog';
import { InventoryService } from 'app/core/product/inventory.service';
import { ApiResponseModel, ProductCategory, ProductCategoryPagination } from 'app/core/product/inventory.types';
import { AddCategoryComponent } from '../add-category/add-category.component';
import { Store, StoreAsset } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { SelectionModel } from '@angular/cdk/collections';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';

@Component({
    selector       : 'categories',
    templateUrl    : './categories.component.html',
    styles         : [
        /* language=SCSS */
        `
            .categories-grid {
                grid-template-columns: 52px 18px 36px auto 40px;

                @screen sm {
                    grid-template-columns: 52px 18px 78px auto 108px;
                }
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
    store: Store;

    // products$: Observable<Product[]>;
    categories$: Observable<ProductCategory[]>;
    selectedCategory: ProductCategory | null = null;
    categoriesForm: FormGroup;
    categoriesList: ProductCategory[];
    pagination: ProductCategoryPagination;
    // Image part    
    files: any;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: FormControl = new FormControl();

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    totalCategories: number;

    parentCategoriesOptions: ProductCategory[];
    selection = new SelectionModel<ProductCategory>(true, []);
    setOrderEnabled: boolean = false;
    dropUpperLevelCalled: boolean = false;


    /**
     * Constructor
     */
    constructor(
        @Inject(DOCUMENT) private _document: Document,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: FormBuilder,
        private _inventoryService: InventoryService,
        private _storesService: StoresService,
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

        this.categories$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((categories: ProductCategory[]) => {
            this.categoriesList = categories;

            // Mark for check
            this._changeDetectorRef.markForCheck();
        })

        //Get the vertical code for this store id first then we get the parent categories
        this._storesService.store$
        .pipe(
            map((response) => {
                this.store = response;
                return response.verticalCode;
            }),
            switchMap((storeVerticalCode:string) => this._inventoryService.parentCategories$),
            takeUntil(this._unsubscribeAll)
        )
        .subscribe((categories) => {
            this.parentCategoriesOptions = categories;
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

        // Get the pagination
        this._inventoryService.categoriesPagination$
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
                    return this._inventoryService.getByQueryCategories(0, this.pagination ? this.pagination.size : 30, 'sequenceNumber', 'asc', query);
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
                    id          : 'sequenceNumber',
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
        this._unsubscribeAll.next(null);
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
        // Set setOrderEnabled to false
        this.setOrderEnabled = false;

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
                this._inventoryService.deleteCategory(categoryId).subscribe((resp) => {
                    
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
        this.setOrderEnabled = false;

        let categoriesLimit = this.pagination.length;
        
        if (categoriesLimit >= 30) {            
            // Open the confirmation dialog
            const confirmation = this._fuseConfirmationService.open({
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

                    let biggestSeq = Math.max(...this.categoriesList.map(x => x.sequenceNumber))

                    let categoryBody = {
                        name:result.value.name,
                        storeId: this.storeId$,
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
                            // Scroll newly created category into view
                            setTimeout(() => {

                                let index = this.categoriesList.findIndex(category => category.id === categoryResp.id);
                                
                                if (index > -1) {
                                    const element = this._document.getElementById(`cat-${index}`) as HTMLInputElement;
                                    element.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'nearest', 
                                        inline: 'start'
                                    });
                                    
                                }
                            }, 300);
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
     * Update the selected category using the form data
     */
    updateCategory(): void
    {
        if (this.categoriesForm.invalid){
            return;
        }
        
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
                
                // Set delay before closing the window
                setTimeout(() => {

                    // Close the details
                    this.closeDetails();
        
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }, 1000);
            });
    }

    deleteCategory(){

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete Category',
            message: 'This category will be removed permenantly!',
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
    selectFiles(fileType, event: any): void {
        
        // find index of object this.files
        let index = this.files.findIndex(preview => preview.type === fileType);

        // set each of the attributes
        this.files[index].fileSource = null;
        this.files[index].selectedFileName = "";
        this.files[index].selectedFiles = event.target.files;

        // Return and throw warning dialog if image file size is big
        let maxSize = 1048576;
        var maxSizeInMB = (maxSize / (1024*1024)).toFixed(2);
        
        if (this.files[index].selectedFiles[0].size > maxSize ) {
            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Image Size Limit',
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

    displayStoreLogo(storeAssets: StoreAsset[]) {
        
        let storeAssetsIndex = storeAssets.findIndex(item => item.assetType === 'LogoUrl');
        if (storeAssetsIndex > -1) {
            return storeAssets[storeAssetsIndex].assetUrl;
        } else {
            return 'assets/branding/symplified/logo/symplified.png'
        }
    }
    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.categoriesList.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.categoriesList.forEach(row => this.selection.select(row));
    }

    deleteCategories() {

        if (this.selection.selected.length > 0) {
            // Open the confirmation dialog
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Delete Selected Categories',
                message: 'Are you sure you want to delete categories? This action cannot be undone!',
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
                    this._inventoryService.deleteCategoriesInBulk(this.selection.selected.map(x => x.id))
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
                                    // this._inventoryService.getProducts(), 
                                    this._inventoryService.getByQueryCategories( 0 , this.pagination ? this.pagination.size : 30, 'sequenceNumber', 'asc')
                                ])
                            }
                            else return of(null);
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

    dropUpperLevel(event: CdkDragDrop<string[]>, index?: any) {
        
        moveItemInArray(this.categoriesList, event.previousIndex, event.currentIndex);
        this.dropUpperLevelCalled = true;
        
        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    async reorderList(toggleValue: boolean) {
        
        // Get all categories first, which is 30
        if (toggleValue === true && this.pagination.size !== 30) {
            this._inventoryService.getByQueryCategories( 0, 30, 'sequenceNumber', 'asc').subscribe();
        }

        if (toggleValue === false && this.dropUpperLevelCalled === true) {

            const updateBody = this.categoriesList.map((category, index) => {
                return {
                    id: category.id,
                    sequenceNumber: index + 1
                }
            })
            this._inventoryService.updateCategoryBulk(updateBody).subscribe()
            
            this.dropUpperLevelCalled = false;
            this.setOrderEnabled = false;

            // Mark for check
            this._changeDetectorRef.markForCheck();
            
        }
    }
}

