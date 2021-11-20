import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { FlowsListService } from 'app/modules/merchant/social-media/flows-list/flows-list.service';
import { FlowsListPagination } from 'app/modules/merchant/social-media/flows-list/flows-list.types'
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector       : 'flows-list',
    templateUrl    : './flows-list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowsListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('selectFilter', {read: MatSelect})  _filter: MatSelect;


    flows: any;
    openTab: string = "HISTORY";
    displayStatuses: any = [];
    completionStatuses: any = [];

    pagination: FlowsListPagination;
    isLoading: boolean = false;
    filterControl: FormControl = new FormControl();
    tabControl: FormControl = new FormControl();
    filterList: string = "name";

    range: any;

    flowsList: MatTableDataSource<any> = new MatTableDataSource();
    flowsListTableColumns: string[] = ['title', 'description', 'status', 'details'];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _flowslistService: FlowsListService,
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
        this._flowslistService.flows$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {

                // Store the table data
                this.flowsList.data = data;

                // Mark for check
                this._changeDetectorRef.markForCheck();

            });

        // Get the pagination
        this._flowslistService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: FlowsListPagination) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // completion statuses from backend
        this.completionStatuses = [
            {
                id: "PAYMENT_CONFIRMED",
                label: "New",
                nextId: "BEING_PREPARED",
                nextLabel: "Process",
                nextLabelBtn: "Process",
            },
            {
                id: "RECEIVED_AT_STORE",
                label: "New",
                nextId: "BEING_PREPARED",
                nextLabel: "Process",
                nextLabelBtn: "Process",
            },
            {
                id: "BEING_PREPARED",
                label: "Process",
                nextId: "AWAITING_PICKUP",
                nextLabel: "Ready for Pickup",
                nextLabelBtn: "Ready",
            },
            {
                id: "AWAITING_PICKUP",
                label: "Ready for Pickup",
                nextId: "BEING_DELIVERED",
                nextLabel: "Sent",
                nextLabelBtn: "Sent",
            },
            {
                id: "BEING_DELIVERED",
                label: "Send",
                nextId: "DELIVERED_TO_CUSTOMER",
                nextLabel: "Received",
                nextLabelBtn: "Received",
            },
            {
                id: "DELIVERED_TO_CUSTOMER",
                label: "Delivered",
                nextId: null,
                nextLabel: null,
                nextLabelBtn: null,
            },
            {
                id: "HISTORY",
                label: "History",
                nextId: null,
                nextLabel: null,
                nextLabelBtn: null,
            }
        ];

        // display statuses is view at frontend
        this.displayStatuses = ["NEW","BEING_PREPARED","AWAITING_PICKUP","BEING_DELIVERED","DELIVERED_TO_CUSTOMER","HISTORY"];

        this.filterControl.valueChanges
        .pipe(
            takeUntil(this._unsubscribeAll),
            debounceTime(300),
            switchMap((query) => {
                console.log("Query filter: ",query)
                this.isLoading = true;
                return this._flowslistService.getFlows(0, 10, 'name', 'asc', query, '', '', '', this.tabControl.value);
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
                console.log("Query tab: ",query)
                this.isLoading = true;
                //kena ubah
                return this._flowslistService.getFlows(0, 10, 'name', 'asc', '', '', '', '', query);
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
                
                // If the user changes the sort flow...
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
                        return this._flowslistService.getFlows(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '' , '', '', '', this.tabControl.value);
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
        if (displayStatuses === "HISTORY") {
            currentOpenTab = "";
        }

        if (displayStatuses === "NEW") {
            currentOpenTab = "PAYMENT_CONFIRMED";
        }

        this.tabControl.setValue(currentOpenTab);

        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    clearFilter(){
        this.filterControl.reset();
    }

    openSelector() {
        this._filter.open();
    }

    updateStatus(flowId, nextCompletionStatus){
        this._flowslistService.updateFlow(flowId,nextCompletionStatus)
            .subscribe((response) => {
                console.log("OK");

                this._flowslistService.updateCompletion(flowId, nextCompletionStatus);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            },
            (response) => {
                console.log("NOT OK");
                // // Set the alert
                // this.alert = {
                //     type   : 'error',
                //     message: 'Something went wrong, please try again.'
                // };

                // // Show the alert
                // this.alert = true;
            });
    }

    getNextCompletionStatus(id){
        let index = this.completionStatuses.findIndex(item => item.id === id);

        if (index > -1){
            return this.completionStatuses[index];
        } else {
            return "Undefined";
        } 
    }

    viewDetails(flowId){
        console.log("flowId",flowId)
        this._router.navigateByUrl('social-media/flow-builder/'+flowId)
    }

}
