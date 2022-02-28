import { ChangeDetectorRef, Component, OnDestroy, Inject, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
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
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';

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
        .edit-product-product-grid {
            grid-template-columns: 80px 80px auto 80px;

            @screen sm {
                grid-template-columns: 30px auto 104px 104px;
            }
        }
        .edit-product-discount-grid {
            grid-template-columns: 80px 80px auto 80px;

            @screen sm {
                grid-template-columns: auto 104px 90px 90px;
            }
        }
    `]
})
export class EditProductDiscountDialogComponent implements OnInit, OnDestroy {

    @ViewChild("productPaginator", {read: MatPaginator}) private _productPaginator: MatPaginator;
    @ViewChild('productDiscountPaginator', {read: MatPaginator}) private _productDiscountPaginator: MatPaginator;

    store$: Store;

    productDiscountStepperForm: FormGroup;
    discountId:string;
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
    productPagination: ProductPagination = { length: 0, page: 0, size: 0, lastPage: 0, startIndex: 0, endIndex: 0 };;

    storeDiscountProduct$: Observable<StoreDiscountProduct[]>;
    storeDiscountProduct : StoreDiscountProduct[] = []; 
    storeDiscountPagination: StoreDiscountProductPagination = { length: 0, page: 0, size: 0, lastPage: 0, startIndex: 0, endIndex: 0 };

    onChangeSelectProductObject : Product[] = [];// to keep object which has been select
    onChangeSelectProductValue : any =[];//to be display on checkbox

    isLoading: boolean = false;

    //Search mode
    inputSearchCategory : string ='';
    inputSearchProducts : string = '';
    selectedCategory:string ='';

    //================EDIT SECTION
    editModeDiscountProduct:any = [];
    editDiscountAmount :number;

    currentScreenSize: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditProductDiscountDialogComponent>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _discountService: DiscountsService,
    private _inventoryService: InventoryService ,
    private _discountProductService : DiscountsProductService,
    private _fuseConfirmationService: FuseConfirmationService,
    private _fuseMediaWatcherService: FuseMediaWatcherService,
    private _storesService: StoresService,
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
            id                      : [''],
            discountName            : [''],
            discountType            : [''],
            startDate               : [''],
            endDate                 : [''],
            startTime               : [new TimeSelector("--","--","--")],
            endTime                 : [new TimeSelector("--","--","--")],
            isActive                : [''],
            maxDiscountAmount       : [''],
            normalPriceItemOnly     : [''],
            storeId                 : [''], // not used
            storeDiscountTierList   : this._formBuilder.array([]),
     
        }),
        //Product Discount
        step2: this._formBuilder.array([
        
        ]),
    });

    //==============Main discount ======================= 
    this._discountService.getDiscountByGuid(this.discountId)
        .subscribe((response:ApiResponseModel<Discount>) => {

            if (response.data) {
                
                // remove startTime and endTime since format from backend is different from frontend
                // the startTime, endTime will be set in this.setValueToTimeSelector() below
                const { startTime, endTime, ...selectedDiscount } = response.data;
    
                // Fill the form step 1
                this.productDiscountStepperForm.get('step1').patchValue(selectedDiscount);
    
                //set value for time in tieme selector
                this.setValueToTimeSelector(response.data);
    
                //after we set the form with custom field time selector then we display the details form
                this.loadDetails = true;
                
                //Take note that in product discount it will be empty array only cause backedn structure like that 
                // clear discount tier form array
                (this.productDiscountStepperForm.get('step1.storeDiscountTierList') as FormArray).clear();
                
                // load discount tier form array with data frombackend
                response.data.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
                    this.storeDiscountTierList = this.productDiscountStepperForm.get('step1.storeDiscountTierList') as FormArray;
                    this.storeDiscountTierList.push(this._formBuilder.group(item));
                });
    
            }
            
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

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
              
    this._discountProductService.productpagination$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((pagination: ProductPagination) => {            

            if (pagination) {
                // Update the pagination
                this.productPagination = pagination;
            }

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

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
                
    this._discountProductService.pagination$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((pagination: StoreDiscountProductPagination) => {

            if (pagination) {
                // Update the pagination
                this.storeDiscountPagination = pagination;
            }

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

    // Get the store
    this._storesService.store$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((store: Store) => {

            // Update the store
            this.store$ = store;

            // Mark for check
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

  ngAfterViewInit(): void
  {
      // Mark for check
      this._changeDetectorRef.markForCheck();

      setTimeout(() => {

        // Mark for check
        this._changeDetectorRef.markForCheck();        

          if ( this._productPaginator )
          {
            // Mark for check
            this._changeDetectorRef.markForCheck();
    
            merge(this._productPaginator.page).pipe(
                switchMap(() => {                    

                    // set loading to true
                    this.isLoading = true;

                    return this._discountProductService.getByQueryProducts(this._productPaginator.pageIndex, this._productPaginator.pageSize, 'name', 'asc',this.inputSearchProducts,'ACTIVE,INACTIVE',this.selectedCategory);
                
                }),
                map(() => {
                    // set loading to false
                    this.isLoading = false;
                })
            ).subscribe();
          }
          if (this._productDiscountPaginator)
          {
    
             this._productDiscountPaginator.page.pipe(
                  switchMap(() => {
                      return this._discountProductService.getDiscountProductByDiscountId(this.discountId, this._productDiscountPaginator.pageIndex, this._productDiscountPaginator.pageSize);
                  }),
                  map(() => {
                      this.isLoading = false;
                  })
              ).subscribe();
          }

          // Mark for check
          this._changeDetectorRef.markForCheck();

      }, 0);

      // Mark for check
      this._changeDetectorRef.markForCheck();

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
              id                    : x.id,
              startTime             : this.changeStartTime,
              endTime               : this.changeEndTime,
              discountName          : x.discountName,
              discountType          : x.discountType,
              endDate               : x.endDate,
              isActive              : x.isActive,
              maxDiscountAmount     : x.maxDiscountAmount,
              normalPriceItemOnly   : x.normalPriceItemOnly,
              startDate             : x.startDate,
              storeDiscountTierList : x.storeDiscountTierList,
              storeId               : x.storeId,
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

    this.productDiscountStepperForm.get('step1').get('startTime').patchValue(new TimeSelector(_pickStartTimeHour,_pickStartTimeMinute, _pickStartTimeAMPM));

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
    
    this.productDiscountStepperForm.get('step1.endTime').patchValue(new TimeSelector(_pickEndTimeHour,_pickEndTimeMinute, _pickEndTimeAMPM));

    // Mark for check
    this._changeDetectorRef.markForCheck();

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
    
    this.changeStartTime = String(changePickStartTime.getHours()).padStart(2, "0")+':'+String(changePickStartTime.getMinutes()).padStart(2, "0");    
    
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
    
    this.changeEndTime = String(changePickEndTime.getHours()).padStart(2, "0")+':'+String(changePickEndTime.getMinutes()).padStart(2, "0");  
    
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

   deleteSelectedDiscount(): void
   {

       //check if the there is product disocunt , if yes just show pop up to delete the product level first
       if (this.storeDiscountProduct.length > 0) {
           this.displayMessage('Cannot delete','Delete the selected product first before delete this.','Ok',false);
       } else {
           // Open the confirmation dialog
           const confirmation = this.displayMessage('Delete discount','Are you sure you want to remove this discount? This action cannot be undone!','Delete',true);
          
           // Subscribe to the confirmation dialog closed action
           confirmation.afterClosed().subscribe((result) => {
               // If the confirm button pressed...
               if ( result === 'confirmed' )
               {
                   // Get the discount object
                   const discount = this.productDiscountStepperForm.get('step1').value;

                   // Delete the discount on the server
                   this._discountService.deleteDiscount(discount.id).subscribe(() => {     
                         // Set delay before closing the details window
                    setTimeout(() => {

                        // close the window
                        this.cancel();

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }, 1000);
                    });
               }
           });
       }
   }


}
