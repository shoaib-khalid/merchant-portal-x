import { SelectionModel } from '@angular/cdk/collections';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { Router, ActivatedRoute } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { InventoryService } from 'app/core/product/inventory.service';
import { AddOnGroupProduct, AddOnGroupTemplate, AddOnItemProduct, AddOnItemTemplate, AddOnProduct } from 'app/core/product/inventory.types';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { debounceTime, delay, lastValueFrom, Observable, Subject, switchMap, takeUntil } from 'rxjs';


export interface ItemTemplateList 
{
    addonTemplateItemId : string,
    name                : string,
    dineInPrice         : number,
    price               : number,
    id?                 : string,
    sequenceNumber?     : number,
    productId           : string
}
@Component({
    selector       : 'add-on-product',
    templateUrl    : './add-on-product.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles         : [
        `
            .option-grid {
                grid-template-columns: 52px 120px 76px 246px 42px;
                @screen lg {
                    grid-template-columns: 52px 120px 76px auto 42px;
                }
            }

            /* .addon-details-grid {
                height: 60vh;
                max-height: 470px;
            } */

            .cdk-drag-preview {
                box-sizing: border-box;
                border-radius: 4px;
                box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                            0 8px 10px 1px rgba(0, 0, 0, 0.14),
                            0 3px 14px 2px rgba(0, 0, 0, 0.12);
            }

            .cdk-drag-placeholder {
                opacity: 0;
            }

            .cdk-drag-animating {
                transition: transform 150ms cubic-bezier(0, 0, 0.2, 1);
            }

            .list-class.cdk-drop-list-dragging .contain-class:not(.cdk-drag-placeholder) {
                transition: transform 150ms cubic-bezier(0, 0, 0.2, 1);
            }

            /** Custom input number **/
            input[type='number']::-webkit-inner-spin-button,
            input[type='number']::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }

            input[type='number'] {
                -moz-appearance:textfield;
            }
        `
    ] 
})
export class AddOnProductComponent
{
    @Output() dataFromAddOnEmitter = new EventEmitter();
    @Input() data: any;  
    @ViewChild('templateSelector') selectDropdown: MatSelect;
    

    addOnGroupTemplates$: Observable<AddOnGroupTemplate[]>;
    templatesList: AddOnGroupTemplate[] = [];
    templateFormControl: FormControl = new FormControl();

    addOnGroupOnProductList: AddOnGroupProduct[] = [];
    addOnsOnProductList: AddOnProduct[] = [];

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    allSelected: boolean = false;
    store: Store = null;

    selectedGroupTemplate: AddOnGroupTemplate = null; // On select group template dropdown
    selectedItemsTemplates: AddOnItemTemplate[] = []; // On select items template checkbox
    selectedGroupOnProduct: AddOnProduct = null; // On select addon group on the table
    selectedGroupOnProductIndex: number = null; // Position of addon group on the table

    setOrderEnabled: boolean = false;
    dropUpperLevelCalled: boolean = false;
    minAllowed: number = 0;
    maxAllowed: number = 0;
    productId: string = null;
    itemTemplatesList: ItemTemplateList[]; // For HTML listing

    itemsArrayForCreation: {
        addonTemplateItemId: string,
        name: string,
        dineInPrice: number,
        price: number,
        id?: string,
        sequenceNumber?: number,
        productId: string
    }[]; // To be probitioned to BE

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: FormBuilder,
        private _inventoryService: InventoryService,
        private _storesService: StoresService,
        public _dialog: MatDialog,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,

    )
    {
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.productId = this.data;
        
        // Get the addOnGroupTemplates
        this.addOnGroupTemplates$ = this._inventoryService.addOnGroupTemplates$;

        this.addOnGroupTemplates$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((templates: AddOnGroupTemplate[]) => {

                if (templates) {
                    this.templatesList = templates;
                }
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            })


        this._inventoryService.addOnsProduct$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((items: AddOnProduct[]) => {

                if (items) {
                    this.addOnsOnProductList = items;
                }
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            })

        // Get the stores
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {
                
                if (store) {
                    this.store = store;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // set initial selection
        this.templateFormControl.setValue([]);
        this.templateFormControl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll), debounceTime(300))
            .subscribe((result) => {
                
                this._inventoryService.getAddOnGroupTemplates({page: 0, pageSize: 30, storeId: this.store.id})
                .subscribe(()=>{
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            });

        // Mark for check
        this._changeDetectorRef.markForCheck();
        
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        this._inventoryService.addOnsProduct = null;
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item ? item.id : undefined;
    }

    saveAddOn() {
        
    }

    selectTemplateItemsUpdate(templateItem: ItemTemplateList, isChecked: any) {
        let selectedItemIndex = this.addOnsOnProductList[this.selectedGroupOnProductIndex].productAddOnItemDetail.findIndex(x => x.addonTemplateItemId === templateItem.addonTemplateItemId);

        if (isChecked === true) {
            if (selectedItemIndex === -1) {
                this.addOnsOnProductList[this.selectedGroupOnProductIndex].productAddOnItemDetail.push({
                    addonTemplateItemId : templateItem.addonTemplateItemId,
                    dineInPrice         : templateItem.dineInPrice,
                    id                  : null,
                    price               : templateItem.price,
                    productId           : this.productId,
                    sequenceNumber      : this.addOnsOnProductList[this.selectedGroupOnProductIndex].productAddOnItemDetail.length + 1,
                    status              : 'AVAILABLE',
                    name                : templateItem.name,
                    productAddonGroupId : this.addOnsOnProductList[this.selectedGroupOnProductIndex].id
                })

            }

        }
        else if (isChecked === false) {
            if (selectedItemIndex > -1) {
                if (this.addOnsOnProductList[this.selectedGroupOnProductIndex].productAddOnItemDetail[selectedItemIndex].id) {
                    this._inventoryService.deleteAddOnItemOnProduct(this.addOnsOnProductList[this.selectedGroupOnProductIndex].productAddOnItemDetail[selectedItemIndex].id)
                    .subscribe()
                }
                this.addOnsOnProductList[this.selectedGroupOnProductIndex].productAddOnItemDetail.splice(selectedItemIndex, 1);

            }
        }
        this.selectedGroupOnProduct = this.addOnsOnProductList[this.selectedGroupOnProductIndex];
        
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    selectAllTemplateItems(templateItems: ItemTemplateList[], isChecked: boolean) {
        if (templateItems) {

            if (isChecked) {
                this.selectedItemsTemplates = templateItems.map(templateItem => {
                    return {
                        dineInPrice : templateItem.dineInPrice,
                        groupId     : this.selectedGroupTemplate.id,
                        id          : templateItem.addonTemplateItemId,
                        name        : templateItem.name,
                        price       : templateItem.price
                    }
                })
                this.allSelected = true;
            }
            else {
                this.selectedItemsTemplates = [];
                this.allSelected = false;
            }
            this.selectedGroupTemplate.addOnTemplateItem = this.selectedItemsTemplates;
            this.maxAllowed = this.selectedItemsTemplates.length > 0 ? this.selectedItemsTemplates.length : 1;
        }
        else return;
    }

    validateAllCheckbox() {
        if (this.allSelected) {
            return true;
        }
        else return false;
    }

    selectTemplateItemsCreate(templateItem: ItemTemplateList, isChecked: any){

        let selectedItemIndex = this.selectedItemsTemplates.findIndex(x => x.id === templateItem.addonTemplateItemId);

        if (isChecked === true) {
            if (selectedItemIndex === -1) {
                this.selectedItemsTemplates.push({
                    dineInPrice : templateItem.dineInPrice,
                    groupId     : this.selectedGroupTemplate.id,
                    id          : templateItem.addonTemplateItemId,
                    name        : templateItem.name,
                    price       : templateItem.price
                })
            }
        }
        else if (isChecked === false) {
            if (selectedItemIndex > -1) {
                this.selectedItemsTemplates.splice(selectedItemIndex, 1)
            }
        }
        this.selectedGroupTemplate.addOnTemplateItem = this.selectedItemsTemplates;
        this.maxAllowed = this.selectedItemsTemplates.length > 0 ? this.selectedItemsTemplates.length : 1;

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    selectTemplate(template: AddOnGroupTemplate) {
        this.selectedGroupTemplate = null;
        this.selectedItemsTemplates = [];
        this.itemTemplatesList = [];
        this.maxAllowed = 1;
        this.allSelected = false;
        this.selectedGroupTemplate = template;

        this._inventoryService.getAddOnItemTemplates({page: 0, pageSize: 20, groupId: template.id})
        .subscribe(items => {
            
            this.itemTemplatesList = items.map(item => {
                return {
                    addonTemplateItemId: item.id,
                    name: item.name,
                    dineInPrice: item.dineInPrice,
                    price: item.price,
                    id: null,
                    productId: this.productId
                }
            })
            // Mark for check
            this._changeDetectorRef.markForCheck();
        })
    }

    totalAllowedItems(value: number, type: string) {

        if (type === 'min') {
            this.minAllowed = value;
        }
        else if (type === 'max') {
            this.maxAllowed = value;
        }
    }

    async reorderList(toggleValue: boolean) {
        if (toggleValue === true) {
            this.resetSelectedGroup();
        }
        if (toggleValue === false && this.dropUpperLevelCalled === true) {
            // Update the sequence number
            for (let index = 0; index < this.addOnsOnProductList.length; index++) {
                const element = this.addOnsOnProductList[index];
                const group = {
                    addonTemplateGroupId: element.groupId,
                    maxAllowed          : element.maxAllowed,
                    minAllowed          : element.minAllowed,
                    productId           : this.productId,
                    sequenceNumber      : index + 1,
                    status              : 'AVAILABLE'
                }
                await lastValueFrom(this._inventoryService.updateAddOnGroupOnProduct(element.id, group))
            }

            this._inventoryService.getAddOnItemsOnProduct({productId: this.productId}).subscribe(() => {})
            this.dropUpperLevelCalled = false;
            this.setOrderEnabled = false;

            // Mark for check
            this._changeDetectorRef.markForCheck();
            
        }
        // Emit toggle state to parent component - to disable Update button
        this.dataFromAddOnEmitter.emit(toggleValue)
    }

    dropUpperLevel(event: CdkDragDrop<string[]>, index?: any) {
        
        moveItemInArray(this.addOnsOnProductList, event.previousIndex, event.currentIndex);
        this.dropUpperLevelCalled = true;
        
        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    drop(event: CdkDragDrop<string[]>, index: any) {
        
        moveItemInArray(this.addOnsOnProductList[index].productAddOnItemDetail, event.previousIndex, event.currentIndex);
        
        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    selectGroup(addOn: AddOnProduct, index: number) {

        this.allSelected = false;

        this._inventoryService.getAddOnGroupTemplateById(addOn.groupId)
            .subscribe((resp: AddOnGroupTemplate) => {

                this.selectedGroupTemplate = resp;

                this.itemTemplatesList = resp.addOnTemplateItem.map(item => {
                    return {
                        addonTemplateItemId: item.id,
                        name: item.name,
                        dineInPrice: item.dineInPrice,
                        price: item.price,
                        id: null,
                        productId: this.productId
                    }
                })

                // Mark for check
                this._changeDetectorRef.markForCheck();
            })
            
        this.selectedGroupOnProduct = addOn;
        this.selectedGroupOnProductIndex = index;
        this.maxAllowed = addOn.maxAllowed;
        this.minAllowed = addOn.minAllowed;

        // Emit toggle state to parent component - to disable Update button
        this.dataFromAddOnEmitter.emit(this.selectedGroupOnProduct ? true : false)

        // Mark for check
        this._changeDetectorRef.markForCheck();
        
    }

    updateSelectedGroup() {

        if (this.selectedGroupOnProduct) {

            const group = {
                addonTemplateGroupId: this.selectedGroupOnProduct.groupId,
                maxAllowed  : this.maxAllowed,
                minAllowed  : this.minAllowed,
                productId   : this.productId,
                sequenceNumber: this.selectedGroupOnProduct.sequenceNumber ? this.selectedGroupOnProduct.sequenceNumber : 0,
                status        : 'AVAILABLE'
            }

            const items = this.selectedGroupOnProduct.productAddOnItemDetail.map((item, index) => {
                return {
                    addonTemplateItemId: item.addonTemplateItemId,
                    dineInPrice: item.dineInPrice,
                    price: item.price,
                    productId: this.productId,
                    sequenceNumber: index + 1,
                    id: item.id,
                    status: 'AVAILABLE',
                    name: item.name,
                    productAddonGroupId: this.selectedGroupOnProduct.id
                }
            })

            this._inventoryService.updateAddOnGroupOnProduct(this.selectedGroupOnProduct.id, group)
                .pipe(
                    switchMap(() => {
                        return this._inventoryService.createAddOnItemOnProductBulk(items)
                    }),
                    delay(100),
                    switchMap(() => {
                        return this._inventoryService.getAddOnItemsOnProduct({productId: this.productId})
                    })
                )
                .subscribe(() => {
                    this.resetSelectedGroup();
                    
                })
        }
    }

    createSelectedTemplate() {

        if ( this.selectedGroupTemplate) {

            let biggestSeq = Math.max(...this.addOnsOnProductList.map(x => x.sequenceNumber))

            const group = {
                addonTemplateGroupId: this.selectedGroupTemplate.id,
                maxAllowed  : this.maxAllowed,
                minAllowed  : this.minAllowed,
                productId   : this.productId,
                sequenceNumber: biggestSeq > -1 ? biggestSeq + 1 : 0,
                status        : 'AVAILABLE'
            }

            this._inventoryService.createAddOnGroupOnProduct(group)
                .pipe(
                    switchMap((respGroup: AddOnGroupProduct) => {
                        let sequence = 1;

                        const items = this.selectedGroupTemplate.addOnTemplateItem.map(item => {
                            return {
                                addonTemplateItemId: item.id,
                                dineInPrice: item.dineInPrice,
                                price: item.price,
                                productId: this.productId,
                                sequenceNumber: sequence++,
                                id: null,
                                status: 'AVAILABLE',
                                name: item.name,
                                productAddonGroupId: respGroup.id
                            }
                        })
            
                        return this._inventoryService.createAddOnItemOnProductBulk(items)
                    }),
                    delay(100),
                    switchMap(() => {
                        return this._inventoryService.getAddOnItemsOnProduct({productId: this.productId})
                    })
                )
                .subscribe(() => {
                    this.resetSelectedGroup();
                })
        }

    }


    resetSelectedGroup() {
        this.selectedGroupOnProduct = null;
        this.selectedGroupTemplate = null;
        this.selectedItemsTemplates = [];
        this.selectedGroupOnProductIndex = null;
        this.itemTemplatesList = [];
        if (this.selectDropdown) this.selectDropdown.value = null;
        this.maxAllowed = 0;
        this.minAllowed = 0;
        this.allSelected = false;

        // Emit toggle state to parent component - to disable Update button
        this.dataFromAddOnEmitter.emit(false)

        // Mark for check
        this._changeDetectorRef.markForCheck();
        
    }

    deleteAddOn(id: string) {
        this._inventoryService.deleteAddOnGroupOnProduct(id)
        .subscribe(()=> {})
    }

    validateCheckbox(id: string) {

        const found = this.selectedGroupOnProduct.productAddOnItemDetail.some(el => el.addonTemplateItemId === id);
        if (found) return true
        else return false        
    }

    templateListValidation(template: AddOnGroupTemplate) {
        // If the template already being added to the product, disable the option 
        if (this.addOnsOnProductList.some(group => template.id === group.groupId)) {
            return true;
        }
        else return false;
    }

}
