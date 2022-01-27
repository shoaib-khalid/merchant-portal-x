import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TimeSelectorInput } from './timeselector.component';

@NgModule({
    declarations: [
        TimeSelectorInput
    ],
    imports     : [
        SharedModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule
    ],
    exports     : [
        TimeSelectorInput
    ]
})
export class TimeSelectorInputModule
{
}
