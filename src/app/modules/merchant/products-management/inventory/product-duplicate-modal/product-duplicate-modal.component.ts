import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { CartService } from 'app/core/cart/cart.service';
import { InventoryService } from 'app/core/product/inventory.service';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { debounceTime, delay, forkJoin, of, Subject, switchMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'product-duplicate-modal',
  templateUrl: './product-duplicate-modal.component.html',
})
export class DuplicateProductsModalComponent implements OnInit {

    selectedStore: Store = null;
    stores: Store[] = [];
    isDuplicating: boolean = false;
    storeList: FormControl = new FormControl();
    cloneErrorMessage: string = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    store$: Store;

	constructor(
		private dialogRef: MatDialogRef<DuplicateProductsModalComponent>,
		private _cartService: CartService,
		@Inject(MAT_DIALOG_DATA) private data: string[],
        private _storesService: StoresService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _inventoryService: InventoryService,

	) 
	{
	}

	ngOnInit(): void {

        // Get the store
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {

                // Update the pagination
                this.store$ = store;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        

        // Get the stores
        this._storesService.storesList$
        .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(response => {

                this.stores = response;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        
        // set initial selection
        this.storeList.setValue([]);
        this.storeList.valueChanges
            .pipe(takeUntil(this._unsubscribeAll), debounceTime(300))
            .subscribe((result) => {
                
                this._storesService.getStoresList("", 0, 20, 'name', 'asc', result, this.store$.verticalCode )
                .subscribe((response)=>{
                    this.stores = response;
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            });
	}

    duplicateProducts() {

        if (this.selectedStore) {
            this._inventoryService.cloneSelectedStoreProducts(this.store$.id, this.selectedStore.id, this.data)
                .pipe(
                    tap(() => {
                        this.isDuplicating = true;
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }),
                    delay(2000),
                    switchMap(cloned => {
                        if (cloned.error) {
                            console.error('Cloning unsuccessful:', cloned.error)
                            this.cloneErrorMessage = cloned.error;
                            return of(null)
                        }
                        // If success only then we get products and categories
                        else {
                            this.cloneErrorMessage = 'SUCCESS';
                            return of('success')
                        }
                    })
                )
                .subscribe(response => {
                    this.isDuplicating = false;
                    setTimeout(() => {
                        this.dialogRef.close('closed');
                        
                    }, 1000);

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                })
        }
        
    }

	cancelButton() {
		this.dialogRef.close();
	}


}
