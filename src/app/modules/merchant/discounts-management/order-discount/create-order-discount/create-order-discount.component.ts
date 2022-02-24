import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { DiscountsService } from '../order-discount-list/order-discount-list.service';
import { StoreDiscountTierList } from '../order-discount-list/order-discount-list.types';


@Component({
  selector: 'dialog-create-order-discount',
  templateUrl: './create-order-discount.component.html',
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
    `]
})
export class CreateOrderDiscountDialogComponent implements OnInit {

    disabledProceed: boolean = true;

    discountName: string;
    status: boolean;
    discountType: string;
    isActive: boolean;
    maxDiscountAmount: string;
    normalPriceItemOnly: boolean;

    checkdate = false;
    checkname = false;
    checkstatus = false;
    checktype = false;
    checkdiscountamount = false;

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

    changeStartTime:string;
    changeEndTime:string;


    message: string = "";

    horizontalStepperForm: FormGroup;
    storeDiscountTierList: FormArray;

    storeDiscountTierListValueEditMode:any = [];

    // discount tier for insert mode
    calculationType: string;
    discountAmount: number;
    // endTotalSalesAmount: number;
    startTotalSalesAmount: number;

    //disable add tier button 
    isDisplayAddTier : boolean = false;


  constructor(
    public dialogRef: MatDialogRef<CreateOrderDiscountDialogComponent>,
    private _formBuilder: FormBuilder,
    private _fuseConfirmationService: FuseConfirmationService,
    private _discountService: DiscountsService,
    private _changeDetectorRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // let today = new Date();
    // let yy = today.getFullYear();
    // let mm = String(today.getMonth() + 1).padStart(2, '0');
    // let dd = String(today.getDate()).padStart(2, '0');
    // this.minStartDate = yy + '-' + mm + '-' + dd;

    // let now = new Date();
    // let hh = now.getHours();
    // let ms = now.getMinutes();
    // let ss = now.getSeconds();
    // this.minStartTime = hh + ':' + ms;
    this.horizontalStepperForm = this._formBuilder.group({
        //Main Discount
        step1: this._formBuilder.group({
            id               : [''],
            discountName   : [''],
            discountType : [''],
            startDate : [''],
            endDate : [''],
            startTime : [''],
            endTime : [''],
            isActive : [''],
            maxDiscountAmount : [''],
            normalPriceItemOnly : [''],
            storeId          : [''], // not used
        }),
        //Tier List
        step2: this._formBuilder.array([
        
        ]),
    });
  }

  addNewDiscount() {
    this.changeTime();
  
    this.dialogRef.close({ 
        status: true ,
        discountName: this.discountName,
        discountOn: this.discountType,
        startDate: this.startDate,
        startTime: this.changeStartTime,
        endDate: this.endDate,
        endTime: this.changeEndTime,
        isActive :this.isActive,
        maxDiscountAmount :this.maxDiscountAmount,
        normalPriceItemOnly : this.normalPriceItemOnly
    });
  }

  cancelPickupDateTime(){
    this.dialogRef.close({ status: false });
  }
  
  checkName(){           
        // check discount name
        if (this.discountName) {
            this.checkname = true;
            this.message = "";
        }else{
            this.checkname = false;
            this.message = "Please insert discount name";
        }
        
  }

  checkDateTime(){
         // check min end date not less than min start date
         if (this.startDate && this.startTime) {
            // set minimum end date to current selected date
            this.isDisabledStartDateTime = false;
            this.minEndDate = this.startDate;
        }
        // check date
        if (this.startTime && this.endTime && this.endDate && this.startDate) {        
            if (this.startDate < this.endDate){
                this.checkdate = true;
            } else if (this.startDate == this.endDate) {
                if (this.startTime <= this.endTime) {
                    this.checkdate = true;
                } else {
                    this.checkdate = false;
                    this.message = "Date/time range incorrect";
                }
            }
        }
  }

  checkStatus(){
    //check status
     if (this.isActive){
        this.checkstatus = true;
        this.message = ""
        }else{
            this.checkstatus = false;
            this.message = "Please select status option"
        }
  }

  checkDiscountType(){
        //check discount type
        if (this.discountType){
            this.checktype = true;
            this.message = ""
        }else{
            this.checktype = false;
            this.message = "Please select discount type option"
        }
  }

  checkDiscountAmount(){           
    // check discount name
    if (this.maxDiscountAmount) {
        this.checkdiscountamount = true;
        this.message = "";
    }else{
        this.checkdiscountamount = false;
        this.message = "Please insert maximum discount amount";
    }
    
}

  checkForm(){
    
    if (this.checkname === true && this.checkdate === true && this.checkstatus === true && this.checktype === true && this.checkdiscountamount == true) {
        this.disabledProceed = false;
    } else {
        this.disabledProceed = true;
    }
    
  }

  changeTime(){
    //===========Start Time==================
    let pickStartTime = this.startTime;
    let _pickStartTime;

    if ((<any>pickStartTime).timeAmPm === "PM") {
        _pickStartTime = parseInt((<any>pickStartTime).timeHour) + 12;
    } else {
        _pickStartTime = (<any>pickStartTime).timeHour;
    }
    const changePickStartTime = new Date();
    changePickStartTime.setHours(_pickStartTime,(<any>pickStartTime).timeMinute,0);
    
    this.changeStartTime= String(changePickStartTime.getHours()).padStart(2, "0")+':'+String(changePickStartTime.getMinutes()).padStart(2, "0");    
    
    //==============End time===================
    let pickEndTime = this.endTime;
    let _pickEndTime;

    if ((<any>pickEndTime).timeAmPm === "PM") {
        _pickEndTime = parseInt((<any>pickEndTime).timeHour) + 12;
    } else {
        _pickEndTime = (<any>pickEndTime).timeHour;
    }
    const changePickEndTime = new Date();
    changePickEndTime.setHours(_pickEndTime,(<any>pickEndTime).timeMinute,0);
    
    this.changeEndTime= String(changePickEndTime.getHours()).padStart(2, "0")+':'+String(changePickEndTime.getMinutes()).padStart(2, "0");  
    
    return;
  
  }

  cancel(){
    this.dialogRef.close();
  }

  validateDiscountTier(type:string, value){
    if (type === 'startTotalSalesAmount') {
        this.startTotalSalesAmount = value;
    }
    // if (type === 'endTotalSalesAmount') {
    //     this.endTotalSalesAmount = value;
    // }
    if (type === 'discountAmount') {
        this.discountAmount = value;
    }
    if (type === 'calculationType') {
        this.calculationType = value;
    }

    if(<any>this.startTotalSalesAmount === "" || <any>this.discountAmount === "" ){
        this.isDisplayAddTier = false;
    }
    else if(this.startTotalSalesAmount !== undefined && this.discountAmount!==undefined && this.calculationType!==undefined){
        this.isDisplayAddTier = true;
    }

  }

  insertTierToDiscount(){

    // check condition first before pass to backend
    if(this.calculationType === 'PERCENT' && this.discountAmount>100){

        const confirmation = this._fuseConfirmationService.open({
            title  : 'Exceed maximum amount discount percentage',
            message: 'Please change your discount amount for percentage calculation type',
            actions: {
                confirm: {
                    label: 'Ok'
                },
                cancel : {
                    show : false,
                }
            }
        });

        return;
    }

    let discountTier: StoreDiscountTierList = {
        calculationType: this.calculationType,
        discountAmount: this.discountAmount,
        startTotalSalesAmount: this.startTotalSalesAmount,
    }

    // Create the discount
    this._discountService.createDiscountTier(this.horizontalStepperForm.get('step1.id').value,discountTier)
        .subscribe((response) => {
            
            this.storeDiscountTierList = this.horizontalStepperForm.get('step2') as FormArray;

            // since backend give full discount tier list .. (not the only one that have been created only)
            this.storeDiscountTierList.clear();

            response["data"].forEach(item => {
                this.storeDiscountTierList.push(this._formBuilder.group(item));
            });

            //disable button add
            this.isDisplayAddTier=false;
            //clear the input
            (<any>this.startTotalSalesAmount)='';
            (<any>this.discountAmount)='';
            this.calculationType='';

            // Mark for check
            this._changeDetectorRef.markForCheck();
        }, (error) => {
            console.error(error);
            if (error.status === 417) {
                // Open the confirmation dialog
                const confirmation = this._fuseConfirmationService.open({
                    title  : 'Minimum subtotal overlap',
                    message: 'Your minimum subtotal entered overlapping with existing amount! Please change your minimum subtotal',
                    actions: {
                        confirm: {
                            label: 'Ok'
                        },
                        cancel : {
                            show : false,
                        }
                    }
                });
            }
    });

  }

  updateSelectedDiscount(): void
  {
      this.changeTime();
      let sendPayload = [this.horizontalStepperForm.get('step1').value];
      let toBeSendPayload=sendPayload.
      map((x)=>(
          {
              startTime:this.changeStartTime,
              endTime:this.changeEndTime,
              discountName: x.discountName,
              discountType:x.discountType,
              endDate: x.endDate,
              id: x.id,
              isActive: x.isActive,
              maxDiscountAmount: x.maxDiscountAmount,
              normalPriceItemOnly: x.normalPriceItemOnly,
              startDate: x.startDate,
              storeDiscountTierList: this.horizontalStepperForm.get('step2').value,
              storeId: x.storeId,
          }
          ));

      // Update the discount on the server
      this._discountService.updateDiscount(this.horizontalStepperForm.get('step1.id').value, toBeSendPayload[0])
          .subscribe((resp) => {
         
          }, error => {
              console.error(error);

                  if (error.status === 417) {
                      // Open the confirmation dialog
                      const confirmation = this._fuseConfirmationService.open({
                          title  : 'Discount date overlap',
                          message: 'Your discount date range entered overlapping with existing discount date! Please change your date range',
                          actions: {
                              confirm: {
                                  label: 'Ok'
                              },
                              cancel : {
                                  show : false,
                              }
                          }
                      });
                  }
              }
          );

        this.cancel();
  }
}
