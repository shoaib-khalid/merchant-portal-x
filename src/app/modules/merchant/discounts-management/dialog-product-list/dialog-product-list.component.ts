import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { InventoryService } from 'app/core/product/inventory.service';
import { Product, ProductCategory, ProductPagination } from 'app/core/product/inventory.types';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { DiscountsProductService } from '../product-list/discountsproduct.service';
import { ApiResponseModel, StoreDiscountProduct, StoreDiscountProductPagination } from '../product-list/discountsproduct.types';

@Component({
  selector: 'dialog-product-list',
  templateUrl: './dialog-product-list.component.html'
})
export class DialogProductListComponent implements OnInit {
  
  @ViewChild('_paginator') private _paginator: MatPaginator;//paginator for product
  @ViewChild('_paginatorDiscountProduct') private _paginatorDiscountProduct: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;

  discountId : string= '';
  isLoading: boolean = false;


 categoriesListing$ : ProductCategory[];
 filteredCategories: ProductCategory[];

 productLists$ :Observable<ApiResponseModel<Product[]>>;

//  products$:Observable<{ pagination: ProductPagination; products: Product[] }>
 products$: Observable<Product[]>;
 _products:Product[];
 filteredProductsOptions: Product[] = [];
 onChangeSelectProductObject : Product[] = [];// to keep object which has been select
 onChangeSelectProductValue : any =[];//to be display on checkbox

 storeDiscountProduct$: Observable<StoreDiscountProduct[]>;
 storeDiscountProduct : StoreDiscountProduct[] = [];

 inputSearchCategory : string ='';
 inputSearchProducts : string = '';

 selectedCategory:string ='';

 productPagination: ProductPagination;
 storeDiscountPagination:StoreDiscountProductPagination;

 //================EDIT SECTION
 editModeDiscountProduct:any = [];
 editDiscountAmount :number;

 private _unsubscribeAll: Subject<any> = new Subject<any>();


  constructor(
    public dialogRef: MatDialogRef<DialogProductListComponent>,
    private _inventoryService: InventoryService ,
    private _discountProductService : DiscountsProductService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _fuseConfirmationService: FuseConfirmationService,
    @Inject(MAT_DIALOG_DATA) public data: MatDialog


  ) { }

  ngOnInit(): void {

    //get value when open matdialotg
    this.discountId = this.data['discountId'];

      // Get the categories
      this._inventoryService.categories$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((categories: ProductCategory[]) => {

          this.categoriesListing$ = categories;
          this.filteredCategories = categories;
          console.log('categories');

          // Mark for check
          this._changeDetectorRef.markForCheck();
      });

      //==================== PRODUCTS =====================

      this.products$ = this._discountProductService.products$;

      // Assign to local products
      this.products$
      .pipe(takeUntil(this._unsubscribeAll))    
      .subscribe((response)=>{
          this._products = response;
          console.log('hihihi',response);

          // remove object for array of object where item.isPackage !== true
          let _filteredProductsOptions = response.filter(item => item.isPackage !== true );

          this.filteredProductsOptions = _filteredProductsOptions;
      });
          
      this._discountProductService.productpagination$
          .pipe(takeUntil(this._unsubscribeAll))
          .subscribe((pagination: ProductPagination) => {

              // Update the pagination
              this.productPagination = pagination;

              // Mark for check
              this._changeDetectorRef.markForCheck();
          });

    //==================== PRODUCT DISCOUNT =====================

        this.storeDiscountProduct$ = this._discountProductService.discounts$;

        // Assign to local products
        this.storeDiscountProduct$
        .pipe(takeUntil(this._unsubscribeAll))    
        .subscribe((response)=>{
            this.storeDiscountProduct = response;
        });
            
        this._discountProductService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: StoreDiscountProductPagination) => {

                // Update the pagination
                this.storeDiscountPagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // this._discountProductService.getByQueryDiscountsProduct(this.discountId,0, 5)
        // .subscribe((response) => {
        //     this.storeDiscountProduct = response['data'].content;
    
        //   // Mark for check
        //   this._changeDetectorRef.markForCheck();

        // });

        // this._discountProductService.pagination$
        // .pipe(takeUntil(this._unsubscribeAll))
        // .subscribe((pagination: StoreDiscountProductPagination) => {

        //     // Update the pagination
        //     console.log('store discount pagination',pagination);
            
        //     this.storeDiscountPagination = pagination;

        //     // Mark for check
        //     this._changeDetectorRef.markForCheck();
        // });

             // Mark for check
        this._changeDetectorRef.markForCheck();


  }

  ngAfterViewInit(): void
  {
      setTimeout(() => {
          if (this._paginator )
          {
    
             this._paginator.page.pipe(
                  switchMap(() => {

                      return this._discountProductService.getByQueryProducts(this._paginator.pageIndex, this._paginator.pageSize, 'name', 'asc');

                    }),
                  map(() => {
                      this.isLoading = false;
                  })
              ).subscribe();
          }
          if (this._paginatorDiscountProduct)
          {
    
             this._paginatorDiscountProduct.page.pipe(
                  switchMap(() => {
                      return this._discountProductService.getByQueryDiscountsProduct(this.discountId, this._paginatorDiscountProduct.pageIndex, this._paginatorDiscountProduct.pageSize);
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


  
  onSelectCategoryList(event){

    this.selectedCategory = event.value;

    if(this.selectedCategory ){
        return this._discountProductService.getByQueryProducts(0, 5, 'name', 'asc','','ACTIVE,INACTIVE',this.selectedCategory).subscribe();
    } else{
        return this._discountProductService.getByQueryProducts(0, 5, 'name', 'asc','','ACTIVE,INACTIVE').subscribe();

    }

   }

   closeDialog(){
     
    this.discountId = '';
    this.dialogRef.close({ status: false });

   }
   
   inputSearchProduct(event){
    // Get the value
    const value = event.target.value.toLowerCase();

    fromEvent(event.target,'keyup')
    .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(500),
        switchMap((event:any) => {
                    
            return this._discountProductService.getByQueryProducts(0, 5, 'name', 'asc', event.target.value)
        }),
        map(() => {
            this.isLoading = false;
        })
    )
    .subscribe();

   }

   addProductDiscount(){

       if (this.onChangeSelectProductValue.length === 0){
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Please select the product',
                message: 'Please select product to add product discount',
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
        else {

            const itemCodesArr = this.onChangeSelectProductObject.map( el=> el.productInventories.map(el2=>el2.itemCode));//[[a,c,g],[d,e],[f]]
            const itemCodes = Array.prototype.concat.apply([],itemCodesArr);//[a,c,g,d,e,f]

            itemCodes
            .forEach((catId)=>{
    
                    let payloadProductDiscount ={
                        storeDiscountId:this.discountId,
                        itemCode:catId,
                        calculationType:'PERCENT',
                        discountAmount:0.00
                    }                
    
                    this._discountProductService.createProductDiscount(this.discountId,payloadProductDiscount).
                    subscribe((response) => {
    
                        // this.storeDiscountProduct.push(response["data"]);
                        // this._discountProductService.getByQueryDiscountsProduct(this.discountId, 0, 5);


                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }
                    , error => {
                        console.log(error);
                    }
                    )
                }
            )
     
            //clear the array after we post the data
            this.onChangeSelectProductValue.length = 0;
            this.onChangeSelectProductObject.length = 0;

            //CALL BACK THE DISCOUNT PRODUCT
            // return this._discountProductService.getByQueryDiscountsProduct(this.discountId, 0, 5);


        }

   }

    //Delete discount product
    deleteStoreProductDiscount(productDiscount){

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
                this._discountProductService.deleteDiscountProduct(this.discountId, productDiscount.id).subscribe(() => {
                
                    // this.storeDiscountProduct.splice(this.storeDiscountProduct.findIndex(x => x.id === productDiscount.id), 1);
   
                
                    this._changeDetectorRef.markForCheck();

                });
            }
        });
    
    }

    // Edit discount product
    editStoreProductDiscount(productDiscount){
    
        console.log('EDIT::::',productDiscount);
        
        let payloadProductDiscount = {
            
                id: productDiscount.id,
                storeDiscountId: productDiscount.storeDiscountId,
                itemCode:productDiscount.itemCode,
                calculationType:'PERCENT',
                discountAmount:this.editDiscountAmount
            
        }

        this._discountProductService.updateProductDiscount(productDiscount.storeDiscountId,payloadProductDiscount).
                subscribe((response) => {

                    console.log("lepas edit:::::",response);
                    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        
    }

    inputEditDiscountAmount(event){

        this.editDiscountAmount =event.target.value;
      
    }

   onChangeSelectProduct(product, change: MatCheckboxChange): void
   {
       console.log(change);
       if ( change.checked )
       {
           this.onChangeSelectProductValue.push(product.id);
           this.onChangeSelectProductObject.push(product);
           this._changeDetectorRef.markForCheck();
       }
       else
       {

           this.onChangeSelectProductValue.splice(this.onChangeSelectProductValue.findIndex(el => el  === product.id), 1);
           this.onChangeSelectProductObject.splice(this.onChangeSelectProductObject.findIndex(el => el.id  === product.id), 1);

           this._changeDetectorRef.markForCheck();
           
       }
       console.log('CHECK BEFORE SEND TO BACKEND',this.onChangeSelectProductValue);
       console.log('onChangeSelectProductObject,',this.onChangeSelectProductObject);       
       
   }


}
