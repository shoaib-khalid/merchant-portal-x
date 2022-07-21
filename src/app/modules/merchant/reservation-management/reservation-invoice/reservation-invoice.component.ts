import { formatDate } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'app-reservation-invoice',
	templateUrl: './reservation-invoice.component.html',
	styles: [
		`
		/* to remove visible container when window dialog is opened  */
		::ng-deep .reservation-invoice-custom-dialog-class {
			mat-dialog-container {
				padding: 0 !important;
			}
		}
		`
	]
})
export class ReservationInvoiceComponent implements OnInit {

	store$: Store;

	invoiceForm: FormGroup;
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	orderId: string;
	timezone: string;
	timezoneString: any;
	dateCreated: Date;
	dateUpdated: Date;
	deliveryDiscountDescription: any;
	appliedDiscountDescription: any;
	voucherDiscount = {platform: 0, store: 0}
	
	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		private _activatedRoute: ActivatedRoute,
		private _formBuilder: FormBuilder,
		private _storesService: StoresService,
		public _matDialogRef: MatDialogRef<ReservationInvoiceComponent>,
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

		// Create invoice form
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
				specialInstruction: [''], //item level

			}]), 
			subTotal            : [0],
			// discount            : [0],
			storeServiceCharges : [0],
			deliveryCharges     : [0],
			deliveryDiscount    : [0],      
			deliveryDiscountDescription: [0],
			total               : [0],
			discountCalculationValue: [0],
			appliedDiscount     :[0],
			discountMaxAmount   :[0],
			appliedDiscountDescription : [0],
			deliveryDiscountMaxAmount : [0],
			customerNotes: [''], //order level
			voucherDiscount: [0]
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



			// next getStoreAssets
			let storeAsset = await this._storesService.getStoreAssets(this.storeId);
			this.invoiceForm.get('storeLogo').setValue(storeAsset.logoUrl);
			this.invoiceForm.get('storeQrCode').setValue(storeAsset.qrCodeUrl);


		

		});
  	}

	close(){
		this._matDialogRef.close()
	}

	print(){
		window.print();
	}


}
