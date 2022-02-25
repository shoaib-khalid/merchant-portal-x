import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { InventoryService } from 'app/core/product/inventory.service';
import { Product, ProductCategory, ProductPagination } from 'app/core/product/inventory.types';
import { fromEvent, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { DiscountsProductService } from '../product-discount-list/product-discount-list.service';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { DiscountsService } from '../../order-discount/order-discount-list/order-discount-list.service';
import { MatCheckboxChange } from '@angular/material/checkbox';

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
  addProductDiscountLevel: FormArray;

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
    private _discountService: DiscountsService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _fuseConfirmationService: FuseConfirmationService,


  ) { }

  ngOnInit(): void {

    // Horizontal stepper form
    this.productDiscountStepperForm = this._formBuilder.group({
      //Main Discount
      step1: this._formBuilder.group({
          id               : [''],
          discountName   : ['',Validators.required],
          discountType : [''],
          startDate : ['',Validators.required],
          endDate : ['',Validators.required],
          startTime : ['',Validators.required],
          endTime : ['',Validators.required],
          isActive : ['',Validators.required],
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
    let pickStartTime =this.productDiscountStepperForm.get('step1.startTime').value;
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

        //  const itemCodesArr = this.onChangeSelectProductObject.map( el=> el.productInventories.map(el2=>el2.itemCode));//[[a,c,g],[d,e],[f]]
        //  const itemCodes = Array.prototype.concat.apply([],itemCodesArr);//[a,c,g,d,e,f]
     
        const itemCodesArr = this.onChangeSelectProductObject.map( 
          el=> el.productInventories.
          map((el2)=>({
                  itemCode:el2.itemCode,
                  sku:el2.sku,
                  price:el2.price,
                  calculationType:'PERCENT',
                  discountAmount:0.00,
          })));//[[a,c,g],[d,e],[f]]
        const itemCodes = Array.prototype.concat.apply([],itemCodesArr);//[a,c,g,d,e,f];

        //Filter objects that exists in both arrays
        this.addProductDiscountLevel = this.productDiscountStepperForm.get('step2') as FormArray;

        let checkItemCodeExist = itemCodes.filter(el=> this.addProductDiscountLevel.value.some(x => x.itemCode === el.itemCode));

        if(checkItemCodeExist.length === 0){
          itemCodes.forEach((item) => {
            this.addProductDiscountLevel = this.productDiscountStepperForm.get('step2') as FormArray;
            this.addProductDiscountLevel.push(this._formBuilder.group(item));
          });
        }else{
          //show error message the itemcode exist already
          this.displayMessage('Selected product already exist','Please select other product','Ok',false); 

        }

         //clear the array after we post the data
         this.onChangeSelectProductValue.length = 0;
         this.onChangeSelectProductObject.length = 0;

         //CALL BACK THE DISCOUNT PRODUCT
         // return this._discountProductService.getByQueryDiscountsProduct(this.discountId, 0, 5);


     }
     this._changeDetectorRef.markForCheck();

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
      
      console.log('check kat checkbox::::',this.onChangeSelectProductObject);
      
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

  createDiscount(): void
  {
      this.changeTime();
      let sendPayload = [this.productDiscountStepperForm.get('step1').value];
      let toBeSendPayload=sendPayload.
      map((x)=>(
          {
              startTime:this.changeStartTime,
              endTime:this.changeEndTime,
              discountName: x.discountName,
              discountType:'ITEM',
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

        //*call method to add the main discount first then apply the selected product discount*//

        
        this.addMainDiscountAndAppliedProduct(toBeSendPayload[0],this.productDiscountStepperForm.get('step2').value)

          this.cancel();
  }

  deleteSelectedProductDiscount(indexForm){

    this.addProductDiscountLevel= this.productDiscountStepperForm.get('step2') as FormArray;
    let index = (this.addProductDiscountLevel.value.findIndex(function checkIndex(element, index, array) {
      return   index=== indexForm;
     }));

    // remove from discount tier list
    if (index > -1) {
        this.addProductDiscountLevel.removeAt(index);
    }

    // Mark for check
    this._changeDetectorRef.markForCheck();
  }

  async insertMainDiscount(mainDiscountBody){
      
    this._discountService.createDiscount(mainDiscountBody).subscribe((response) => {

        return this.discountId= response['data'].id;

    }, (error) => {

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

  async sendAppliedDiscountProduct(selectedProductDiscountBody){
    selectedProductDiscountBody
        .forEach((list)=>{

          let payloadProductDiscount ={
            storeDiscountId:this.discountId,
            itemCode:list.itemCode,
            calculationType:list.calculationType,
            discountAmount:list.discountAmount
          }              

          this._discountProductService.createProductDiscount(this.discountId,payloadProductDiscount).
          subscribe();

          }
        ) 


        return;

   }

   async addMainDiscountAndAppliedProduct(mainDiscountBody,selectedProductDiscountBody){
    await this.insertMainDiscount(mainDiscountBody);
    setTimeout(() => {
        //if encounter error during create main discount, the discount id does not exist 
        if(this.discountId){
            return   this.sendAppliedDiscountProduct(selectedProductDiscountBody);   
        }
        }, 1000);
     return;
   }


}
