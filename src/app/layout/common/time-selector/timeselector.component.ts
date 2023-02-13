import { FocusMonitor } from '@angular/cdk/a11y';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, ElementRef, Inject, Input, OnDestroy, Optional, Self, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, NgControl, Validators } from '@angular/forms';
import {MAT_FORM_FIELD, MatFormField, MatFormFieldControl} from '@angular/material/form-field';
import {Subject} from 'rxjs';

/** @title Form field with custom telephone number input control. */
@Component({
  selector: 'form-field-custom-control-example',
  templateUrl: './form-field-custom-control-example.component.html',
})
export class FormFieldCustomControlExample {
  form: UntypedFormGroup = new UntypedFormGroup({
    tel: new UntypedFormControl(new TimeSelector('', '', '')),
  });
}

//------------------------------------------------
//Data structure for holding telephone number.
//------------------------------------------------
export class TimeSelector {
  constructor(public timeHour: string, public timeMinute: string, public timeAmPm: string) {}
}

/** Custom `MatFormFieldControl` for telephone number input. */
@Component({
  selector: 'time-selector',
  templateUrl: './timeselector.component.html',
  providers: [{provide: MatFormFieldControl, useExisting: TimeSelectorInput}],
  host: {
    '[class.example-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
})
export class TimeSelectorInput implements ControlValueAccessor, MatFormFieldControl<TimeSelector>, OnDestroy {
    static nextId = 0;
    @ViewChild('timeHour') timeHourInput: HTMLInputElement;
    @ViewChild('timeMinute') timeMinuteInput: HTMLInputElement;
    @ViewChild('timeAmPm') timeAmPmInput: HTMLInputElement;

    timeSelection: UntypedFormGroup;
    stateChanges = new Subject<void>();
    focused = false;
    touched = false;
    controlType = 'example-tel-input';
    id = `example-tel-input-${TimeSelectorInput.nextId++}`;
    onChange = (_: any) => {};
    onTouched = () => {};

    get empty() {
        const {
        value: {timeHour, timeMinute, timeAmPm},
        } = this.timeSelection;

        return !timeHour && !timeMinute && !timeAmPm;
    }

    get shouldLabelFloat() {
        return this.focused || !this.empty;
    }

    @Input('aria-describedby') userAriaDescribedBy: string;

    @Input()
    get placeholder(): string {
        return this._placeholder;
    }
    set placeholder(value: string) {
        this._placeholder = value;
        this.stateChanges.next();
    }
    private _placeholder: string;

    @Input()
    get required(): boolean {
        return this._required;
    }
    set required(value: BooleanInput) {
        this._required = coerceBooleanProperty(value);
        this.stateChanges.next();
    }
    private _required = false;

    @Input()
    get disabled(): boolean {
        return this._disabled;
    }
    set disabled(value: BooleanInput) {
        this._disabled = coerceBooleanProperty(value);
        this._disabled ? this.timeSelection.disable() : this.timeSelection.enable();
        this.stateChanges.next();
    }
    private _disabled = false;

    @Input()
    get value(): TimeSelector | null {
        if (this.timeSelection.valid) {
        const {
            value: {timeHour, timeMinute, timeAmPm},
        } = this.timeSelection;
        return new TimeSelector(timeHour, timeMinute, timeAmPm);
        }
        return null;
    }
    set value(tel: TimeSelector | null) {
        const {timeHour, timeMinute, timeAmPm} = tel || new TimeSelector('', '', '');
        this.timeSelection.setValue({timeHour, timeMinute, timeAmPm});
        this.stateChanges.next();
    }

    get errorState(): boolean {
        return this.timeSelection.invalid && this.touched;
    }

  constructor(
        formBuilder: UntypedFormBuilder,
        private _focusMonitor: FocusMonitor,
        private _elementRef: ElementRef<HTMLElement>,

        @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
        @Optional() @Self() public ngControl: NgControl,
    ) 
    {
        this.timeSelection = formBuilder.group({
        timeHour: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
        timeMinute: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
        timeAmPm: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
        });

        if (this.ngControl != null) {
        this.ngControl.valueAccessor = this;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    ngOninit() {

    }

    ngOnDestroy() {
        this.stateChanges.complete();
        this._focusMonitor.stopMonitoring(this._elementRef);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------   

    setDescribedByIds(ids: string[]) {
        const controlElement = this._elementRef.nativeElement.querySelector(
        '.example-tel-input-container',
        )!;
        controlElement.setAttribute('aria-describedby', ids.join(' '));
    }

    onContainerClick() {
        // if (this.timeSelection.controls.timeAmPm.valid) {
        // this._focusMonitor.focusVia(this.timeAmPmInput, 'program');
        // } else if (this.timeSelection.controls.timeMinute.valid) {
        // this._focusMonitor.focusVia(this.timeAmPmInput, 'program');
        // } else if (this.timeSelection.controls.timeHour.valid) {
        // this._focusMonitor.focusVia(this.timeMinuteInput, 'program');
        // } else {
        // this._focusMonitor.focusVia(this.timeHourInput, 'program');
        // }
    }

    writeValue(tel: TimeSelector | null): void {
        this.value = tel;        
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;      
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;        
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    _handleInput(control: AbstractControl, nextElement?: HTMLInputElement): void {
        this.onChange(this.value);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    // changeTimeHour(value: string){

    //     let userValue = value;
    //     let timeSelectionHour = this.timeSelection.split(":")[1];
    //     let timeSelectionMinute = this.timeSelection.split(":")[1].split(" ")[0];
    //     let timeSelectionAMPM = this.timeSelection.split(":")[1].split(" ")[1];
         
    //     this.timeSelection = userValue + ":" + timeSelectionHour;
    // }

    // changeTimeMinute(value: string){

    //     let userValue = value;
    //     let timeSelectionHour = this.timeSelection.split(":")[0];
    //     let timeSelectionMinute = this.timeSelection.split(":")[1].split(" ")[0];
    //     let timeSelectionAMPM = this.timeSelection.split(":")[1].split(" ")[1];
        
    //     this.timeSelection = timeSelectionHour + ":" + userValue + " " + timeSelectionAMPM;
    // }

    // changeTimeAMPM(value: string){

    //     let userValue = value;
    //     let timeSelectionHour = this.timeSelection.split(":")[0];
    //     let timeSelectionMinute = this.timeSelection.split(":")[1].split(" ")[0];
    //     let timeSelectionAMPM = this.timeSelection.split(":")[1].split(" ")[1];

    //     this.timeSelection = timeSelectionHour + ":" + timeSelectionMinute + " " + userValue;        
    // }
}