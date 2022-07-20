import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ResourceService } from 'app/core/resource/resource.service';
import { Resource, ResourceAvailability, ResourceSlotReservation } from 'app/core/resource/resource.types';
import { Subject, takeUntil } from 'rxjs';

@Component({
	selector: 'app-day-off',
	templateUrl: './day-off.component.html',
	styles: [
		`
	.custom-edit-resource-dialog {

		:host ::ng-deep .mat-horizontal-content-container {
			 /* max-height: 90vh; */
			padding: 0 0px 20px 0px;
			/* overflow-y: auto; */
		}
	
		:host ::ng-deep .mat-horizontal-stepper-header-container {
			 /* height: 60px; */
		}
	
		:host ::ng-deep .mat-horizontal-stepper-header {
			height: 60px;
			padding-left: 8px;
			padding-right: 8px;
		}
	
		:host ::ng-deep .mat-paginator .mat-paginator-container {
			padding: 0px 16px;
			justify-content: center;
		}
	
		:host ::ng-deep .mat-paginator-outer-container {
			display: flex;
			height: 40px;
		}
	}
	
	.content {
	
		max-height: 90vh;
		height: 90vh;
	
		@screen sm {
			max-height: 560px;
			height: 75vh;
		}
	
		/* overflow-y: auto; */
	}
	
	:host ::ng-deep .ql-container .ql-editor {
		min-height: 87px;
		max-height: 87px;
		height: 87px;
	}
	
	.edit-daysoff-grid {
            grid-template-columns: 0px auto auto 0px;

            @screen xl {
                grid-template-columns: 0px auto auto 0px;
            }
        }`]
})

export class DayOffComponent implements OnInit {

	dayoffForm = this._formBuilder.group({
		date: ['']
	});

	daysoffListForm: FormArray;

	dayoffDate: string;
	isLoading = true;

	flashMessage: 'success' | 'error' | 'warning' | null = null;

	daysoffList: ResourceSlotReservation[] = [];

	_listOfResourceSlotReservation: ResourceSlotReservation[] = [];

	storeDiscountTierListValueEditMode: any = [];

	resourceId: string;

	listOfResourceAvailabilities: ResourceAvailability[] = [];

	selectedAvailability: ResourceAvailability;

	private _unsubscribeAll: Subject<any> = new Subject<any>();


	constructor(
		private _formBuilder: FormBuilder,
		private _changeDetectorRef: ChangeDetectorRef,
		public dialogRef: MatDialogRef<DayOffComponent>,
		private _resourceService: ResourceService,
		@Inject(MAT_DIALOG_DATA) public data: MatDialog,
	) {

	}

	ngOnInit(): void {

		this.daysoffListForm = this._formBuilder.array([]);

		this.resourceId = this.data["resourceId"];

		// Get all the resource availabilites Of the resource
		this._resourceService.getAllResourceAvailabilitesByResource(this.resourceId).subscribe((res) => {
			this.listOfResourceAvailabilities = res["data"];

			// Mark for check
			this._changeDetectorRef.markForCheck();
		});
		this.isLoading = false;
	}

	showFlashMessage(type: 'success' | 'error' | 'warning'): void {
		// Show the message
		this.flashMessage = type;

		// Mark for check
		this._changeDetectorRef.markForCheck();

		// Hide it after 3 seconds
		setTimeout(() => {

			this.flashMessage = null;

			// Mark for check
			this._changeDetectorRef.markForCheck();
		}, 3000);
	}

	abc() {
		console.log("Resource: ", this.selectedAvailability);
	}

	closeDialog() {
		this.dialogRef.close({ valid: false });
	}

	validate(type: string, value) {
		if (type === "availalbility") {
			this.selectedAvailability = value;
		}

	}

	setDayoff() {
		let date : string;
		date = this.dayoffForm.get('date').value;
		this._resourceService.setResourceDayOff(this.selectedAvailability.id, date)
			.subscribe((response) => {

				this.daysoffListForm = this.daysoffListForm as FormArray;

				this.daysoffList.push(response['data']);

				this.daysoffList.forEach(item => {
					this.daysoffListForm.push(this._formBuilder.group(item));
				});

				// Mark for check
				this._changeDetectorRef.markForCheck();

			});
	}
}
