import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { fromEvent, Observable, Subject } from 'rxjs';
// import { DiscountsService } from '../order-discount-list/order-discount-list.service';
// import { ApiResponseModel, Discount, StoreDiscountTierList } from '../order-discount-list/order-discount-list.types';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ApiResponseModel, Discount, StoreDiscountTierList } from '../../order-discount/order-discount-list/order-discount-list.types';
import { DiscountsService } from '../../order-discount/order-discount-list/order-discount-list.service';
import { InventoryService } from 'app/core/product/inventory.service';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { Product, ProductCategory, ProductPagination } from 'app/core/product/inventory.types';
import { DiscountsProductService } from '../product-discount-list/product-discount-list.service';
import { StoreDiscountProduct, StoreDiscountProductPagination } from '../product-discount-list/product-discount-list.types';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';



@Component({
  selector: 'app-edit-product-discount',
  templateUrl: './edit-product-discount.component.html',
  styles    :   [`
    /** language=SCSS */
    :host ::ng-deep .mat-horizontal-content-container {
        // max-height: 90vh;
        padding: 0 0px 20px 0px;
        // overflow-y: auto;
    }
    :host ::ng-deep .mat-horizontal-stepper-header-container {
        height: 60px;
    }
    :host ::ng-deep .mat-horizontal-stepper-header {
        height: 60px;
        padding-left: 8px;
        padding-right: 8px;
    }
    .content{
        height:400px;
    }
  `]
})
export class EditProductDiscountDialogComponent implements OnInit {

    productDiscountStepperForm: FormGroup;
    discountId:string;
    selectedDiscount: Discount | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    loadDetails:boolean=false;
    storeDiscountTierList: FormArray;

    flashMessage: 'success' | 'error' | null = null;

    changeStartTime:string;
    changeEndTime:string;

    categoriesListing$ : ProductCategory[];
    filteredCategories: ProductCategory[];

    products$: Observable<Product[]>;
    _products:Product[];
    filteredProductsOptions: Product[] = [];
    productPagination: ProductPagination;

    storeDiscountProduct$: Observable<StoreDiscountProduct[]>;
    storeDiscountProduct : StoreDiscountProduct[] = []; 
    storeDiscountPagination:StoreDiscountProductPagination;

    onChangeSelectProductObject : Product[] = [];// to keep object which has been select
    onChangeSelectProductValue : any =[];//to be display on checkbox

    @ViewChild('_paginator') private _paginator: MatPaginator;//paginator for product
    @ViewChild('_paginatorDiscountProduct') private _paginatorDiscountProduct: MatPaginator;

    isLoading: boolean = false;

    //Search mode
    inputSearchCategory : string ='';
    inputSearchProducts : string = '';
    selectedCategory:string ='';

    //================EDIT SECTION
    editModeDiscountProduct:any = [];
    editDiscountAmount :number;

  constructor(
    public dialogRef: MatDialogRef<EditProductDiscountDialogComponent>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _discountService: DiscountsService,
    private _fuseConfirmationService: FuseConfirmationService,
    private _inventoryService: InventoryService ,
    private _discountProductService : DiscountsProductService,
    // private createOrderDiscount:CreateOrderDiscount,
    @Inject(MAT_DIALOG_DATA) public data: MatDialog
  ) { }

  ngOnInit(): void {

    this.inputSearchProducts = '';

    //get value when open matdialot
    this.discountId = this.data['discountId'];
    
    // Horizontal stepper form
    this.productDiscountStepperForm = this._formBuilder.group({
        //Main Discount
        step1: this._formBuilder.group({
            id               : [''],
            discountName   : [''],
            discountType : [''],
            startDate : [''],
            endDate : [''],
            startTime : [''],
            endTime : [''],
            isActive : [''],
            maxDiscountAmount : [''],
            normalPriceItemOnly : [''],
            storeId          : [''], // not used
            storeDiscountTierList : this._formBuilder.array([]),
     
        }),
        //Product Discount
        step2: this._formBuilder.array([
        
        ]),
    });

    //==============Main discount ======================= 
    this._discountService.getDiscountByGuid(this.discountId)
    .subscribe((response:ApiResponseModel<Discount>) => {

        //Set the selected discount
        this.selectedDiscount = response.data;

        // Fill the form step 1
        this.productDiscountStepperForm.get('step1').patchValue(response.data);

        //set value for time in tieme selector
        this.setValueToTimeSelector(response.data);

        //after we set the form with custom field time selector then we display the details form
        this.loadDetails =true;
        
        //Take note that in product discount it will be empty array only cause backedn structure like that 
        // clear discount tier form array
        (this.productDiscountStepperForm.get('step1.storeDiscountTierList') as FormArray).clear();
        
        // load discount tier form array with data frombackend
        response.data.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
            this.storeDiscountTierList = this.productDiscountStepperForm.get('step1.storeDiscountTierList') as FormArray;
            this.storeDiscountTierList.push(this._formBuilder.group(item));
        });

        console.log('check form',this.productDiscountStepperForm.get('step1').value);
        
        // Mark for check
        this._changeDetectorRef.markForCheck();
    });

    //====================View PRODUCTS =====================

        this._inventoryService.categories$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((categories: ProductCategory[]) => {

            this.categoriesListing$ = categories;
            this.filteredCategories = categories;

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
             
                        return this._discountProductService.getByQueryProducts(this._paginator.pageIndex, this._paginator.pageSize, 'name', 'asc',this.inputSearchProducts,'ACTIVE,INACTIVE',this.selectedCategory);
                  
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
                      return this._discountProductService.getDiscountProductByDiscountId(this.discountId, this._paginatorDiscountProduct.pageIndex, this._paginatorDiscountProduct.pageSize);
                  }),
                  map(() => {
                      this.isLoading = false;
                  })
              ).subscribe();
          }

      }, 0);


  }

  cancel(){
    this.dialogRef.close();
  }

  updateSelectedDiscount(): void
  {
      this.changeTime();
      let sendPayload = [this.productDiscountStepperForm.get('step1').value];
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

      // Update the discount on the server
      this._discountService.updateDiscount(this.discountId, toBeSendPayload[0])
          .subscribe((resp) => {
         
          }, error => {
              console.error(error);

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

          this.cancel();
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

    this.productDiscountStepperForm.get('step1.startTime').setValue(new TimeSelector(_pickStartTimeHour,_pickStartTimeMinute, _pickStartTimeAMPM));

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
    
    this.productDiscountStepperForm.get('step1.endTime').setValue(new TimeSelector(_pickEndTimeHour,_pickEndTimeMinute, _pickEndTimeAMPM));

    //===================== / END TIME =====================
    return;
  }

  ngOnDestroy(): void
  {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
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

  changeTime(){
    //===========Start Time==================
    let pickStartTime =this.productDiscountStepperForm.get('step1.startTime').value;
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
    let pickEndTime = this.productDiscountStepperForm.get('step1.endTime').value;
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

  onChangeSelectProduct(product, change: MatCheckboxChange): void
  {
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
      
  }

  addProductDiscount(){

    if (this.onChangeSelectProductValue.length === 0){
         
         this.displayMessage('Please select the product','Please select product to add product discount','Ok',false); 
  
     }
     else {

         const itemCodesArr = this.onChangeSelectProductObject.map( el=> el.productInventories.map(el2=>el2.itemCode));//[[a,c,g],[d,e],[f]]
         const itemCodes = Array.prototype.concat.apply([],itemCodesArr);//[a,c,g,d,e,f]

         this.addAndReloadProductDiscount(itemCodes,this.discountId);

         //clear the array after we post the data
         this.onChangeSelectProductValue.length = 0;
         this.onChangeSelectProductObject.length = 0;

         //CALL BACK THE DISCOUNT PRODUCT
         // return this._discountProductService.getByQueryDiscountsProduct(this.discountId, 0, 5);


     }
     this._changeDetectorRef.markForCheck();

}

onSelectCategoryList(event){

    this.selectedCategory = event.value;

    if(this.selectedCategory ){
        return this._discountProductService.getByQueryProducts(0, 5, 'name', 'asc',this.inputSearchProducts,'ACTIVE,INACTIVE',this.selectedCategory).subscribe();
    } else{
        return this._discountProductService.getByQueryProducts(0, 5, 'name', 'asc',this.inputSearchProducts,'ACTIVE,INACTIVE').subscribe();

    }

   }

   closeDialog(){
     
    this.discountId = '';
    this.dialogRef.close({ status: false });

   }
   
   inputSearchProduct(event){
    // Get the value
    const value = event.target.value.toLowerCase();
    this.inputSearchProducts = value;

    fromEvent(event.target,'keyup')
    .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(500),
        switchMap((event:any) => {
                    
            return this._discountProductService.getByQueryProducts(0, 5, 'name', 'asc', event.target.value,'ACTIVE,INACTIVE',this.selectedCategory)
        }),
        map(() => {
            this.isLoading = false;
        })
    )
    .subscribe();

   }

    //Delete discount product
    deleteStoreProductDiscount(productDiscount){

        const confirmation = this.displayMessage('Delete discount','Are you sure you want to remove this discount? This action cannot be undone!','Delete',true);

        //after user choose either delete or cancel
        confirmation.afterClosed().subscribe((result) => {

            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {
                // Delete the store discount product from server //param (main discount id, product discount id)
                this._discountProductService.deleteDiscountProduct(this.discountId, productDiscount.id).subscribe(() => {
                                
                    this._changeDetectorRef.markForCheck();

                });

                setTimeout(() => {
                    return this._discountProductService.getDiscountProductByDiscountId(this.discountId, 0, 5).subscribe();
                    }, 1000);
            }
        });
    
    }

    // Edit discount product
    editStoreProductDiscount(productDiscount){

        if(this.editDiscountAmount>100||this.editDiscountAmount<0){
            const confirmation = this.displayMessage('Cannot more than 100 or less than 0','Please change the discount amount','Ok',false);

        } 
        else{
        let payloadProductDiscount = {
            
                id: productDiscount.id,
                storeDiscountId: productDiscount.storeDiscountId,
                itemCode:productDiscount.itemCode,
                calculationType:'PERCENT',
                discountAmount:this.editDiscountAmount?this.editDiscountAmount:productDiscount.discountAmount
            
        }

        this._discountProductService.updateProductDiscount(productDiscount.storeDiscountId,payloadProductDiscount).
                subscribe((response) => {
                    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        }
        
    }

    inputEditDiscountAmount(index,event){

            this.editDiscountAmount =event.target.value;
      
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

   async addAndReloadProductDiscount(itemCodes,discountId){
       await this.insertProductDiscount(itemCodes,discountId);
       
       setTimeout(() => {
        return this._discountProductService.getDiscountProductByDiscountId(this.discountId, 0, 5).subscribe();
        }, 1000);

        return;
   }

   async insertProductDiscount(itemCodes,discountId){
        itemCodes
        .forEach((itemCode)=>{

                let payloadProductDiscount ={
                    storeDiscountId:discountId,
                    itemCode:itemCode,
                    calculationType:'PERCENT',
                    discountAmount:0.00
                }                

                this._discountProductService.createProductDiscount(this.discountId,payloadProductDiscount).
                subscribe((response) => {}
                , error => {
                    this.displayMessage('Cannot be add','The selected product already exist','Ok',false);

                }
                )
            }
        ) 
        return;
   }


}
