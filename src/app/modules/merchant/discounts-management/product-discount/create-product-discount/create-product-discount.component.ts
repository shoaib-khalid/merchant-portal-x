import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { InventoryService } from 'app/core/product/inventory.service';
import { Product, ProductCategory, ProductPagination } from 'app/core/product/inventory.types';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { DiscountsProductService } from '../product-discount-list/product-discount-list.service';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { DiscountsService } from '../../order-discount/order-discount-list/order-discount-list.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { StoreDiscountProduct, StoreDiscountProductPagination } from '../product-discount-list/product-discount-list.types';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';

@Component({
    selector: 'dialog-create-product-discount',
    templateUrl: './create-product-discount.component.html',
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
        .create-product-product-grid {
            grid-template-columns: 80px 80px auto 80px;

            @screen sm {
                grid-template-columns: 30px auto 104px 104px;
            }
        }
        .create-product-discount-grid {
            grid-template-columns: 80px 80px auto 80px;

            @screen sm {
                grid-template-columns: auto 104px 90px 90px;
            }
        }
    `]
})
export class CreateProductDiscountDialogComponent implements OnInit {

    @ViewChild("productPaginator", {read: MatPaginator}) private _productPaginator: MatPaginator;
    @ViewChild('productDiscountPaginator', {read: MatPaginator}) private _productDiscountPaginator: MatPaginator;

    store$: Store;
    disabledProceed: boolean = true;
    dateAlert: any;

    discountName: string;
    status: boolean;
    discountType: string;
    isActive: boolean;
    maxDiscountAmount: string;
    normalPriceItemOnly: boolean;

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

    storeDiscountProduct$: Observable<StoreDiscountProduct[]>;
    storeDiscountProduct : StoreDiscountProduct[] = []; 
    storeDiscountPagination: StoreDiscountProductPagination = { length: 0, page: 0, size: 0, lastPage: 0, startIndex: 0, endIndex: 0 };

    onChangeSelectProductObject : Product[] = [];// to keep object which has been select
    onChangeSelectProductValue : any = [];//to be display on checkbox

    discountId:string;

    currentScreenSize: string[] = [];
    flashMessage: 'success' | 'error' | null = null;

    constructor(
        public dialogRef: MatDialogRef<CreateProductDiscountDialogComponent>,
        private _formBuilder: FormBuilder,
        private _discountProductService : DiscountsProductService,
        private _inventoryService: InventoryService ,
        private _discountService: DiscountsService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _storesService: StoresService
    ) { }

    // ----------------------------------------------------------------------------------
    //                          @ Lifecycle hooks
    // ----------------------------------------------------------------------------------

    ngOnInit(): void {

        // Horizontal stepper form
        this.productDiscountStepperForm = this._formBuilder.group({
            //Main Discount
            step1: this._formBuilder.group({
                id                    : [''],
                discountName          : ['',Validators.required],
                discountType          : [''],
                startDate             : ['',[Validators.required]],
                endDate               : ['',[Validators.required]],
                startTime             : [new TimeSelector("--","--","--"),Validators.required],
                endTime               : [new TimeSelector("--","--","--"),Validators.required],
                isActive              : ['',Validators.required],
                maxDiscountAmount     : [''],
                normalPriceItemOnly   : [''],
                storeId               : [''], // not used
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

    // ----------------------------------------------------------------------------------
    //                              @ Public methods
    // ----------------------------------------------------------------------------------

    
    cancel(){
        this.dialogRef.close();
    }
    
    cancelPickupDateTime(){
        this.dialogRef.close({ status: false });
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

    // --------------------------------------
    //          Discount Section
    // --------------------------------------

    addNewDiscount() {
        this.checkDateTime();
        this.dialogRef.close({ 
            status       : true ,
            discountName : this.discountName,
            discountOn   : 'ITEM',
            startDate    : this.startDate,
            startTime    : this.changeStartTime,
            endDate      : this.endDate,
            endTime      : this.changeEndTime,
            isActive     : this.isActive,
            // maxDiscountAmount :this.maxDiscountAmount,
            // normalPriceItemOnly : this.normalPriceItemOnly
        });
    }

    createDiscount(): void
    {
        this.checkDateTime();
        let sendPayload = [this.productDiscountStepperForm.get('step1').value];
        let toBeSendPayload=sendPayload.
        map((x)=>(
            {
                id                    : x.id,
                storeId               : x.storeId,
                startTime             : this.changeStartTime,
                endTime               : this.changeEndTime,
                startDate             : x.startDate,
                endDate               : x.endDate,
                discountName          : x.discountName,
                discountType          :'ITEM',
                isActive              : x.isActive,
                maxDiscountAmount     : x.maxDiscountAmount,
                normalPriceItemOnly   : x.normalPriceItemOnly,
                storeDiscountTierList : x.storeDiscountTierList,
            }
        ));

            //*call method to add the main discount first then apply the selected product discount*//

            
        this.addMainDiscountAndAppliedProduct(toBeSendPayload[0],this.productDiscountStepperForm.get('step2').value)

        this.cancel();
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
                            label: 'OK'
                        },
                        cancel : {
                            show : false,
                        }
                    }
                });
            }
        });
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

    // --------------------------------------
    //        Product Discount Section
    // --------------------------------------

    addProductDiscount(){

        if (this.onChangeSelectProductValue.length === 0){
            
            this.displayMessage('Please select the product','Please select product to add product discount','OK',false); 
    
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
            this.displayMessage('Selected product already exist','Please select other product','OK',false); 

            }

            //clear the array after we post the data
            this.onChangeSelectProductValue.length = 0;
            this.onChangeSelectProductObject.length = 0;

            //CALL BACK THE DISCOUNT PRODUCT
            // return this._discountProductService.getByQueryDiscountsProduct(this.discountId, 0, 5);

        }

        // Mark for check
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

    // --------------------------------------
    //          Date and Time Section
    // --------------------------------------

    checkDateTime() {

        // ==============================================================
        //                     Start Date & Time
        // ==============================================================

        // Get startDate
        let _startDate = this.productDiscountStepperForm.get('step1').get('startDate').value
        // Get startTime
        let startTime = this.productDiscountStepperForm.get('step1.startTime').value;
        let _startTime;        

        // Split start date format
        var selectedStartDay = _startDate.split("-")[2];
        var selectedStartMonth = _startDate.split("-")[1];
        var selectedStartYear = _startDate.split("-")[0];


        if (startTime.timeAmPm === "PM" && startTime.timeHour !== "12") {
            _startTime = parseInt(startTime.timeHour) + 12;
        } else if (startTime.timeAmPm === "AM" && startTime.timeHour === "12") {
            _startTime = parseInt(startTime.timeHour) - 12;
            _startTime = (_startTime === 0) ? "00" : _startTime;
        } else {
            _startTime = startTime.timeHour;
        }

        // Set new start date and time
        const startDateTime = new Date();
        startDateTime.setDate(selectedStartDay)
        startDateTime.setMonth(selectedStartMonth - 1)
        startDateTime.setFullYear(selectedStartYear)
        startDateTime.setHours(_startTime,startTime.timeMinute,0)

        this.changeStartTime = _startTime + ":" + startTime.timeMinute   

        // ==============================================================
        //                      End Date
        // ==============================================================

        // Get endDate
        let _endDate = this.productDiscountStepperForm.get('step1').get('endDate').value
        // Get endTime
        let endTime = this.productDiscountStepperForm.get('step1.endTime').value;
        let _endTime;

        // Split end date format
        var selectedEndDay = _endDate.split("-")[2];
        var selectedEndMonth = _endDate.split("-")[1];
        var selectedEndYear = _endDate.split("-")[0];

        if (endTime.timeAmPm === "PM" && endTime.timeHour !== "12") {
            _endTime = parseInt(endTime.timeHour) + 12;
        } else if (endTime.timeAmPm === "AM" && endTime.timeHour === "12") {
            _endTime = parseInt(endTime.timeHour) - 12;
            _endTime = (_endTime === 0) ? "00" : _endTime;
        } else {
            _endTime = endTime.timeHour;
        }

        // Set new end date and time
        const endDateTime = new Date();
        endDateTime.setDate(selectedEndDay);
        endDateTime.setMonth(selectedEndMonth - 1);
        endDateTime.setFullYear(selectedEndYear);
        endDateTime.setHours(_endTime,endTime.timeMinute,0);

        this.changeEndTime = _endTime + ":" + endTime.timeMinute
        
        // ==============================================================
        //              Date and time range Display Error
        // ==============================================================

        // this will set what need to be sent to backend
        const discountBody = {
            
            startDate   : this.productDiscountStepperForm.get('step1.startDate').value,
            endDate     : this.productDiscountStepperForm.get('step1.endDate').value,
            startTime   : _startTime + ":" + startTime.timeMinute,
            endTime     : _endTime + ":" + endTime.timeMinute,
            isActive    : this.productDiscountStepperForm.get('step1.isActive').value,
            discountType: "ITEM"
            
        };

        if(startDateTime > endDateTime && _endDate !== ""){            
            this.dateAlert = "Date and Time Range incorrect !" ;
            this.disabledProceed = true;
        } else if(endTime.timeMinute === "--" || _endTime === "--" || endTime.timeAmPm === "--"){
            this.disabledProceed = true;

        } else {
            // check validate at backend
            if(this.checkExistingDate(discountBody)) {
                this.disabledProceed = true;
            }
            this.dateAlert = " " ;
            this.disabledProceed = false;
        }
    }

    //post validate (validateStoreDiscount)
    async checkExistingDate(discountBody){
        let status = await this._discountService.getExistingDate(discountBody);
        if (status === 417 ){
            this.dateAlert ="Date selected is overlapped with existing date, please select another date !";
            this.disabledProceed = true;
        }
    }

    // changeTime(){
    //     //===========Start Time==================
    //     let pickStartTime =this.productDiscountStepperForm.get('step1.startTime').value;
    //     let _pickStartTime;

    //     if ((<any>pickStartTime).timeAmPm === "PM") {
    //         _pickStartTime = parseInt((<any>pickStartTime).timeHour) + 12;
    //     } else {
    //         _pickStartTime = (<any>pickStartTime).timeHour;
    //     }
    //     const changePickStartTime = new Date();
    //     changePickStartTime.setHours(_pickStartTime,(<any>pickStartTime).timeMinute,0);
        
    //     this.changeStartTime=String(changePickStartTime.getHours()).padStart(2, "0")+':'+String(changePickStartTime.getMinutes()).padStart(2, "0");    
        
    //     //==============End time===================
    //     let pickEndTime = this.productDiscountStepperForm.get('step1.endTime').value;
    //     let _pickEndTime;

    //     if ((<any>pickEndTime).timeAmPm === "PM") {
    //         _pickEndTime = parseInt((<any>pickEndTime).timeHour) + 12;
    //     } else {
    //         _pickEndTime = (<any>pickEndTime).timeHour;
    //     }
    //     const changePickEndTime = new Date();
    //     changePickEndTime.setHours(_pickEndTime,(<any>pickEndTime).timeMinute,0);
        
    //     this.changeEndTime= String(changePickEndTime.getHours()).padStart(2, "0")+':'+String(changePickEndTime.getMinutes()).padStart(2, "0");  
        
    //     return;
    // }
}
