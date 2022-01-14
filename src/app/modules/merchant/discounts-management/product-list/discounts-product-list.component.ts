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
import { MatDialog } from '@angular/material/dialog';
import { CreateDiscountProductComponent } from '../create-product-discount/create-product-discount.component';
import { Product, ProductCategory, ProductInventory, ProductPagination } from 'app/core/product/inventory.types';
import { InventoryService } from 'app/core/product/inventory.service';
import { DiscountsProductService } from './discountsproduct.service';
import { ApiResponseModel, StoreDiscountProduct } from './discountsproduct.types';

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

    //for create product or category
    isSelectItemOrCategoryCreate : boolean = false;
    selectItemOrCatgeoryCreate : string = '';

    selectedCategoryIdCreate : string;
    checkedCategoriesId : any =[];

    checkedProduct : any =[];//store product id only

    checkedProductInventory: any = [];

    //upon edit category listing
    editSelectedCategory :string = '';
    editModeListing:any = [];


    //product or category 
    isSelectedItemOrCategory: boolean = false;
    selectItemOrCategory : string;

    //select the listing of category
    selectedCategoryId : string;

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
                        if (this.discountName != null)
                            return this._discountService.getByQueryDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, this.discountName, '','ITEM');
                        else    
                            return this._discountService.getByQueryDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '','','ITEM');
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

        this._discountProductService.getDiscountsProduct(discountId)
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
        this.selectItemOrCategory = '';
        this.isSelectedItemOrCategory = false;
        this.storeDiscountProduct =[];
        //to reset any check box related
        this.selectItemOrCatgeoryCreate ='';
        this.isSelectItemOrCategoryCreate = false;
        this.checkedCategoriesId.pop();//empty the array
        this.checkedProduct.pop();
        this.checkedProductInventory.pop();
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
                            const confirmation = this._fuseConfirmationService.open({
                                title  : 'Discount date overlap',
                                message: 'Your discount date range entered overlapping with existing discount date! Please change your date range',
                                actions: {
                                    confirm: {
                                        label: 'Ok'
                                    },
                                    cancel : {
                                        show : false,
                                    }
                                }
                            });
                        }

                });
            }
        });
    }

    updateSelectedDiscount(): void
    {

        // update or create when centering the details category or item

        // since the storediscounttier id exist meaning that we just need to update it
        if (this.storeDiscountTierId !== null){
            this.updateSelectedDiscountTier(this.selectedDiscountForm.get('storeDiscountTierList')['controls'][0]);                         //since the discount tier we only have 1, so just get the form aarray from index 0
        } else {
            //there are two condition inside here , if there is no storeDiscountTierId, need to handle case either the user key all the values in form or leaving it empty         
            if(this.selectedDiscountForm.get('storeDiscountTierList')['controls'][0]['controls']['startTotalSalesAmount'].value !== null &&
                this.selectedDiscountForm.get('storeDiscountTierList')['controls'][0]['controls']['discountAmount'].value !== null &&
                this.selectedDiscountForm.get('storeDiscountTierList')['controls'][0]['controls']['calculationType'].value !==null
            ){
           
                this.insertTierToDiscount(this.selectedDiscountForm.get('storeDiscountTierList')['controls'][0]);

            }else{
        
            (this.selectedDiscountForm.get('storeDiscountTierList') as FormArray).clear();                          //SET AS ARRAY(0)
            }
        }
       
        // Update the  main discount on the server
        this._discountService.updateDiscount(this.selectedDiscountForm.value.id, this.selectedDiscountForm.value).subscribe(() => {
            // Show a success message
            this.showFlashMessage('success');
        }, error => {
            console.log(error);

                if (error.status === 417) {
                    // Open the confirmation dialog
                    const confirmation = this._fuseConfirmationService.open({
                        title  : 'Discount date overlap',
                        message: 'Your discount date range entered overlapping with existing discount date! Please change your date range',
                        actions: {
                            confirm: {
                                label: 'Ok'
                            },
                            cancel : {
                                show : false,
                            }
                        }
                    });
                }
            }
        );

 
    }

    createStoreProductDiscount(selectItemOrCatgeoryCreate){

        console.log('type',selectItemOrCatgeoryCreate);
        console.log('checkedCategoriesId',this.checkedCategoriesId);
        console.log('checkedProduct',this.checkedProduct);
        console.log('checkedProductInventory',this.checkedProductInventory);
        
        // return;

        if(selectItemOrCatgeoryCreate === 'CATEGORY'){
            
            this.checkedCategoriesId
            .forEach((catId)=>{
    
                    let payloadProductDiscount ={
                        storeDiscountId:this.selectedDiscountForm.value.id,
                        categoryId:catId
    
                    }                
    
                    this._discountProductService.createProductDiscount(this.selectedDiscountForm.value.id,payloadProductDiscount).
                    subscribe((response) => {
    
                        this.storeDiscountProduct.unshift(response["data"]);
       
                        //remove the check category
                        this.checkedCategoriesId.splice(this.checkedCategoriesId.findIndex(tagId => tagId === response["data"].categoryId), 1);
    
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }
                    , error => {
                        console.log(error);
    
                            if (error.status === 409) {
                                // Open the confirmation dialog
                                const confirmation = this._fuseConfirmationService.open({
                                    title  : 'Category already exist',
                                    message: 'Please choose other category',
                                    actions: {
                                        confirm: {
                                            label: 'Ok'
                                        },
                                        cancel : {
                                            show : false,
                                        }
                                    }
                                });
                            }
    
                    }
                    )
                }
            )

        }
        else if(selectItemOrCatgeoryCreate === 'ITEM'){

        }
   

        
        this._changeDetectorRef.markForCheck();   

    }

    /**
     * Delete the selected discount using the form data
     */
    deleteSelectedDiscount(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete discount',
            message: 'Are you sure you want to remove this discount? This action cannot be undone!',
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

    insertTierToDiscount(discountTier){

         // Create the discount
         this._discountService.createDiscountTier(this.selectedDiscount.id,discountTier.value).subscribe((response) => {
            
            this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;

            // since backend give full discount tier list .. (not the only one that have been created only)
            this.storeDiscountTierList.clear();

            response["data"].forEach(item => {
                this.storeDiscountTierList.push(this._formBuilder.group(item));
            });



            // Mark for check
            this._changeDetectorRef.markForCheck();
        }, error => {
            console.log(error);

                if (error.status === 417) {
                    // Open the confirmation dialog
                    const confirmation = this._fuseConfirmationService.open({
                        title  : 'Minimum subtotal overlap',
                        message: 'Your minimum subtotal entered overlapping with existing amount! Please change your minimum subtotal',
                        actions: {
                            confirm: {
                                label: 'Ok'
                            },
                            cancel : {
                                show : false,
                            }
                        }
                    });
                }
            }
        );
    }

    updateSelectedDiscountTier(discountTier){

        // Update the discount on the server
        this._discountService.updateDiscountTier(discountTier.value.storeDiscountId, discountTier.value).subscribe(() => {
            // Show a success message
            this.showFlashMessage('success');
        }, error => {
            console.log(error);

                if (error.status === 417) {
                    // Open the confirmation dialog
                    const confirmation = this._fuseConfirmationService.open({
                        title  : 'Minimum subtotal overlap',
                        message: 'Your minimum subtotal entered overlapping with existing amount! Please change your minimum subtotal',
                        actions: {
                            confirm: {
                                label: 'Ok'
                            },
                            cancel : {
                                show : false,
                            }
                        }
                    });
                }
            }
        );

    
    }
    

    onEditSelectCategoryList(categryId){
     
        this.editSelectedCategory = categryId;

    }


    checkboxCategories(tagCategoryId, change: MatCheckboxChange): void
    {
        console.log(change);
        if ( change.checked )
        {
            // this.checkedCategoriesId.push(tagCategoryId);     
            this.checkedCategoriesId.unshift(tagCategoryId);
            this._changeDetectorRef.markForCheck();
        }
        else
        {

            this.checkedCategoriesId.splice(this.checkedCategoriesId.findIndex(tagId => tagId === tagCategoryId), 1);
            this._changeDetectorRef.markForCheck();
            
        }
        console.log('CHECK BEFORE SEND TO BACKEND',this.checkedCategoriesId);
    }

    checkboxCategoriesOrProducts(type,tagId, change: MatCheckboxChange): void
    {

        
        if (type === 'ITEM'){

            if ( change.checked )
            {
                //since i just want to make it single selection i will remove any selected product in order
                this.checkedProduct.pop();
                // this.checkedCategoriesId.push(tagCategoryId);     
                this.checkedProduct.unshift(tagId);

                //upon checked the product we will call the service for get product id in order to get the product inventory
                this._inventoryService.getProductById(this.checkedProduct[0])
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((product:Product) => {
    
                    // Update the products
                    // this.products = products;
                    this.filteredProductInventories = product.productInventories;

                    this.productInventories =product.productInventories;
                    console.log('product',product);
                    console.log('this.productInventories',this.productInventories);
    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
                // this._inventoryService.getProductById(this.checkedProduct[0])
            }
            else
            {
                this.checkedProduct.splice(this.checkedProduct.findIndex(elementId => elementId === tagId), 1);
            }

        } else if(type === 'INVENTORIES'){

            if ( change.checked )
            {
            
                // this.checkedCategoriesId.push(tagCategoryId);     
                this.checkedProductInventory.unshift(tagId);
                console.log('this.checkedProductInventory',this.checkedProductInventory);
                
            }
            else
            {
                this.checkedProductInventory.splice(this.checkedProductInventory.findIndex(elementId => elementId === tagId), 1);
            }


        }

        console.log('Products will SEND TO BACKEND',this.checkedProduct);
        console.log('inventory will SEND TO BACKEND',this.checkedProductInventory);

        
        this._changeDetectorRef.markForCheck();
    }

    uponCreateSelectType(value){

        this.selectItemOrCatgeoryCreate = value;        

        if (value === 'CATEGORY'){
            this.isSelectItemOrCategoryCreate = true;
            this.checkedCategoriesId.pop();//empty the array for any selected checkbox previous
            this.checkedProduct.pop();
            this.checkedProductInventory.pop();

        }
         
        if(value === 'ITEM'){
            this.isSelectItemOrCategoryCreate = true;
            this.checkedCategoriesId.pop();//empty the array
            this.checkedProduct.pop();
            this.checkedProductInventory.pop();

        }

    }

    getCategoryName(categoryId: string) {
        return this.filteredProductCategories.find(cat => cat.id === categoryId).name;
      }

    // Edit discount product
    editStoreProductDiscount(productDiscount){
        
        let categoryPayload = {
            
                id: productDiscount.id,
                storeDiscountId: productDiscount.storeDiscountId,
                categoryId: this.editSelectedCategory
            
        }

        this._discountProductService.updateProductDiscount(productDiscount.storeDiscountId,categoryPayload).
                subscribe((response) => {

                    // this.storeDiscountProduct.unshift(response["data"]);
   
                    // //remove the check category
                    // this.checkedCategoriesId.splice(this.checkedCategoriesId.findIndex(tagId => tagId === response["data"].categoryId), 1);

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        
    }

    //Delete discount product
    deleteStoreProductDiscount(productDiscount){
        console.log("deleteStoreProductDiscount",productDiscount);

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete discount',
            message: 'Are you sure you want to remove this discount? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });


        //after user choose either delete or cancel
        confirmation.afterClosed().subscribe((result) => {

            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {
                // Delete the store discount product from server //param (main discount id, product discount id)
                this._discountProductService.deleteDiscountProduct(this.selectedDiscount.id, productDiscount.id).subscribe(() => {
              
                    this.storeDiscountProduct.splice(this.storeDiscountProduct.findIndex(x => x.id === productDiscount.id), 1);
              
                    this._changeDetectorRef.markForCheck();

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

    filterProductsOrCategories(type,event): void
    {
        //Expected type : CATEGORY / ITEM / INVENTORY

        // Get the value
        const value = event.target.value.toLowerCase();

        if (type === 'CATEGORY'){
            // Filter the categories
            this.filteredProductCategories = this.productCategories$.filter(category => category.name.toLowerCase().includes(value));
        }
        else if (type === 'ITEM'){
            //filter the product but only have 20 listing only
            this.filteredProduct = this.products.filter(product => product.name.toLowerCase().includes(value)); 
            console.log('this.products',this.products);
            
            console.log("this.filteredProduct",this.filteredProduct);

            // Subscribe to search input field value changes
            if(this.filteredProduct.length ===0){
            
                fromEvent(event.target,'keyup')
                    .pipe(
                        takeUntil(this._unsubscribeAll),
                        debounceTime(300),
                        switchMap((event:any) => {
                                    
                            return this._inventoryService.getProducts(0, 10, 'name', 'asc', event.target.value)
                        }),
                        map(() => {
                            this.isLoading = false;
                        })
                    )
                .subscribe();
            }
            
            
    
        }else{
            // 
            this.filteredProductInventories = this.productInventories.filter(inventories => inventories.sku.toLowerCase().includes(value));
            console.log('filter iventory',this.filteredProductInventories);
             
        }
    }

    filterProductsOrCategoriesInputKeyDown(type,event): void
    {
            // Return if the pressed key is not 'Enter'
            if ( event.key !== 'Enter' )
            {
                return;
            }

            // If there is no category available...
            if ( this.filteredProductCategories.length === 0 )
            {                
                // Clear the input
                event.target.value = '';
                return;
            }
            
        // If there is a tag...
        const tag = this.checkedCategoriesId;
        const isTagApplied = this.checkedCategoriesId.find(catId => catId === tag);
          // If the found tag is already applied to the product...
          if ( isTagApplied )
          {
              // Remove the tag from the product
              this.checkedCategoriesId.splice(this.checkedCategoriesId.findIndex(elementId => elementId === tag), 1);
              this._changeDetectorRef.markForCheck();
            }
          else
          {
              // Otherwise add the tag to the product
              this.checkedCategoriesId.unshift(tag);
              this._changeDetectorRef.markForCheck();
          }
    
    }


}
