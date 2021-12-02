import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { QuillModule } from 'ngx-quill';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from 'app/shared/shared.module';
import { CustomersComponent } from 'app/modules/merchant/customer-support/list/customers.component';
import { customerSupportRoutes } from 'app/modules/merchant/customer-support/customer-support.routing';
import { ManageAgentComponent } from './manage-agent/manage-agent.component';
import { CreateAgentComponent } from './create-agent/create-agent.component';

@NgModule({
    declarations: [
        CustomersComponent,
        ManageAgentComponent,
        CreateAgentComponent,
    ],
    imports     : [
        RouterModule.forChild(customerSupportRoutes),
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
        SharedModule
    ]
})
export class CustomerSupportModule
{
}
