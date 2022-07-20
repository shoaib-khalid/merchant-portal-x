import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TimeSelectorInputModule } from 'app/layout/common/time-selector/timeselector.module';
import { SharedModule } from 'app/shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { QuillModule } from 'ngx-quill';
import { AddResourceComponent } from './add-resource/add-resource.component';
import { DayOffComponent } from './day-off/day-off.component';
import { EditResourceComponent } from './edit-resource/edit-resource.component';
import { ReservedSlotsComponent } from './reserved-slots/reserved-slots.component';
import { ResourceComponent } from './resource.component';
import {resourceRoutes} from './resource.routing';


@NgModule({
    declarations: [
        ResourceComponent,
        AddResourceComponent,
        EditResourceComponent,
        ReservedSlotsComponent,
        DayOffComponent
    ],
    imports: [
        RouterModule.forChild(resourceRoutes),
        SharedModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        QuillModule.forRoot(),
        MatPaginatorModule,
        MatProgressBarModule,
        MatRippleModule,
        MatSortModule,
        MatSelectModule,
        MatTableModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatStepperModule,
        MatRadioModule,
        TimeSelectorInputModule,
        MatDividerModule,
        NgApexchartsModule,
        MatDatepickerModule,
        MatNativeDateModule,
    ]
})
export class ResourceModule
{
}
