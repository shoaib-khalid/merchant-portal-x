import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef, Output, EventEmitter } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSort } from '@angular/material/sort';
import { fromEvent, merge, Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Discount, DiscountPagination, StoreDiscountTierList } from 'app/modules/merchant/discounts-management/list/discounts.types';
import { DiscountsService } from 'app/modules/merchant/discounts-management/list/discounts.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateDiscountProductComponent } from '../create-product-discount/create-product-discount.component';
import { Product, ProductCategory, ProductInventory, ProductPagination } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { DiscountsProductService } from './discountsproduct.service';
import { ApiResponseModel, StoreDiscountProduct } from './discountsproduct.types';
import { DialogProductListComponent } from '../dialog-product-list/dialog-product-list.component';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';

@Component({
    selector       : 'discounts-product-list',
    templateUrl    : './discounts-product-list.component.html',
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
                    grid-template-columns: 48px 112px auto 180px 180px 180px 96px 72px;
                }
            }
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class DiscountsProductListComponent implements OnInit, AfterViewInit, OnDestroy
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
                console.log('this.pagination',this.pagination);

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
                console.log('THIS OBSERVABLE',this.products);
      

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

            this._discountProductService.getProducts()
            .subscribe((response: ApiResponseModel<Product[]>)=>{
    
                console.log("HELLO:",response.data['content']);
    
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
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    toggleDetails(discountId: string): void
    {
        // If the discount is already selected...
        if ( this.selectedDiscount && this.selectedDiscount.id === discountId )
        {
            // Close the details
            this.closeDetails();
            return;
        }

        this._discountProductService.getByQueryDiscountsProduct(discountId,0,5)
        .subscribe((response) => {

          // Mark for check
          this._changeDetectorRef.markForCheck();

        });


        this._discountProductService.getStoreDiscountProduct(discountId)
        .subscribe((response: ApiResponseModel<StoreDiscountProduct>)=>{

            this.storeDiscountProduct = response.data;

            this._changeDetectorRef.markForCheck();

        }

        )

        // Get the discount by id
        this._discountService.getDiscountById(discountId)
            .subscribe((discount) => {

                // Set the selected discount
                this.selectedDiscount = discount;

                // Fill the form
                this.selectedDiscountForm.patchValue(discount);
            
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
                } else{
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

                    });

           

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    closeDetails(): void
    {
        this.selectedDiscount = null;
        this.storeDiscountProduct =[];
    }

    createDiscount(): void
    {
        const dialogRef = this._dialog.open(CreateDiscountProductComponent, { disableClose: true });
        dialogRef.afterClosed().subscribe(result => {
            if (result.status === true) {
                console.log("result", result)
                // this will remove the item from the object
                const createDiscountBody  = {
                    discountName: result.discountName,
                    discountType: result.discountOn,
                    startDate: result.startDate,
                    startTime: result.startTime,
                    endDate: result.endDate,
                    endTime: result.endTime,
                    isActive: result.isActive,
                    maxDiscountAmount: result.maxDiscountAmount,
                    normalPriceItemOnly: result.normalPriceItemOnly,
                    storeId: this.storeId$
                };
        
                // Create the discount
                this._discountService.createDiscount(createDiscountBody).subscribe(async (newDiscount) => {
                    
                    // Go to new discount
                    this.selectedDiscount = newDiscount["data"];
    
                    // Update current form with new discount data
                    this.selectedDiscountForm.patchValue(newDiscount["data"]);

                    //initialize the form
                    this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;
                    this.storeDiscountTierList.push(this._formBuilder.group(
                        {
                           discountAmount: null,
                            startTotalSalesAmount: null,
                            calculationType:null,
                        }
                    ));
    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }, error => {
                    console.log(error);

                        if (error.status === 417) {
                            // Open the confirmation dialog
                            this.displayMessage('Discount date overlap','Your discount date range entered overlapping with existing discount date! Please change your date range','Ok',false);

                        }

                });
            }
        });
    }

    updateSelectedDiscount(): void
    {

        this.checkDate();
        if(this.checkdate === true){

            // Update the  main discount on the server
            this._discountService.updateDiscount(this.selectedDiscountForm.value.id, this.selectedDiscountForm.value).subscribe(() => {
                // Show a success message
                this.showFlashMessage('success');
            }, error => {
                console.log(error);

                    if (error.status === 417) {
                        // Open the confirmation dialog
                        this.displayMessage('Discount date overlap','Your discount date range entered overlapping with existing discount date! Please change your date range','Ok',false);

                    }
                }
            );

        } else{

            this.displayMessage('Date/time range incorrect','Please change your date range or time','Ok',false);

        }

 
    }

    /**
     * Delete the selected discount using the form data
     */
    deleteSelectedDiscount(): void
    {

        //check if the there is product disocunt , if yes just show pop up to delete the product level first
        if(this.storeDiscountProduct['content'].length>0){
            
            this.displayMessage('Cannot delete','Delete the selected product first before delete this.','Ok',false);

        } else{

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
                }, error => {

        
                });
            }
        });


        }
  

    }

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

    dialogProductList(): void
    {
        //we pass data in order to use the value in DialogProductListComponent
        const dialogRef = this._dialog.open(
        DialogProductListComponent, 
        {
            width: '90vw',
            maxWidth: '90vw', 
            disableClose: true, 
            data:{discountId:this.selectedDiscountForm.get('id').value} 
        });
     
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

}
