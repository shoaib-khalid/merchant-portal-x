import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { OrdersListService } from 'app/modules/merchant/orders-management/orders-list/orders-list.service';
import { Order, OrdersCountSummary, OrdersListPagination } from 'app/modules/merchant/orders-management/orders-list/orders-list.types'
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrderDetailsComponent } from 'app/modules/merchant/orders-management/order-details/order-details.component';
import { ChooseProviderDateTimeComponent } from 'app/modules/merchant/orders-management/choose-provider-datetime/choose-provider-datetime.component';
import { Router } from '@angular/router';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector       : 'orders-list',
    templateUrl    : './orders-list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('selectFilter', {read: MatSelect})  _filter: MatSelect;


    openTab: string = "HISTORY";

    store: Store;

    orderCountSummary: OrdersCountSummary[];
    _orderCountSummary: any;

    pagination: OrdersListPagination;
    isLoading: boolean = false;
    filterControl: FormControl = new FormControl();
    tabControl: FormControl = new FormControl();
    filterList: string = "name";

    range: any;

    recentTransactionsDataSource: MatTableDataSource<any> = new MatTableDataSource();
    recentTransactionsTableColumns: string[] = ['transactionId', 'date', 'name', 'amount', 'status', 'action'];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _orderslistService: OrdersListService,
        private _storesService: StoresService,
        public _dialog: MatDialog,
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
        this.tabControl.setValue("");

        // Get the data
        this._orderslistService.orders$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {

                // Store the table data
                this.recentTransactionsDataSource.data = data;

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

        this._orderCountSummary = [
            { id: "NEW", label: "New", completionStatus: ["PAYMENT_CONFIRMED", "RECEIVED_AT_STORE"], count: 0 },
            { id: "PROCESS", label: "Process", completionStatus: "BEING_PREPARED", count: 0 },
            { id: "AWAITING_PICKUP", label: "Awaiting Pickup", completionStatus: "AWAITING_PICKUP", count: 0 },
            { id: "SENT_OUT", label: "Sent Out", completionStatus: "BEING_DELIVERED", count: 0 },
            { id: "DELIVERED", label: "Delivered", completionStatus: "DELIVERED_TO_CUSTOMER", count: 0 },
            { id: "CANCELLED", label: "Cancelled", completionStatus: "REJECTED_BY_STORE", count: 0 },
            { id: "HISTORY", label: "History", completionStatus: ["PAYMENT_CONFIRMED", "RECEIVED_AT_STORE", "BEING_PREPARED", "AWAITING_PICKUP", "BEING_DELIVERED", "DELIVERED_TO_CUSTOMER", "REJECTED_BY_STORE"], count: 0 }
        ];

        this._orderslistService.ordersCountSummary$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {

                this.orderCountSummary = response;

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
            });
            
        // get store
        this._storesService.store$.subscribe((response) => {
            this.store = response;
        })

        this.filterControl.valueChanges
        .pipe(
            takeUntil(this._unsubscribeAll),
            debounceTime(300),
            switchMap((query) => {
                this.isLoading = true;
                return this._orderslistService.getOrders(0, 10, 'name', 'asc', query, '', '', '', this.tabControl.value);
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
                return this._orderslistService.getOrders(0, 10, 'name', 'asc', '', '', '', '', query);
            }),
            map(() => {
                this.isLoading = false;
            })
        )
        .subscribe();
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
                });
                
                // Get products if sort or page changes
                merge(this._sort.sortChange, this._paginator.page).pipe(
                    switchMap(() => {
                        this.isLoading = true;
                        return this._orderslistService.getOrders(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '' , '', '', '', this.tabControl.value);
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
        this._unsubscribeAll.next();
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
        if (displayStatuses !== "HISTORY") {
            this.recentTransactionsTableColumns = ['transactionId', 'date', 'name', 'amount', 'action'];
        } else {
            this.recentTransactionsTableColumns = ['transactionId', 'date', 'name', 'amount', 'status', 'action'];
        }

        this.tabControl.setValue(this._orderCountSummary.find(item => item.id === this.openTab).completionStatus);

        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    clearFilter(){
        this.filterControl.reset();
    }

    openSelector() {
        this._filter.open();
    }

    updateStatus(order: Order, nextCompletionStatus){

        let completionBody = {
            nextCompletionStatus: nextCompletionStatus
        };
        
        // First check the order delivery type => Only scheduled to allow choose time
        if (order.deliveryType === "SCHEDULED") {
            this._orderslistService.getDeliveryProviderDetails(order.orderShipmentDetail.deliveryProviderId)
                .subscribe(response => {
                    const dialogRef = this._dialog.open(ChooseProviderDateTimeComponent, { disableClose: true, data: response });
                    dialogRef.afterClosed().subscribe(result => {
                        if (result === "cancelled" || !result.date || !result.time){
                            console.warn("Process cancelled")
                        } else {
                            completionBody["date"] = result.date;
                            completionBody["time"] = result.time;

                            this._orderslistService.updateOrder(order.id, completionBody)
                                .subscribe((response) => {                    
                                    this._orderslistService.updateCompletion(order.id, nextCompletionStatus).subscribe(() => {
                                    });
                    
                                    // Mark for check
                                    this._changeDetectorRef.markForCheck();
                                });
                        }
                    });
                });
        } else {
            this._orderslistService.updateOrder(order.id, completionBody)
                .subscribe((response) => {
    
                    this._orderslistService.updateCompletion(order.id, nextCompletionStatus).subscribe(() => {
                    });
    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
        }
    }

    viewDetails(orderId){
        this._router.navigateByUrl('/orders/'+orderId)
    }

}
