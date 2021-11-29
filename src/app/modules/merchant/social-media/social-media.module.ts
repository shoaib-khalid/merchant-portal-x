import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


import { SharedModule } from 'app/shared/shared.module';

// import { GraphHelper } from 'app/modules/merchant/social-media/flow-builder/components/helpers/graph-helper';

import { SideNav } from 'app/modules/merchant/social-media/flow-builder/components/side-nav/side-nav.component'; 
import { SideNavAction } from 'app/modules/merchant/social-media/flow-builder/components/side-nav-action/side-nav-action.component'; 
import { SideNavHandOverComponent } from 'app/modules/merchant/social-media/flow-builder/components/side-nav-handover/side-nav-handover.component'; 
import { SideNavQuickReplyComponent } from 'app/modules/merchant/social-media/flow-builder/components/side-nav-quick-reply/side-nav-quick-reply.component'
import { SideNavConditionComponent } from 'app/modules/merchant/social-media/flow-builder/components/side-nav-condition/side-nav-condition.component'
import { FlowsListComponent } from 'app/modules/merchant/social-media/flows-list/flows-list.component';
import { FlowBuilderComponent } from 'app/modules/merchant/social-media/flow-builder/flow-builder.component';

import { ActionDialog } from 'app/modules/merchant/social-media/flow-builder/components/action-dialog/action-dialog.component';
import { BotSelectionDialogComponent } from 'app/modules/merchant/social-media/flow-builder/components/bot-selection-dialog/bot-selection-dialog.component';
import { FlowDialogComponent } from 'app/modules/merchant/social-media/flow-builder/components/flow-dialog/flow-dialog.component';
import { LoadingComponent } from 'app/modules/merchant/social-media/flow-builder/components/loading/loading.component';
import { MenuOptionsComponent } from 'app/modules/merchant/social-media/flow-builder/components/menu-options/menu-options.component';

import { socialMediaRoutes } from 'app/modules/merchant/social-media/social-media.routing';
import { ChannelsListComponent } from './channels-list/channels-list.component';
import { CreateChannelComponent } from './create-channel/create-channel.component';


@NgModule({
    declarations: [
        FlowBuilderComponent,
        FlowsListComponent,
        ChannelsListComponent,

        ActionDialog,
        FlowDialogComponent,
        BotSelectionDialogComponent,
        LoadingComponent,
        MenuOptionsComponent,

        SideNav,
        SideNavAction,
        SideNavHandOverComponent,
        SideNavQuickReplyComponent,
        SideNavConditionComponent,
        CreateChannelComponent
    ],
    imports     : [
        RouterModule.forChild(socialMediaRoutes),
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatSortModule,
        MatTableModule,
        NgApexchartsModule,
        SharedModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatSidenavModule
    ],
    providers: [
        // GraphHelper
    ],
})
export class SocialMediaModule
{
}
