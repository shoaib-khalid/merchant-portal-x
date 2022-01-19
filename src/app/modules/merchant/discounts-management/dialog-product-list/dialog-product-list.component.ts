import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { InventoryService } from 'app/core/product/inventory.service';
import { Product, ProductCategory, ProductPagination } from 'app/core/product/inventory.types';
import { merge, Observable, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { DiscountsProductService } from '../product-list/discountsproduct.service';
import { ApiResponseModel, StoreDiscountProduct } from '../product-list/discountsproduct.types';

@Component({
  selector: 'dialog-product-list',
  templateUrl: './dialog-product-list.component.html'
})
export class DialogProductListComponent implements OnInit {
  
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
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

 storeDiscountProduct : StoreDiscountProduct[] = [];

 inputSearchCategory : string ='';
 inputSearchProducts : string = '';

 selectedCategory:string ='';

 pagination: ProductPagination;

 private _unsubscribeAll: Subject<any> = new Subject<any>();


  constructor(
    public dialogRef: MatDialogRef<DialogProductListComponent>,
    private _inventoryService: InventoryService ,
    private _discountProductService : DiscountsProductService,
    private _changeDetectorRef: ChangeDetectorRef,
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

      // this._discountProductService.getProducts()
      // .subscribe((response: ApiResponseModel<Product[]>)=>{

     
      //     this.productLists$ = response.data['content'];
      //     console.log('this.productLists$',response);
      //     let pagination = {
      //       length: response.data['totalElements'],
      //       size: response.data['size'],
      //       page: response.data['number'],
      //       lastPage: response.data['totalPages'],
      //       startIndex: response.data['pageable'].offset,
      //       endIndex: response.data['pageable'].offset + response.data['numberOfElements'] - 1
      //   }
      //   // let _pagination = { length: 0, size: 0, page: 0, lastPage: 0, startIndex: 0, endIndex: 0 };
      //   this.pagination=pagination;

      //     this._changeDetectorRef.markForCheck();

      // });

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
          
      this._discountProductService.pagination$
          .pipe(takeUntil(this._unsubscribeAll))
          .subscribe((pagination: ProductPagination) => {

              // Update the pagination
              this.pagination = pagination;

              // Mark for check
              this._changeDetectorRef.markForCheck();
          });
    
        //get product discount listing
        this._discountProductService.getDiscountsProduct(this.discountId)
        .subscribe((response) => {
            this.storeDiscountProduct = response['data'];
    
          // Mark for check
          this._changeDetectorRef.markForCheck();

        });

             // Mark for check
        this._changeDetectorRef.markForCheck();


  }

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
                      // this.closeDetails();
                  });

              merge(this._sort.sortChange, this._paginator.page).pipe(
                  switchMap(() => {
                      // this.closeDetails();                        
                      this.isLoading = true;
                      // if (this.inputSearchProducts != null)
                      // return this._inventoryService.getProducts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction);
                      // else    
                      // return this._inventoryService.getProducts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction);
                      return this._discountProductService.getByQueryProducts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction);

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


  
  onSelectCategoryList(categoryId){
     
    this.selectedCategory = categoryId;
    console.log('selectedCategory',this.selectedCategory);

}


  
}
