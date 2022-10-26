import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef, Output, EventEmitter } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSort } from '@angular/material/sort';
import { fromEvent, merge, Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Discount, DiscountPagination, StoreDiscountTierList } from 'app/modules/merchant/discounts-management/order-discount/order-discount-list/order-discount-list.types';
import { DiscountsService } from 'app/modules/merchant/discounts-management/order-discount/order-discount-list/order-discount-list.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateProductDiscountDialogComponent } from '../create-product-discount/create-product-discount.component';
import { Product, ProductCategory, ProductInventory, ProductPagination } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { DiscountsProductService } from './product-discount-list.service';
import { StoreDiscountProduct } from './product-discount-list.types';
import { ProductListDialogComponent } from '../product-list-dialog/product-list-dialog.component';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { EditProductDiscountDialogComponent } from '../edit-product-discount/edit-product-discount.component';

@Component({
    selector       : 'product-discount-list',
    templateUrl    : './product-discount-list.component.html',
    styles         : [
        /* language=SCSS */
        `
            .product-discount-grid {
                grid-template-columns: 72px auto 40px;

                @screen sm {
                    grid-template-columns: 20px 112px auto 72px;
                }

                @screen lg {
                    grid-template-columns: 20px 112px auto 180px 180px 180px 72px;
                }
            }
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class ProductDiscountListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    // discount
    discounts$: Observable<Discount[]>;
    selectedDiscount: Discount | null = null;
    selectedDiscountForm: FormGroup;
    storeDiscountTierList: FormArray;
    storeDiscountTierListValueEditMode:any = [];

    // store discount product
    storeDiscountProduct : StoreDiscountProduct[] = [];
    _storeDiscountProduct : StoreDiscountProduct[] = [];
    selectedStoreDiscountProduct : StoreDiscountProduct;


    pagination: DiscountPagination;

    // discount tier
    calculationType: string;
    discountAmount: number;
    // endTotalSalesAmount: number;
    startTotalSalesAmount: number;
    storeDiscountTierId: string;

    // product category
    productCategories$: ProductCategory[];
    filteredProductCategories: ProductCategory[];
    selectedProductCategory: ProductCategory;

    //products
    // products$:Observable<Product[]>;
    products$:Observable<{ pagination: ProductPagination; products: Product[] }>
    filteredProduct$: Observable<{ pagination: ProductPagination; products: Product[] }>
    // selectedProduct$: Product;
    
    products: Product[]; 
    filteredProduct: Product[];
    selectedProduct: Product;

    //Product Inventories > item code
    productInventories$ :Observable<ProductInventory[]>;
    productInventories : ProductInventory[];
    filteredProductInventories :ProductInventory[];
    selectedProductInventory : ProductInventory;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: FormControl = new FormControl();

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    discountName: string;

    checkdate = false;
    message: string = "";

    currentScreenSize: string[] = [];
    changeStartTime:string;
    changeEndTime:string;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: FormBuilder,
        private _discountService: DiscountsService,
        private _inventoryService: InventoryService ,
        private _discountProductService:DiscountsProductService ,
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
        // Create the selected discount form
        this.selectedDiscountForm = this._formBuilder.group({
            id               : [''],
            discountName     : ['', [Validators.required]],
            startDate        : [''],
            endDate          : [''],
            startTime        : [''],
            endTime          : [''],
            discountType     : ['ITEM'],
            isActive         : [''],
            maxDiscountAmount: [''],
            normalPriceItemOnly: [''],
            storeId          : [''], // not used
            storeDiscountTierList : this._formBuilder.array([]),
            
        });

        // Get the discounts
        this.discounts$ = this._discountService.discounts$;
        
        // Get the pagination
        this._discountService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: DiscountPagination) => {

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
                    this.discountName = query;                    
                    return this._discountService.getByQueryDiscounts(0, 10, 'startDate', 'asc', query, '','ITEM');
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();
          
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

            // Get the products
            this._inventoryService.products$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((products:Product[]) => {

                // Update the products
                this.products = products;
                this.filteredProduct = products;
      
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

            this._discountProductService.getProducts()
                .subscribe((response)=>{
                    this._changeDetectorRef.markForCheck();
                });

            this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {               

                this.currentScreenSize = matchingAliases;                

                // Mark for check
                this._changeDetectorRef.markForCheck();
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
                    id          : 'startDate',
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

                // Get discounts if sort or page changes
                merge(this._sort.sortChange, this._paginator.page).pipe(
                    switchMap(() => {
                        this.closeDetails();                        
                        this.isLoading = true;
                        if (this.discountName != null){                            
                            return this._discountService.getByQueryDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, this.discountName, '','ITEM');
                        }
                        else    
                        {
                            return this._discountService.getByQueryDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '','','ITEM');
                        }
                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                ).subscribe();
            }
        }, 0);
    }

    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public Method
    // -----------------------------------------------------------------------------------------------------

    // toggleDetails(discountId: string): void
    // {
    //     // If the discount is already selected...
    //     if ( this.selectedDiscount && this.selectedDiscount.id === discountId )
    //     {
    //         // Close the details
    //         this.closeDetails();
    //         return;
    //     }

    //     this._discountProductService.getDiscountProductByDiscountId(discountId,0,5)
    //         .subscribe((response) => {
    //             // Mark for check
    //             this._changeDetectorRef.markForCheck();
    //         });


    //     this._discountProductService.getStoreDiscountProduct(discountId)
    //         .subscribe((response: ApiResponseModel<StoreDiscountProduct>)=>{
    //             this.storeDiscountProduct = response.data;

    //             // Mark for check
    //             this._changeDetectorRef.markForCheck();
    //         });

    //     // Get the discount by id
    //     this._discountService.getDiscountById(discountId)
    //         .subscribe((discount) => {

    //             // Set the selected discount
    //             this.selectedDiscount = discount;

    //             // Fill the form
    //             this.selectedDiscountForm.patchValue(discount);

    //             //set the value time with time selector
    //             this.setValueToTimeSelector(discount);

    //             // clear discount tier form array
    //             (this.selectedDiscountForm.get('storeDiscountTierList') as FormArray).clear();

    //             //to handle logic if storeDiscount tier list exist or not
    //             this.storeDiscountTierId = this.selectedDiscount.storeDiscountTierList[0]?.id?this.selectedDiscount.storeDiscountTierList[0].id:null;
    //             // load discount tier form array with data frombackend
    //             if(this.storeDiscountTierId !== null){
    //                 discount.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
    //                     this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;
    //                     this.storeDiscountTierList.push(this._formBuilder.group(item));
    //                 });
    //             } else {
    //                 this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;
    //                 this.storeDiscountTierList.push(this._formBuilder.group(
    //                     {
    //                        discountAmount: null,
    //                         startTotalSalesAmount: null,
    //                         calculationType:null,
    //                     }
    //                 ));
    //             }

    //             this._discountService.getDiscountsTier(discountId)
    //                 .subscribe((response) => {
    //                     // Mark for check
    //                     this._changeDetectorRef.markForCheck();
    //                 });

    //             // Mark for check
    //             this._changeDetectorRef.markForCheck();
    //         });
    // }

    closeDetails(): void
    {
        this.selectedDiscount = null;
        this.storeDiscountProduct =[];
    }

    createDiscount(): void
    {
        const dialogRef = this._dialog.open(
            CreateProductDiscountDialogComponent, {
                width: this.currentScreenSize.includes('sm') ? '80%' : '100%',
                height: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
                maxWidth: this.currentScreenSize.includes('sm') ? 'auto' : '100vw',  
                maxHeight: this.currentScreenSize.includes('sm') ? 'auto' : '100vh',
                disableClose: true,
                });
        dialogRef.afterClosed().subscribe();
        // dialogRef.afterClosed().subscribe(result => {
        //     if (result.status === true) {
        //         // this will remove the item from the object
        //         const createDiscountBody  = {
        //             discountName: result.discountName,
        //             discountType: result.discountOn,
        //             startDate: result.startDate,
        //             startTime: result.startTime,
        //             endDate: result.endDate,
        //             endTime: result.endTime,
        //             isActive: result.isActive,
        //             maxDiscountAmount: result.maxDiscountAmount,
        //             normalPriceItemOnly: result.normalPriceItemOnly,
        //             storeId: this.storeId$
        //         };
        
        //         // Create the discount
        //         this._discountService.createDiscount(createDiscountBody).subscribe(async (newDiscount) => {
                    
        //             // Go to new discount
        //             this.selectedDiscount = newDiscount["data"];
    
        //             // Update current form with new discount data
        //             this.selectedDiscountForm.patchValue(newDiscount["data"]);

        //             //set value of time with time selector
        //             this.setValueToTimeSelector(newDiscount["data"]);

        //             //initialize the form
        //             this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;
        //             this.storeDiscountTierList.push(this._formBuilder.group(
        //                 {
        //                    discountAmount: null,
        //                     startTotalSalesAmount: null,
        //                     calculationType:null,
        //                 }
        //             ));
    
        //             // Mark for check
        //             this._changeDetectorRef.markForCheck();
        //         }, error => {

        //                 if (error.status === 417) {
        //                     // Open the confirmation dialog
        //                     this.displayMessage('Discount date overlap','Your discount date range entered overlapping with existing discount date! Please change your date range','OK',false);

        //                 }

        //         });
        //     }
        // });
    }

    updateSelectedDiscount(): void
    {
        this.checkDate();
        this.changeTime();
        let sendPayload = [this.selectedDiscountForm.value];
        let toBeSendPayload=sendPayload.
        map((x)=>(
            {
                startTime:this.changeStartTime,
                endTime:this.changeEndTime,
                discountName: x.discountName,
                discountType:x.discountType,
                endDate: x.endDate,
                id: x.id,
                isActive: x.isActive,
                maxDiscountAmount: x.maxDiscountAmount,
                normalPriceItemOnly: x.normalPriceItemOnly,
                startDate: x.startDate,
                storeDiscountTierList: x.storeDiscountTierList,
                storeId: x.storeId,
            }
            ));

        if(this.checkdate === true) {

            // Update the  main discount on the server
            this._discountService.updateDiscount(this.selectedDiscountForm.value.id, toBeSendPayload[0])
                .subscribe(() => {
                    // Show a success message
                    this.showFlashMessage('success');
                }, error => {
                    if (error.status === 417) {
                        // Open the confirmation dialog
                        this.displayMessage('Discount date overlap','Your discount date range entered overlapping with existing discount date! Please change your date range','OK',false);
                    }
                });
        } else{
            this.displayMessage('Date/time range incorrect','Please change your date range or time','OK',false);
        }
    }

    /**
     * Delete the selected discount using the form data
     */
    deleteSelectedDiscount(): void
    {

        //check if the there is product disocunt , if yes just show pop up to delete the product level first
        if (this.storeDiscountProduct['content'].length > 0) {
            this.displayMessage('Cannot delete','Delete the selected product first before delete this.','OK',false);
        } else {
            // Open the confirmation dialog
            const confirmation = this.displayMessage('Delete discount','Are you sure you want to remove this discount? This action cannot be undone!','Delete',true);
           
            // Subscribe to the confirmation dialog closed action
            confirmation.afterClosed().subscribe((result) => {
                // If the confirm button pressed...
                if ( result === 'confirmed' )
                {
                    // Get the discount object
                    const discount = this.selectedDiscountForm.getRawValue();

                    // Delete the discount on the server
                    this._discountService.deleteDiscount(discount.id).subscribe(() => {     
                        // Close the details
                        this.closeDetails();
                    });
                }
            });
        }
    }

    dialogProductList(): void
    {
        //we pass data in order to use the value in DialogProductListComponent
        const dialogRef = this._dialog.open(
        ProductListDialogComponent, 
        {
            width: '90vw',
            maxWidth: '90vw', 
            disableClose: true, 
            data:{discountId:this.selectedDiscountForm.get('id').value} 
        });
     
    }
    
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private Method
    // -----------------------------------------------------------------------------------------------------

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

    checkDate(){
               
           if (this.selectedDiscountForm.get('startDate').value < this.selectedDiscountForm.get('endDate').value){
               this.checkdate = true;
           } else if (this.selectedDiscountForm.get('startDate').value == this.selectedDiscountForm.get('endDate').value) {
               if (this.selectedDiscountForm.get('startTime').value < this.selectedDiscountForm.get('endTime').value) {
                   this.checkdate = true;
               } else {
                   this.checkdate = false;
                  
               }
           }
           
      return this.checkdate; 
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

    displayMessage(getTitle:string,getMessage:string,getLabelConfirm:string,showCancel:boolean):MatDialogRef<FuseConfirmationDialogComponent,any>{

        const confirmation = this._fuseConfirmationService.open({
            title  : getTitle,
            message: getMessage,
            actions: {
                confirm: {
                    label: getLabelConfirm
                },
                cancel : {
                    show : showCancel,
                }
            }
        });
       return confirmation;
    }

    changeTime(){
        //===========Start Time==================
        let pickStartTime =this.selectedDiscountForm.get('startTime').value;
        let _pickStartTime;
    
        if ((<any>pickStartTime).timeAmPm === "PM") {
            _pickStartTime = parseInt((<any>pickStartTime).timeHour) + 12;
        } else {
            _pickStartTime = (<any>pickStartTime).timeHour;
        }
        const changePickStartTime = new Date();
        changePickStartTime.setHours(_pickStartTime,(<any>pickStartTime).timeMinute,0);
        
        this.changeStartTime= String(changePickStartTime.getHours()).padStart(2, "0")+':'+String(changePickStartTime.getMinutes()).padStart(2, "0");    
        
        //==============End time===================
        let pickEndTime = this.selectedDiscountForm.get('endTime').value;
        let _pickEndTime;
    
        if ((<any>pickEndTime).timeAmPm === "PM") {
            _pickEndTime = parseInt((<any>pickEndTime).timeHour) + 12;
        } else {
            _pickEndTime = (<any>pickEndTime).timeHour;
        }
        const changePickEndTime = new Date();
        changePickEndTime.setHours(_pickEndTime,(<any>pickEndTime).timeMinute,0);
        
        this.changeEndTime= String(changePickEndTime.getHours()).padStart(2, "0")+':'+String(changePickEndTime.getMinutes()).padStart(2, "0");  
        
        return;
      
    }

    setValueToTimeSelector(discount){

        //=====================START TIME =====================
        let _pickStartTimeHour = discount.startTime.split(":")[0];
        let _pickStartTimeMinute = discount.startTime.split(":")[1];

        let _pickStartTimeAMPM : 'AM' | 'PM';
        if ((<any>_pickStartTimeHour) > 12) {
            _pickStartTimeAMPM = "PM";
            (<any>_pickStartTimeHour) = (<any>_pickStartTimeHour) - 12;
            (<any>_pickStartTimeHour) = (((<any>_pickStartTimeHour) < 10) ? '0' : '') + _pickStartTimeHour;    

        } else {
            _pickStartTimeAMPM = "AM";
        }
        
        this.selectedDiscountForm.get('startTime').setValue(new TimeSelector(_pickStartTimeHour,_pickStartTimeMinute, _pickStartTimeAMPM));
        
        //=====================/ START TIME =====================

        //=====================END TIME =====================

        let _pickEndTimeHour = discount.endTime.split(":")[0];
        let _pickEndTimeMinute = discount.endTime.split(":")[1];

        let _pickEndTimeAMPM : 'AM' | 'PM';
        if (<any>_pickEndTimeHour > 12) {
            _pickEndTimeAMPM = "PM";
            (<any>_pickEndTimeHour) = (<any>_pickEndTimeHour) - 12;
            (<any>_pickEndTimeHour) = (((<any>_pickEndTimeHour) < 10) ? '0' : '') + _pickEndTimeHour;    

        } else {
            _pickEndTimeAMPM = "AM";
        }
        
        this.selectedDiscountForm.get('endTime').setValue(new TimeSelector(_pickEndTimeHour,_pickEndTimeMinute, _pickEndTimeAMPM));
        //===================== / END TIME =====================
        return;
    }

    openEditPopUp(discountId?:string)    {

        this._discountProductService.getDiscountProductByDiscountId(discountId,0,5)
            .subscribe((response) => {
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });


        this._discountProductService.getStoreDiscountProduct(discountId)
            .subscribe((response)=>{
                this.storeDiscountProduct = response.data;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the discount by id
        this._discountService.getDiscountById(discountId)
            .subscribe((discount) => {

                // Set the selected discount
                this.selectedDiscount = discount;

                // Fill the form
                this.selectedDiscountForm.patchValue(discount);

                //set the value time with time selector
                this.setValueToTimeSelector(discount);

                // clear discount tier form array
                (this.selectedDiscountForm.get('storeDiscountTierList') as FormArray).clear();

                //to handle logic if storeDiscount tier list exist or not
                this.storeDiscountTierId = this.selectedDiscount.storeDiscountTierList[0]?.id?this.selectedDiscount.storeDiscountTierList[0].id:null;
                // load discount tier form array with data frombackend
                if(this.storeDiscountTierId !== null){
                    discount.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
                        this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;
                        this.storeDiscountTierList.push(this._formBuilder.group(item));
                    });
                } else {
                    this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;
                    this.storeDiscountTierList.push(this._formBuilder.group(
                        {
                        discountAmount: null,
                            startTotalSalesAmount: null,
                            calculationType:null,
                        }
                    ));
                }

                this._discountService.getDiscountsTier(discountId)
                    .subscribe((response) => {
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        const dialogRef = this._dialog.open(
            EditProductDiscountDialogComponent, {
                width: this.currentScreenSize.includes('sm') ? '80%' : '100%',
                height: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
                maxWidth: this.currentScreenSize.includes('sm') ? 'auto' : '100vw',  
                maxHeight: this.currentScreenSize.includes('sm') ? 'auto' : '100vh',
                disableClose: true,
                data:{discountId:discountId} 
            });

        dialogRef.afterClosed().subscribe(result => {});
    }

}
