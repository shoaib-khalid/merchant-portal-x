import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StoresService } from 'app/core/store/store.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrdersListService } from '../orders-list/orders-list.service';
import { Order, OrderItem } from '../orders-list/orders-list.types';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html'
})
export class OrderDetailsComponent implements OnInit {

  invoiceForm: FormGroup;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  order: Order;
  orderId: string;
  
  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _activatedRoute: ActivatedRoute,
    private _formBuilder: FormBuilder,
    private _storesService: StoresService,
    private _ordersService: OrdersListService,
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
      total               : [0]
    });

    // Get param from _activatedRoute first
    this._activatedRoute.params.subscribe(async params => {
      this.orderId =  params['order_id'];

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
            this.invoiceForm.get('invoiceCreatedDate').setValue(order["data"].created); // xdop lg
            this.invoiceForm.get('invoiceUpdatedDate').setValue(order["data"].updated);

            this.invoiceForm.get('subtotal').setValue(order["data"].subTotal);
            this.invoiceForm.get('discount').setValue(0);
            this.invoiceForm.get('storeServiceCharges').setValue(order["data"].storeServiceCharges);
            this.invoiceForm.get('deliveryCharges').setValue(order["data"].deliveryCharges);
            this.invoiceForm.get('deliveryDiscount').setValue(order["data"].deliveryDiscount);
            this.invoiceForm.get('total').setValue(order["data"].total);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
        
      // next getOrderItemsById
      this._ordersService.getOrderItemsById(this.orderId)
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((orderItems: OrderItem) => {
            console.log(orderItems["data"].content)
            this.invoiceForm.get('items').setValue(orderItems["data"].content);
        });

      // next getOrderItemsById
      let storeAsset = await this._storesService.getStoreAssets(this.storeId);
      this.invoiceForm.get('storeLogo').setValue(storeAsset.logoUrl);
    });
  }
}
