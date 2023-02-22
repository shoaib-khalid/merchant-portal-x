import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { forkJoin, lastValueFrom, merge, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatDialog } from '@angular/material/dialog';
import { InventoryService } from 'app/core/product/inventory.service';
import { ApiResponseModel, Product, ProductCategory, ProductCategoryPagination, ProductInventory, ProductPagination } from 'app/core/product/inventory.types';
import { Store, StoreAsset } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { SelectionModel } from '@angular/cdk/collections';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import { AddOpenItemComponent } from '../add-open-item/add-open-item.component';
import { OpenItemService } from './open-item.service';

@Component({
    selector       : 'open-item',
    templateUrl    : './open-item.component.html',
    styles         : [
        /* language=SCSS */
        `
            .item-grid {
                grid-template-columns: 48px 18px 36px auto 74px 40px;

                @screen sm {
                    grid-template-columns: 52px 18px 78px auto 168px 108px;
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
export class OpenItemComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    store: Store;

    items$: Observable<Product[]>;
    selectedProduct: Product | null = null;
    productForm: FormGroup;
    itemList: Product[];
    pagination: ProductPagination;

    // Image part    
    image: {
        preview?: string | ArrayBuffer,
        file?: File,
        isThumbnail?: boolean,
        newAsset?: boolean,
        assetId?: string
    }

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: FormControl = new FormControl();

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    selection = new SelectionModel<Product>(true, []);
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
        private _openItemService: OpenItemService,
        private _storesService: StoresService,
        public _dialog: MatDialog,
        private _inventoryService: InventoryService
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
        this.productForm = this._formBuilder.group({
            id                    : [''],
            name                  : ['', [Validators.required]],
            thumbnailUrl          : [''],
            status                : ['']
        });

        this._storesService.store$
            .subscribe((response) => {
                this.store = response;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the items
        this.items$ = this._openItemService.openItems$;

        this.items$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((items: Product[]) => {
                this.itemList = items;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            })

        // Get the pagination
        this._openItemService.openItemsPagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: ProductPagination) => {

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
                    return this._openItemService.getOpenItems({ page: 0, pageSize: 100, sortByCol: 'sequenceNumber', sortingOrder: 'ASC', 
                        status: 'ACTIVE,INACTIVE,OUTOFSTOCK', name: query, showAllPrice: true,
                        isCustomPrice: true})
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();

        // Logo & Banner
        // this.files = [
        //     { 
        //         type: "logo", 
        //         fileSource: null,
        //         assetId: null,
        //         selectedFileName: "", 
        //         selectedFiles: null, 
        //         recommendedImageWidth: "500", 
        //         recommendedImageHeight: "500", 
        //         selectedImageWidth: "", 
        //         selectedImageHeight: "",
        //         toDelete: false
        //     }
        // ];
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
                        return this._openItemService.getOpenItems();
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
    toggleDetails(itemId: string): void
    {
        // Set setOrderEnabled to false
        this.setOrderEnabled = false;

        // If the discount is already selected...
        if ( this.selectedProduct && this.selectedProduct.id === itemId )
        {
            // Close the details
            this.closeDetails();
            return;
        }
            
        // Get the item by id
        this._openItemService.getOpenItemById(itemId)
            .subscribe((item) => {
                
                // Set the selected discount
                this.selectedProduct = item;
                
                // Fill the form
                this.productForm.patchValue(item);
                
                if (item.thumbnailUrl) {
                    this.image = {
                        preview: item.thumbnailUrl,
                        file: null,
                        isThumbnail: true,
                        newAsset: false,
                        assetId: item.productAssets.find(asset => asset.url === item.thumbnailUrl).id
                    }
                }
                else {
                    this.image = {
                        preview: null,
                        file: null,
                        isThumbnail: false,
                        newAsset: false,
                        assetId: null
                    }
                }
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
        });

    }

    /**
     * Create category
     */
    createOpenItem(): void
    {
        this.setOrderEnabled = false;

        let categoriesLimit = this.pagination.length;
        
        if (categoriesLimit >= 100) {            
            // Open the confirmation dialog
            const confirmation = this._fuseConfirmationService.open({
                title   : "Open Item Limit",
                message : "Your Open Item creation has reached it's limit of 100!",
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

            this.closeDetails();

            const dialogRef = this._dialog.open(AddOpenItemComponent, { disableClose: true });
            dialogRef.afterClosed().subscribe(result => {
                
                if (result.status === true) {

                    const biggestSeq = Math.max(...this.itemList.map(x => x.sequenceNumber))

                    const newProductBody = {
                        name: result.value.name ,
                        description: null,
                        categoryId: null,
                        status: result.value.status,
                        trackQuantity: false,
                        allowOutOfStockPurchases: true,
                        minQuantityForAlarm: -1,
                        packingSize: "S",
                        isVariants: false,
                        isPackage: false,
                        isBulkItem: false,
                        vehicleType: "MOTORCYCLE",
                        isNoteOptional: true,
                        customNote: "",
                        hasAddOn: false,
                        seoName: result.value.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''),
                        seoUrl: 'https://' + this.store.domain + "/product/" + result.value.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''),
                        storeId: this.store.id,
                        isCustomPrice: true,
                        sequenceNumber: biggestSeq > -1 ? biggestSeq + 1 : 1
                    }

                    let itemId = '';
                    
                    // Create the product
                    this._openItemService.createOpenItem(newProductBody)
                    .pipe(
                        switchMap((productResponse: Product) => {

                            itemId = productResponse.id;

                            const invBody = {
                                itemCode: productResponse.id + "aa",
                                price: 0,
                                compareAtprice: 0,
                                quantity: 0,
                                sku: productResponse.name.trim().toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''),
                                dineInPrice: 0
                            };

                            return this._openItemService.addInventoryToOpenItem(productResponse, invBody)
                        }),
                        switchMap((inventoryResponse: ProductInventory) => {
                            if (result.value.imagefiles.length > 0) {
                                const formData = new FormData();
                                formData.append("file", result.value.imagefiles[0]);
            
                                return this._openItemService.addOpenItemAssets(inventoryResponse.productId, formData, { isThumbnail: true, itemCode: inventoryResponse.itemCode }, 
                                    null, null)
                            }
                            else    
                                return of([])
                        })
                    )
                    .subscribe(() => {
                        // Scroll newly created category into view
                        setTimeout(() => {

                            let index = this.itemList.findIndex(item => item.id === itemId);
                            
                            if (index > -1) {
                                const element = this._document.getElementById(`cat-${index}`) as HTMLInputElement;
                                element.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'nearest', 
                                    inline: 'start'
                                });
                            }
                        }, 300);
                    })
                }
            });
        }        
    }

    /**
     * Update the selected category using the form data
     */
    updateOpenItem(): void
    {
        if (this.productForm.invalid || this.selectedProduct === null){
            return;
        }

        let { productAssets, productInventories, productReviews, productVariants, thumbnailUrl, ...productToUpdate} = this.selectedProduct;
        // '+' is used to convert from string to number type
        // productToUpdate.sequenceNumber = +value.target.value;
        productToUpdate.name = this.productForm.get('name').value;
        productToUpdate.status = this.productForm.get('status').value;

        // Update the category on the server
        this._openItemService.updateOpenItem(this.selectedProduct.id, productToUpdate)
            .pipe(
                switchMap((productResponse: Product) => {

                    const invBody = {
                        itemCode: productResponse.id + "aa",
                        price: 0,
                        compareAtprice: 0,
                        quantity: 0,
                        // sku: productResponse.name.trim().toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''),
                        dineInPrice: 0
                    };

                    return this._openItemService.updateInventoryOpenItem(this.selectedProduct.id, productInventories[0].itemCode, invBody)
                }),
                debounceTime(300)
                )
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

        // Update product images
        if (this.image.assetId && this.image.file != null) {
            const formData = new FormData();
            formData.append("file", this.image.file);

            this._openItemService.deleteOpenItemAssets(this.selectedProduct.id, this.image.assetId)
            .pipe(
                switchMap(() => this._openItemService.addOpenItemAssets(this.selectedProduct.id, formData, { isThumbnail: true, itemCode: productInventories[0].itemCode }, 
                    null, null))
            ).subscribe()

        }
        // Create
        else if (this.image.assetId === null && this.image.newAsset && this.image.file) {
            const formData = new FormData();
            formData.append("file", this.image.file);

            this._openItemService.addOpenItemAssets(this.selectedProduct.id, formData, { isThumbnail: true, itemCode: productInventories[0].itemCode }, 
                null, null).subscribe();
        }
    }

    deleteOpenItem(){

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete Item',
            message: 'This item will be removed permenantly!',
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
                this._openItemService.deleteProduct(this.selectedProduct.id)
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
        this.selectedProduct = null;
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
        const numRows = this.itemList.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.itemList.forEach(row => this.selection.select(row));
    }

    deleteItems() {

        if (this.selection.selected.length > 0) {
            // Open the confirmation dialog
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Delete Selected Items',
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
                    this._openItemService.deleteProductInBulk(this.selection.selected.map(x => x.id))
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

                                    this._openItemService.getOpenItems()
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
        
        moveItemInArray(this.itemList, event.previousIndex, event.currentIndex);
        this.dropUpperLevelCalled = true;
        
        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    async reorderList(toggleValue: boolean) {
        
        if (toggleValue === false && this.dropUpperLevelCalled === true) {

            const updateBody = this.itemList.map((item, index) => {
                return {
                    id: item.id,
                    sequenceNumber: index + 1
                }
            })
            this._openItemService.updateProductSequenceInBulk(updateBody).subscribe()
            
            this.dropUpperLevelCalled = false;
            this.setOrderEnabled = false;

            // Mark for check
            this._changeDetectorRef.markForCheck();
            
        }
    }

    changeImage(fileList: FileList): Promise<void>
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
        
        // call previewImage to assign 'preview' field with image url 
        this.previewImage(file).then((data: string | ArrayBuffer)  => {

            this.image.file = file;
            this.image.preview = data;
            this.image.newAsset = true;

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
}

