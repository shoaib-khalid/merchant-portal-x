import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Subject } from "rxjs";
import { ReservationInvoiceComponent } from "./reservation-invoice/reservation-invoice.component";

@Component({
    selector       : 'reservation-list',
    templateUrl    : './reservation-management.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('recentTransactionsTable', {read: MatSort}) recentTransactionsTableMatSort: MatSort;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    transactions: any[] = [];
    
    recentTransactionsDataSource: MatTableDataSource<any> = new MatTableDataSource();
    recentTransactionsTableColumns: string[] = ['transactionId', 'date', 'time', 'amount', 'reservation','name', 'contact','details', 'action'];
    
    /**
    * Constructor
    */
    constructor(
        public _dialog: MatDialog,
    )
    {
    }
    /**
    * On init
    */
    ngOnInit(): void
    {
        // Store the table data
        this.transactions = [
            {
                name       : "John Snow",
                id         : "ATF001016",
                phoneNumber: "019-9099099",
                periods    : "4 days ago",
                time       : "3.00PM",
                platform   : "(MTRADE2)",
                reservation: "HSK92719",
            },
            {
                name       : "Hayley Atwell",
                id         : "ATF001017",
                phoneNumber: "011-42749042",
                periods    : "1 minutes ago",
                time       : "4.00PM",
                platform   : "(MTRADE2)",
                reservation: "KSN92711",
            },
            {
                name       : "Gigi Hadid",
                id         : "ATF001018",
                phoneNumber: "019-9099099",
                periods    : "10 days ago",
                time       : "6.00PM",
                platform   : "(MTRADE2)",
                reservation: "OSW23812",            },
            {
                name       : "Rajen Materazzo",
                id         : "ATF001019",
                phoneNumber: "015-2830012",
                periods    : "15 days ago",
                time       : "3.00PM",
                platform   : "(MTRADE2)",
                reservation: "PEK92371",            },
            {
                name       : "Cassius Clay",
                id         : "ATF001020",
                phoneNumber: "019-9099099",
                periods    : "16 days ago",
                time       : "8.00PM",
                platform   : "(MTRADE2)",
                reservation: "IOW92180",            },
        ]

        this.recentTransactionsDataSource.data = this.transactions
    }

    /**
    * After view init
    */
    ngAfterViewInit(): void
    {
        // Make the data source sortable
        this.recentTransactionsDataSource.sort = this.recentTransactionsTableMatSort;
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

    viewDetails(orderId){
        // this._router.navigateByUrl('/orders/'+orderId)
        const dialogRef = this._dialog.open(ReservationInvoiceComponent, { panelClass: 'reservation-invoice-custom-dialog-class', data: orderId });
        
        dialogRef.afterClosed()
        .subscribe((result) => {

            console.log("resak", result);
            
        });
        
    }
}