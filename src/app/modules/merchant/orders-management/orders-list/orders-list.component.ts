import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, forkJoin, merge, of, Subject } from 'rxjs';
import { debounceTime, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { OrdersListService } from 'app/modules/merchant/orders-management/orders-list/orders-list.service';
import { Order, OrdersCountSummary, OrdersListPagination } from 'app/modules/merchant/orders-management/orders-list/orders-list.types'
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrderInvoiceComponent } from 'app/modules/merchant/orders-management/order-invoice/order-invoice.component';
import { ChooseProviderDateTimeComponent } from 'app/modules/merchant/orders-management/choose-provider-datetime/choose-provider-datetime.component';
import { Router } from '@angular/router';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { formatDate } from '@angular/common';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { EditOrderComponent } from '../edit-order/edit-order.component';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';

@Component({
    selector       : 'orders-list',
    templateUrl    : './orders-list.component.html',
    styles       : [
        `
        /* to truncate long text  */
        .truncate-cell {
            max-width: 150px; 
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        /* to break long words */
        .mat-cell-break-word {
            white-space: normal;
            word-wrap: break-word;
            max-width: 50px;
        }

        .cell-style {
            width: 130px
        }
        .cell-style-small {
            width: 90px
        }

        /* .mat-select .mat-select-trigger .mat-select-value {
            display: flex;
            position: relative;
            max-width: none;
            justify-content: center;
            font-size: 0.875rem;
            line-height: 1.25rem;

        }

        .mat-select .mat-select-trigger {
            display: inline-flex;
            align-items: center;
            width: 100%;
            height: auto;
            padding-left: 0.25rem;
            padding-right: 0.25rem;
        } */
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('selectFilter', {read: MatSelect})  _filter: MatSelect;


    openTab: string = "NEW";

    store: Store;

    orderCountSummary: OrdersCountSummary[];
    _orderCountSummary: any;

    pagination: OrdersListPagination;
    isLoading: boolean = false;

    filterCustNameControl: FormControl = new FormControl();
    filterCustNameControlValue: string;

    filterTrxIdControl: FormControl = new FormControl();
    filterTrxIdControlValue: string;

    filterDateRange: any = {
        start : null,
        end: null
    }
    filterDateInputStartControl: FormControl = new FormControl();
    filterDateInputEndControl: FormControl = new FormControl();
    tabControl: FormControl = new FormControl();
    filterList: string = "name";

    range: any;

    orders: MatTableDataSource<any> = new MatTableDataSource();
    bulkOrders: Order[] = [];
    
    orderSubmitted: any = [];
    bulkOrderSubmitted: boolean = false;

    recentTransactionsTableColumns: string[] = ['invoiceId', 'created', 'orderPaymentDetail.accountName', 'total','deliveryType','deliveryService', 'deliveryProvider', 'serviceType', 'action'];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    errorMessage: string;

    currentScreenSize: string[] = [];

    isRevised:any;
    serviceTypeControl: FormControl = new FormControl('');

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _orderslistService: OrdersListService,
        private _storesService: StoresService,
        public _dialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _router: Router,
        )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.range = new FormGroup({
            start: new FormControl(),
            end: new FormControl(),
        });

        // Set initial active tab value

        // this.tabControl.setValue("");
        this.tabControl.setValue(["PAYMENT_CONFIRMED", "RECEIVED_AT_STORE"]);
        

        // Get the data
        this._orderslistService.orders$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {

                // Store the table data
                this.orders.data = data;
                this.orders.data.map(obj => Object.assign(obj, { selected: false }));

                // Mark for check
                this._changeDetectorRef.markForCheck();

            });

        // Get the pagination
        this._orderslistService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: OrdersListPagination) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });



        this._orderslistService.ordersCountSummary$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {

                this.orderCountSummary = response;

                this._orderCountSummary = [
                    { id: "NEW", label: "New", completionStatus: ["PAYMENT_CONFIRMED", "RECEIVED_AT_STORE"], count: 0 },
                    { id: "PROCESS", label: "Process", completionStatus: "BEING_PREPARED", count: 0 },
                    { id: "AWAITING_PICKUP", label: "Awaiting Pickup", completionStatus: "AWAITING_PICKUP", count: 0 },
                    { id: "SENT_OUT", label: "Sent Out", completionStatus: "BEING_DELIVERED", count: 0 },
                    { id: "DELIVERED", label: "Delivered", completionStatus: "DELIVERED_TO_CUSTOMER", count: 0 },
                    { id: "CANCELLED", label: "Cancelled", completionStatus: "CANCELED_BY_MERCHANT", count: 0 },
                    { id: "HISTORY", label: "History", completionStatus: ["PAYMENT_CONFIRMED", "RECEIVED_AT_STORE", "BEING_PREPARED", "AWAITING_PICKUP", "BEING_DELIVERED", "DELIVERED_TO_CUSTOMER", "CANCELED_BY_MERCHANT"], count: 0 }
                ];

                this._orderCountSummary.forEach((item,i) => {

                    // if have multiple completionStatus
                    if (Array.isArray(item.completionStatus) && item.completionStatus.length > 1) {
                        item.completionStatus.forEach((element, j) => {
                            let index = this.orderCountSummary.findIndex((obj => obj.completionStatus === item.completionStatus[j]));
                            if (index > -1) {
                                this._orderCountSummary[i].count = this._orderCountSummary[i].count + this.orderCountSummary[index].count;
                            }
                        });
                    } else {
                        let index = this.orderCountSummary.findIndex((obj => obj.completionStatus === item.completionStatus));
                        if (index > -1) {
                            this._orderCountSummary[i].count = this.orderCountSummary[index].count;
                        }
                    }
                });

                // Mark for check
                this._changeDetectorRef.markForCheck();

            });
            
        // get store
        this._storesService.store$.subscribe((response) => {
            this.store = response;
        })

        this.filterCustNameControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    this.filterCustNameControlValue = query;


                    return this._orderslistService.getOrders(0, 10, 'created', 'desc', query, '', '', '', this.tabControl.value, '', this.serviceTypeControl.value);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        
        this.filterTrxIdControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    this.filterTrxIdControlValue = query;

                    return this._orderslistService.getOrders(0, 10, 'created', 'desc', '', '', '', '', this.tabControl.value, query, this.serviceTypeControl.value);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        this.filterDateInputStartControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;

                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
                    this.filterDateRange.start = formattedDate;
                        
                    // do nothing
                    return of(true);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        this.filterDateInputEndControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;

                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
                    this.filterDateRange.end = formattedDate;
                        
                    return this._orderslistService.getOrders(0, 10, 'created', 'desc', '', '', this.filterDateRange.start, this.filterDateRange.end, this.tabControl.value, '', this.serviceTypeControl.value);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        this.tabControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    //kena ubah
                    return this._orderslistService.getOrders(0, 10, 'created', 'desc', '', '', '', '', query, '', this.serviceTypeControl.value);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Filter by service type dropdown
        this.serviceTypeControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((value) => {
                    
                    this.isLoading = true;
                    return forkJoin([
                        this._orderslistService.getOrders(0, 10, 'created', 'desc', '', '', '', '', this.tabControl.value, '', value),
                        this._orderslistService.getOrdersCountSummary(value)
                    ])
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {               

                this.currentScreenSize = matchingAliases;                

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        setTimeout(() => {
            if ( this._sort && this._paginator )
            {
                // Set the initial sort
                this._sort.sort({
                    id          : 'created',
                    start       : 'desc',
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
                });
                
                // Get products if sort or page changes
                merge(this._sort.sortChange, this._paginator.page).pipe(
                    switchMap(() => {
                        this.isLoading = true;
                        
                        //pagination filtered by date
                        if (this.filterDateRange.start != null && this.filterDateRange.end != null)
                            return this._orderslistService.getOrders(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '' , '', 
                                                                        this.filterDateRange.start, this.filterDateRange.end, this.tabControl.value, '', this.serviceTypeControl.value);
                        //pagination filtered by trx id
                        else if (this.filterTrxIdControlValue != null)
                            return this._orderslistService.getOrders(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '' , '', '', '', 
                                                                        this.tabControl.value, this.filterTrxIdControlValue, this.serviceTypeControl.value);
                        //pagination filtered by cust name
                        else if (this.filterCustNameControlValue != null)
                            return this._orderslistService.getOrders(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, 
                                                                        this.filterCustNameControlValue , '', '', '', this.tabControl.value, '', this.serviceTypeControl.value);

                        else
                            return this._orderslistService.getOrders(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '' , '', '', '', this.tabControl.value, '', this.serviceTypeControl.value);
                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                    ).subscribe();
            }
        }, 0);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    toggleTabs(displayStatuses: string) {
        this.openTab = displayStatuses;

        let currentOpenTab = displayStatuses;
        if (displayStatuses === "PROCESS") {
            this.recentTransactionsTableColumns = ['bulkId', 'invoiceId', 'created', 'orderPaymentDetail.accountName', 'total', 'deliveryType', 'deliveryService', 'deliveryProvider', 'serviceType', 'action'];
        } else if (displayStatuses !== "HISTORY") {
            this.recentTransactionsTableColumns = ['invoiceId', 'created', 'orderPaymentDetail.accountName', 'total', 'deliveryType','deliveryService', 'deliveryProvider', 'serviceType', 'action'];
        }  else {
            this.recentTransactionsTableColumns = ['invoiceId', 'created', 'orderPaymentDetail.accountName', 'total', 'completionStatus', 'serviceType', 'action'];
        }

        this.tabControl.setValue(this._orderCountSummary.find(item => item.id === this.openTab).completionStatus);

        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    clearFilter(){
        this.filterCustNameControl.setValue('');
        this.filterTrxIdControl.setValue('');
    }

    openSelector() {
        this._filter.open();
    }

    updateStatus(order: Order, nextCompletionStatus) {

        this.orderSubmitted[order.id] = true;
        
        let completionBody = {
            nextCompletionStatus: nextCompletionStatus
        };

        // First check the order delivery type => Only scheduled to allow choose time
        if (order.deliveryType === "SCHEDULED" && nextCompletionStatus === "AWAITING_PICKUP") {
            this._orderslistService.getDeliveryProviderDetails(order.orderShipmentDetail.deliveryProviderId, 1)
                .subscribe(response => {

                    if (response.dialog === true) {
                        const dialogRef = this._dialog.open(ChooseProviderDateTimeComponent, { disableClose: true, data: response });
                        dialogRef.afterClosed().subscribe(result => {
                            if (result === "cancelled" || !result.date || !result.time){
                                this.orderSubmitted[order.id] = false;
                                console.warn("Process cancelled");
    
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            } else {
                                completionBody["date"] = result.date;
                                completionBody["time"] = result.time;
    
                                // update the order
                                this._orderslistService.updateOrder(order.id, completionBody)
                                    .pipe(finalize(() => {
                                        this.orderSubmitted[order.id] = false;
                                    }))
                                    .subscribe((response) => {                
                                        // re-fetch the completion status    
                                        this._orderslistService.getCompletionStatus(order.id, nextCompletionStatus).subscribe(() => {
                                        });
                                        
                                        // this._orderslistService.getOrdersCountSummary(this.serviceTypeControl.value).subscribe()
                                        // this._orderslistService.getOrders(0, 10, 'created', 'desc', '', '', '', '', this.tabControl.value, '', this.serviceTypeControl.value).subscribe()
    
                                        // Mark for check
                                        this._changeDetectorRef.markForCheck();
                                    }
                                    );
                            }
                        });
                    } else {
                        // update the order
                        this._orderslistService.updateOrder(order.id, completionBody).pipe(finalize(() => {
                            this.orderSubmitted[order.id] = false;
                            }))
                            .subscribe((response) => {
                                // re-fetch the completion status  
                                this._orderslistService.getCompletionStatus(order.id, nextCompletionStatus).subscribe(() => {
                                });
                                // this._orderslistService.getOrdersCountSummary(this.serviceTypeControl.value).subscribe()
                                // this._orderslistService.getOrders(0, 10, 'created', 'desc', '', '', '', '', this.tabControl.value, '', this.serviceTypeControl.value).subscribe()

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            });
                    }
                });
        } else {
            // update the order
            this._orderslistService.updateOrder(order.id, completionBody).pipe(finalize(() => {
                this.orderSubmitted[order.id] = false;
                }))
                .subscribe((response) => {
                    // re-fetch the completion status  
                    this._orderslistService.getCompletionStatus(order.id, nextCompletionStatus).subscribe(() => {
                    });
                    // this._orderslistService.getOrdersCountSummary(this.serviceTypeControl.value).subscribe()
                    // this._orderslistService.getOrders(0, 10, 'created', 'desc', '', '', '', '', this.tabControl.value, '', this.serviceTypeControl.value).subscribe()

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        }
    }

    updateStatusBulk(nextCompletionStatus) {
        
        this.bulkOrderSubmitted = true;        

        let findNextCompletionStatusIndex = this.bulkOrders.findIndex(item => item["nextCompletionStatus"] !== "AWAITING_PICKUP");
        let findDeliveryTypeIndex = this.bulkOrders.findIndex(item => item["order"].deliveryType !== "SCHEDULED");
        let findStorePickupIndex = this.bulkOrders.findIndex(item => item["order"].orderShipmentDetail.storePickup === true);
        let findGroupedDeliveryProvider = [...new Set(this.bulkOrders.map(item => { return item["order"].orderShipmentDetail.deliveryProviderId}))];

        if (findDeliveryTypeIndex > -1) {
            // Open the confirmation dialog
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Unable to place bulk order',
                message: 'One or more of selected orders contain "Instant Delivery". Please unselect "Instant Delivery" orders from the selected bulk order.',
                actions: {
                    confirm: {
                        label: 'OK'
                    }
                }
            });

            return;
        }
        
        if (findNextCompletionStatusIndex > -1) {
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Unable to place bulk order',
                message: 'Wrong Completion Status',
                actions: {
                    confirm: {
                        label: 'OK'
                    }
                }
            });

            console.error("Update Status Bulk only available for AWAITING_PICKUP")
            return;
        } 

        if (findStorePickupIndex > -1) {
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Unable to place bulk order',
                message: 'Cannot place bulk order with store pickup order. You need to remove store pickup order from the bulk order',
                actions: {
                    confirm: {
                        label: 'OK'
                    }
                }
            });

            return;
        }

        if (findGroupedDeliveryProvider.length > 1) {
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Unable to place bulk order',
                message: 'Cannot place bulk order with different delivery provider. You need to choose same type of delivery provider to continue',
                actions: {
                    confirm: {
                        label: 'OK'
                    }
                }
            });

            console.error("Update Status Bulk only available for AWAITING_PICKUP")
            return;
        } 

        let completionBody = this.bulkOrders.map(item => {
            return {
                orderId : item["order"].id,
                status  : nextCompletionStatus
            }
        });
        
        // First check the order delivery type => Only scheduled to allow choose time
        this._orderslistService.getDeliveryProviderDetails(findGroupedDeliveryProvider[0], this.bulkOrders.length)
            .subscribe(response => {
                const dialogRef = this._dialog.open(ChooseProviderDateTimeComponent, { disableClose: true, data: response });
                dialogRef.afterClosed().subscribe(result => {
                    if (result === "cancelled") {
                        this.bulkOrderSubmitted = false;
                        console.warn("Process cancelled");

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    } else {
                        completionBody["date"] = result.date;
                        completionBody["time"] = result.time;

                        // update the order
                        this._orderslistService.updateOrderBulk(completionBody)
                            .pipe(finalize(() => {
                                this.bulkOrderSubmitted = false;
                                this.bulkOrders = [];
                            }))
                            .subscribe((response) => {                
                                // re-fetch the completion status    
                                completionBody.forEach(item => {
                                    this._orderslistService.getCompletionStatus(item.orderId, item.status).subscribe(() => {
                                    });

                                    let index = this.orders.data.findIndex(element => element.order.id === item.orderId);
                                    if (index > -1) {                                        
                                        this.orders.data[index].selected = null;                                        
                                    }
                                    // this._orderslistService.getOrdersCountSummary(this.serviceTypeControl.value).subscribe()
                                    // this._orderslistService.getOrders(0, 10, 'created', 'desc', '', '', '', '', this.tabControl.value, '', this.serviceTypeControl.value).subscribe()


                                });                                

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            });
                    }
                });
            });
    }

    selectOrder(event, order: Order = null, selectType: string = null) {
        if (selectType === 'all') {
            if (event.checked === true){
                this.orders.data.map(obj => obj.selected = true);
                // set bulk item action to true
                this.bulkOrders = [...this.orders.data];
            }
            else {
                this.orders.data.map(obj => obj.selected = false);
                // set bulk item action to true
                this.bulkOrders = [];
            }
        } else {
            let index = this.orders.data.findIndex(item => item.order.id === order.id);
            if (index > -1) {                
                if (event.checked === true){
                    this.bulkOrders.push(this.orders.data[index]);
                    this.orders.data[index].selected = true;
                }
                else {
                    // find index of bulkOrder from this.orders.data
                    let bulkOrderIndex = this.bulkOrders.findIndex(item => item["order"].id === this.orders.data[index].order.id);

                    if (bulkOrderIndex > -1) {
                        this.bulkOrders.splice(bulkOrderIndex,1);
                        this.orders.data[index].selected = false;
                    }
                }
            }
        }        

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    viewDetails(orderId){
        // this._router.navigateByUrl('/orders/'+orderId)
        const dialogRef = this._dialog.open(OrderInvoiceComponent, { 
            panelClass: 'order-invoice-custom-dialog-class', 
            data: orderId });
        
        dialogRef.afterClosed()
        .subscribe((result) => {
        });
        
    }

    openEditDialog(orderId){
        
        this._orderslistService.getOrderById(orderId)
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((order: Order) => {
  
            this.isRevised = order["data"].isRevised;

            if(this.isRevised ===true){

                //show pop up cannot be edit
                this.displayMessage('Cannot Edit','Order has been previously updated, you can only revise the order once.','OK','Close',false);

            }
            else{
              
                // Open the confirmation dialog
                const confirmation =  this.displayMessage('Edit Order','Have you contacted the buyer to change the order? In case of any dispute, the amount will be refunded to the customer.','Yes','No',true);

                // Subscribe to the confirmation dialog closed action
                confirmation.afterClosed().subscribe((result) => {

                    // If the confirm button pressed...
                    if ( result === 'confirmed' ){
                    // Open the dialog
                    const dialogRef = this._dialog.open(EditOrderComponent, { 
                        width: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
                        height: this.currentScreenSize.includes('sm') ? 'auto' : 'auto',
                        maxWidth: this.currentScreenSize.includes('sm') ? 'auto' : '100vw',  
                        maxHeight: this.currentScreenSize.includes('sm') ? 'auto' : '100vh',
                    
                        panelClass: 'edit-order-custom-dialog-class', 
                        data: orderId });

                    dialogRef.afterClosed()
                                .subscribe((result) => {
                                });
                    }
            
                });
                
            }
     
        });
        

    }

    openDetailsDialog(orderId){
        
            // Open the dialog
            const dialogRef = this._dialog.open(OrderDetailsComponent, { 
                width: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
                height: this.currentScreenSize.includes('sm') ? 'auto' : 'auto',
                maxWidth: this.currentScreenSize.includes('sm') ? 'auto' : '100vw',  
                maxHeight: this.currentScreenSize.includes('sm') ? 'auto' : '100vh',
                panelClass: 'order-details-custom-dialog-class', 
                data: orderId });
            
            dialogRef.afterClosed()
            .subscribe((result) => {
            });
    }  

    getOrderCountSummaryName(completionStatus: string) {
        let index = this._orderCountSummary.findIndex(item => item.completionStatus.includes(completionStatus));

        if (index > -1) {
            return this._orderCountSummary[index].label;
        } else {
            return false;
        }
    }

    
    displayMessage(getTitle:string,getMessage:string,getLabelConfirm:string,getLabelCancel?:string,showLabelCancel?:boolean,getShowIcon?:boolean):MatDialogRef<FuseConfirmationDialogComponent,any>{

        const confirmation = this._fuseConfirmationService.open({
            title  : getTitle,
            message: getMessage,
            icon       : {
              show : getShowIcon,
            },
            actions: {
                confirm: {
                    label: getLabelConfirm
                },
                cancel : {
                  label:getLabelCancel,
                  show:showLabelCancel
                }
            }
        });
  
        return confirmation;
  
      }



}
