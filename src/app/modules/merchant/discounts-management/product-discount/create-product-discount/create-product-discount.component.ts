import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { InventoryService } from 'app/core/product/inventory.service';
import { Product, ProductCategory, ProductPagination } from 'app/core/product/inventory.types';
import { fromEvent, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { DiscountsProductService } from '../product-discount-list/product-discount-list.service';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
  selector: 'dialog-create-product-discount',
  templateUrl: './create-product-discount.component.html'
})
export class CreateProductDiscountDialogComponent implements OnInit {

  disabledProceed: boolean = true;

  discountName: string;
  status: boolean;
  discountType: string;
  isActive: boolean;
  maxDiscountAmount: string;
  normalPriceItemOnly: boolean;

  checkdate = false;
  checkname = false;
  checkstatus = false;
  checktype = false;
  checkdiscountamount = false;

  startDate: string;
  startTime: string;
  isDisabledStartDateTime: boolean = true;
  minStartDate: string;
  minStartTime: string;
  maxStartDate:string;
  maxStartTime:string;

  endDate: string;
  endTime: string;
  minEndDate: string;
  minEndTime: string;
  maxEndDate: string;
  maxEndTime: string;

  message: string = "";
  changeStartTime:string;
  changeEndTime:string;
   
  //=====================new
  productDiscountStepperForm: FormGroup;

  //Search mode
  inputSearchCategory : string ='';
  inputSearchProducts : string = '';
  selectedCategory:string ='';

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  categoriesListing$ : ProductCategory[];
  filteredCategories: ProductCategory[];

  products$: Observable<Product[]>;
  _products:Product[];
  filteredProductsOptions: Product[] = [];
  productPagination: ProductPagination;

  isLoading: boolean = false;

  onChangeSelectProductObject : Product[] = [];// to keep object which has been select
  onChangeSelectProductValue : any =[];//to be display on checkbox

  discountId:string;

  constructor(
    public dialogRef: MatDialogRef<CreateProductDiscountDialogComponent>,
    private _formBuilder: FormBuilder,
    private _discountProductService : DiscountsProductService,
    private _inventoryService: InventoryService ,
    private _changeDetectorRef: ChangeDetectorRef,
    private _fuseConfirmationService: FuseConfirmationService,


  ) { }

  ngOnInit(): void {

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

    // Mark for check
    this._changeDetectorRef.markForCheck();

  }

  addNewDiscount() {
    this.changeTime();
    this.dialogRef.close({ 
        status: true ,
        discountName: this.discountName,
        discountOn: 'ITEM',
        startDate: this.startDate,
        startTime: this.changeStartTime,
        endDate: this.endDate,
        endTime: this.changeEndTime,
        isActive :this.isActive,
        // maxDiscountAmount :this.maxDiscountAmount,
        // normalPriceItemOnly : this.normalPriceItemOnly
    });
  }

  cancelPickupDateTime(){
    this.dialogRef.close({ status: false });
  }
  
  checkName(){           
        // check discount name
        if (this.discountName) {
            this.checkname = true;
            this.message = "";
        }else{
            this.checkname = false;
            this.message = "Please insert discount name";
        }
        
  }

  checkDateTime(){
         // check min end date not less than min start date
         if (this.startDate && this.startTime) {
            // set minimum end date to current selected date
            this.isDisabledStartDateTime = false;
            this.minEndDate = this.startDate;
        }
        // check date
        if (this.startTime && this.endTime && this.endDate && this.startDate) {        
            if (this.startDate < this.endDate){
                this.checkdate = true;
            } else if (this.startDate == this.endDate) {
                if (this.startTime <= this.endTime) {
                    this.checkdate = true;
                } else {
                    this.checkdate = false;
                    this.message = "Date/time range incorrect";
                }
            }
        }
  }

  checkStatus(){
    //check status
     if (this.isActive){
        this.checkstatus = true;
        this.message = ""
        }else{
            this.checkstatus = false;
            this.message = "Please select status option"
        }
  }

  checkDiscountAmount(){           
    // check discount name
    if (this.maxDiscountAmount) {
        this.checkdiscountamount = true;
        this.message = "";
    }else{
        this.checkdiscountamount = false;
        this.message = "Please insert maximum discount amount";
    }
    
}

  checkForm(){
    
    if (this.checkname === true && this.checkdate === true && this.checkstatus === true) {
        this.disabledProceed = false;
    } else {
        this.disabledProceed = true;
    }
    
  }

  changeTime(){
    //===========Start Time==================
    let pickStartTime = this.startTime;
    let _pickStartTime;

    if ((<any>pickStartTime).timeAmPm === "PM") {
        _pickStartTime = parseInt((<any>pickStartTime).timeHour) + 12;
    } else {
        _pickStartTime = (<any>pickStartTime).timeHour;
    }
    const changePickStartTime = new Date();
    changePickStartTime.setHours(_pickStartTime,(<any>pickStartTime).timeMinute,0);
    
    this.changeStartTime=String(changePickStartTime.getHours()).padStart(2, "0")+':'+String(changePickStartTime.getMinutes()).padStart(2, "0");    
    
    //==============End time===================
    let pickEndTime = this.endTime;
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

  cancel(){
    this.dialogRef.close();
  }

  onSelectCategoryList(event){

    this.selectedCategory = event.value;

    if(this.selectedCategory ){
        return this._discountProductService.getByQueryProducts(0, 5, 'name', 'asc',this.inputSearchProducts,'ACTIVE,INACTIVE',this.selectedCategory).subscribe();
    } else{
        return this._discountProductService.getByQueryProducts(0, 5, 'name', 'asc',this.inputSearchProducts,'ACTIVE,INACTIVE').subscribe();

    }

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
      // this._discountService.updateDiscount(this.discountId, toBeSendPayload[0])
      //     .subscribe((resp) => {
         
      //     }, error => {
      //         console.error(error);

      //             if (error.status === 417) {
      //                 // Open the confirmation dialog
      //                 const confirmation = this._fuseConfirmationService.open({
      //                     title  : 'Discount date overlap',
      //                     message: 'Your discount date range entered overlapping with existing discount date! Please change your date range',
      //                     actions: {
      //                         confirm: {
      //                             label: 'Ok'
      //                         },
      //                         cancel : {
      //                             show : false,
      //                         }
      //                     }
      //                 });
      //             }
      //         }
      //     );

          this.cancel();
  }


}
