import { formatDate } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrdersListService } from '../orders-list/orders-list.service';
import { Order, OrderItem } from '../orders-list/orders-list.types';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
//   styles       : [
//     `
//     .printme {
//       display: none;
//     }
//     @media print {
//       .no-printme  {
//         display: none;
//       }
//       .printme  {
//         display: block;
//       }
//     }

//     `
// ],
})
export class OrderDetailsComponent implements OnInit {

  store$: Store;

  invoiceForm: FormGroup;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  order: Order;
  orderId: string;
  timezone: string;
  timezoneString: any;
  dateCreated: Date;
  dateUpdated: Date;
  
  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _activatedRoute: ActivatedRoute,
    private _formBuilder: FormBuilder,
    private _storesService: StoresService,
    private _ordersService: OrdersListService,
    public _matDialogRef: MatDialogRef<OrderDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    
  ) { }


  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Getter for storeId
   */
   get storeId(): string
   {
       return localStorage.getItem('storeId') ?? '';
   } 


  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */

  ngOnInit(): void {

    // Create the selected product form
    this.invoiceForm = this._formBuilder.group({
      storeId             : [''],
      storeLogo           : [''],
      storeName           : [''],
      storeAddress        : [''],
      storePhoneNumber    : [''],
      storeEmail          : [''],
      storeUrl            : [''],
      storeQrCode         : [''],
      customerName        : [''],
      customerAddress     : [''],
      customerPhoneNumber : [''],
      customerEmail       : [''],
      invoiceId           : [''],
      invoiceCreatedDate  : [''],
      invoiceUpdatedDate  : [''],
      items               : this._formBuilder.array([{
        productName       : [''],        
        price             : [0],
        quantity          : [0],
        total             : [0],
      }]), 
      subtotal            : [0],
      discount            : [0],
      storeServiceCharges : [0],
      deliveryCharges     : [0],
      deliveryDiscount    : [0],      
      total               : [0],
      discountCalculationValue: [0],
      appliedDiscount     :[0],
      discountMaxAmount   :[0]

    });

    this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store)=>{
                this.store$ = store;
                this.timezone = store.regionCountry.timezone;
            });  

    // Get param from _activatedRoute first
    this._activatedRoute.params.subscribe(async params => {
      // this.orderId =  params['order_id'];
      this.orderId =  this.data;

      // then getOrderById
      this._ordersService.getOrderById(this.orderId)
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((order: Order) => {
  
            // Update the pagination
            this.order = order["data"];

            this.invoiceForm.get('storeId').setValue(order["data"].storeId);
            this.invoiceForm.get('storeName').setValue(order["data"].store.name);
            this.invoiceForm.get('storeAddress').setValue(order["data"].store.address);
            this.invoiceForm.get('storePhoneNumber').setValue(order["data"].store.phone);
            this.invoiceForm.get('storeEmail').setValue(order["data"].store.email);
            this.invoiceForm.get('storeUrl').setValue(""); // xdop lagi


            this.invoiceForm.get('customerName').setValue(order["data"].orderPaymentDetail.accountName);
            this.invoiceForm.get('customerAddress').setValue(order["data"].orderShipmentDetail.address); // xdop lg
            this.invoiceForm.get('customerPhoneNumber').setValue(order["data"].orderShipmentDetail.phoneNumber);
            this.invoiceForm.get('customerEmail').setValue(order["data"].orderShipmentDetail.email);

            this.invoiceForm.get('invoiceId').setValue(order["data"].invoiceId);
            this.invoiceForm.get('subtotal').setValue(order["data"].subTotal);
            this.invoiceForm.get('discount').setValue(0);
            this.invoiceForm.get('storeServiceCharges').setValue(order["data"].storeServiceCharges);
            this.invoiceForm.get('deliveryCharges').setValue(order["data"].deliveryCharges);
            this.invoiceForm.get('deliveryDiscount').setValue(order["data"].deliveryDiscount);
            this.invoiceForm.get('total').setValue(order["data"].total);
            if (order["data"].discountCalculationValue != null)
              this.invoiceForm.get('discountCalculationValue').setValue(order["data"].discountCalculationValue);

            this.invoiceForm.get('appliedDiscount').setValue(order["data"].appliedDiscount);
            if (order["data"].discountMaxAmount != null)
              this.invoiceForm.get('discountMaxAmount').setValue(order["data"].discountMaxAmount);
            
            var TimezoneName = this.timezone;
 
            // Generating the formatted text
            var options : any = {timeZone: TimezoneName, timeZoneName: "short"};
            var dateText = Intl.DateTimeFormat([], options).format(new Date);
            
            // Scraping the numbers we want from the text
            this.timezoneString = dateText.split(" ")[1].slice(3);
            
            // Getting the offset
            var timezoneOffset = parseInt(this.timezoneString.split(':')[0])*60;

            // Checking for a minutes offset and adding if appropriate
            if (this.timezoneString.includes(":")) {
              var timezoneOffset = timezoneOffset + parseInt(this.timezoneString.split(':')[1]);
            }

            this.dateCreated = new Date(order["data"].created);
            this.dateUpdated = new Date(order["data"].updated);

            this.dateCreated.setHours(this.dateCreated.getHours() - (-timezoneOffset) / 60);
            this.dateUpdated.setHours(this.dateUpdated.getHours() - (-timezoneOffset) / 60);

            this.invoiceForm.get('invoiceCreatedDate').setValue(this.dateCreated);
            this.invoiceForm.get('invoiceUpdatedDate').setValue(this.dateUpdated);


            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
        
      // next getOrderItemsById
      this._ordersService.getOrderItemsById(this.orderId)
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((orderItems: OrderItem[]) => {
          
          // Clear items form array
          (this.invoiceForm.get('items') as FormArray).clear();
          
          // Setup item form array
          const itemsFormGroups = [];
          
          // Iterate through OrderItem from BE
          orderItems["data"].content.forEach((item) => {
            
              // Split product variant and set as array
              if (item.productVariant != null) {

                var variant = item.productVariant;
                var variantArr = variant.split(',');
                item.productVariant = this._formBuilder.array(variantArr)

              }

              // Create item form group
              item.orderSubItem = this._formBuilder.array(item.orderSubItem)
              itemsFormGroups.push(
                this._formBuilder.group(item)
              )
              
            })
            
            // Add the item form group to the items form array     
            itemsFormGroups.forEach((itemFormGroup) => {
              (this.invoiceForm.get('items') as FormArray).push(itemFormGroup)
              
            })


        });

      // next getStoreAssets
      let storeAsset = await this._storesService.getStoreAssets(this.storeId);
      this.invoiceForm.get('storeLogo').setValue(storeAsset.logoUrl);
      this.invoiceForm.get('storeQrCode').setValue(storeAsset.qrCodeUrl);


      

    });
  }

  close(){
    this._matDialogRef.close()
  }

 

}
