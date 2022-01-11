import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSort } from '@angular/material/sort';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Discount, DiscountPagination, StoreDiscountTierList } from 'app/modules/merchant/discounts-management/list/discounts.types';
import { DiscountsService } from 'app/modules/merchant/discounts-management/list/discounts.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateDiscountProductComponent } from '../create-product-discount/create-product-discount.component';
import { Product, ProductCategory, ProductPagination } from 'app/core/product/inventory.types';
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

    //upon edit category listing
    editCategoryList :any;


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
    productCategories: Product[]; 
    filteredProduct: Product[];
    selectedProduct: Product;
 

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
                console.log('CHECK PRODUCTS',products);
      

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
                        if (this.discountName != null)
                            return this._discountService.getDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, this.discountName, '');
                        else    
                            return this._discountService.getDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '', '');

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

            console.log('GETTTTT',response);

    
            // if (response['data'][0] === undefined){

            //     this.selectItemOrCategory = '';

            // }
            // else if(response['data'][0].categoryId){

            //     this.selectItemOrCategory = 'CATEGORY';
            //     this.isSelectedItemOrCategory = true;
            //     this.selectedCategoryId = response['data'][0].categoryId;

            // } else if(response['data'][0].itemCode){

            //     this.selectItemOrCategory = 'ITEM';
                
            // }
            // console.log("checkng",this.selectItemOrCategory);





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

    /**
     * Close the details
     */
    closeDetails(): void
    {
        this.selectedDiscount = null;
        this.selectItemOrCategory = '';
        this.isSelectedItemOrCategory = false;
        this.storeDiscountProduct =[];
    }

    /**
     * 
     *  DISCOUNTS
     * 
     */ 


    /**
     * Create discount
     */
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

    /**
     * Update the selected discount using the form data
     */
    updateSelectedDiscount(): void
    {

        console.log('check form',this.selectedDiscountForm.value);
        // update or create when centering the details category or item
        console.log('CHECKING ::::',this.selectedCategoryId);
        console.log('tetsing',this.selectedDiscountForm.value.id);
    
        // if(this.selectItemOrCategory === 'ITEM'){

        //     const payloadProductDiscount ={
            
        //         storeDiscountId:this.selectedDiscountForm.value.id,
        //         itemCode:this.selectedCategoryId //will chnage this
                
        //     }
        // } else if(this.selectItemOrCategory === 'CATEGORY'){
            
        //     const payloadProductDiscount ={
            
        //         storeDiscountId:this.selectedDiscountForm.value.id,
        //         categoryId:this.selectedCategoryId
                
        //     }


        // }


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

    //create store dicount product
    createStoreProductDiscount(){
   
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

        // this.checkedCategoriesId.pop();//empty the array back
        // console.log('this.checkedCategoriesId',this.checkedCategoriesId);
        
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

        // let discountTier: StoreDiscountTierList = {
        //     calculationType: this.calculationType,
        //     discountAmount: this.discountAmount,
        //     startTotalSalesAmount: this.startTotalSalesAmount,
        // }

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

    deleteSelectedDiscountTier(discountTierId: string): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete discount tier',
            message: 'Are you sure you want to remove this discount tier? This action cannot be undone!',
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

                // Delete the discount on the server
                this._discountService.deleteDiscountTier(this.selectedDiscount.id, discountTierId).subscribe(() => {
                    this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;

                    let index = (this.storeDiscountTierList.value.findIndex(x => x.id === discountTierId));

                    // remove from discount tier list
                    if (index > -1) {
                        this.storeDiscountTierList.removeAt(index);
                    }

                    // console.log("this.storeDiscountTierList.value", this.storeDiscountTierList.value);
                    // this.storeDiscountTierList. patchValue(this.storeDiscountTierList.value);

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            }
        });
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
    
    validateDiscountTier(type, value){
        if (type === 'startTotalSalesAmount') {
            this.startTotalSalesAmount = value;
        }
        // if (type === 'endTotalSalesAmount') {
        //     this.endTotalSalesAmount = value;
        // }
        if (type === 'discountAmount') {
            this.discountAmount = value;
        }
        if (type === 'calculationType') {
            this.calculationType = value;
        }
    }

    uponSelectItemOrCategory(value){

        if (value === 'CATEGORY'){
            this.isSelectedItemOrCategory = true;
            // this.filteredProductCategories = this.productCategories$.filter(category => category.name.toLowerCase().includes(value));
            this.filteredProductCategories = this.productCategories$.filter(category => category);

        }
         
        if(value === 'ITEM'){
            this.isSelectedItemOrCategory = true;
        }
    }

    // selectCategoryOrItemList(value){
    //     console.log('categoryID',value);
    //     this.selectedCategoryId=value;
    // }

    onEditSelectCategoryList(categryId){
        console.log(categryId);

    }


    checkboxCategories(tagCategoryId, change: MatCheckboxChange): void
    {
        console.log(change);
        if ( change.checked )
        {
            // this.checkedCategoriesId.push(tagCategoryId);     
            this.checkedCategoriesId.unshift(tagCategoryId);
        }
        else
        {

            this.checkedCategoriesId.splice(this.checkedCategoriesId.findIndex(tagId => tagId === tagCategoryId), 1);
            
        }
        console.log('CHECK BEFORE SEND TO BACKEND',this.checkedCategoriesId);
        this._changeDetectorRef.markForCheck();
    }

    uponCreateSelectType(value){

        this.selectItemOrCatgeoryCreate = value;        

        if (value === 'CATEGORY'){
            this.isSelectItemOrCategoryCreate = true;
            this.checkedCategoriesId.pop();//empty the array for any selected checkbox previous
            // this.filteredProductCategories = this.productCategories$.filter(category => category.name.toLowerCase().includes(value));
            this.filteredProductCategories = this.productCategories$.filter(category => category);

        }
         
        if(value === 'ITEM'){
            this.isSelectItemOrCategoryCreate = true;
            this.checkedCategoriesId.pop();//empty the array

        }

    }

    getCategoryName(categoryId: string) {
        return this.filteredProductCategories.find(cat => cat.id === categoryId).name;
      }

    // Edit discount product
    editStoreProductDiscount(productDiscount){
        this.selectedStoreDiscountProduct = productDiscount;
        console.log("checking",this.selectedStoreDiscountProduct);
        console.log('discountProducts.storeCategory.name',productDiscount.storeCategory.name);
        console.log('editCategoryList',this.editCategoryList);
        
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
                // Delete the store discount product from server
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
           this.filteredProductCategories = this.productCategories$.filter(category => category.name.toLowerCase().includes(value));
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
             if ( this.filteredProductCategories.length === 0 )
             {
        
             }
     
             // If there is a category...
             const category = this.filteredProductCategories[0];
             const isCategoryApplied = this.selectedProduct.categoryId;
     
        }

}