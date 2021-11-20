import { Route } from '@angular/router';
import { FlowsListComponent } from 'app/modules/merchant/social-media/flows-list/flows-list.component';
import { FlowsListResolver } from 'app/modules/merchant/social-media/flows-list/flows-list.resolvers';

import { FlowBuilderComponent } from 'app/modules/merchant/social-media/flow-builder/flow-builder.component';
import { FlowBuilderResolver } from 'app/modules/merchant/social-media/flow-builder/flow-builder.resolvers';

export const socialMediaRoutes: Route[] = [
    {
        path     : '',
        component: FlowsListComponent,
        resolve  : {
            data: FlowsListResolver,
        }
    },
    {
        path     : 'flow-builder',
        component: FlowBuilderComponent,
        resolve  : {
            data: FlowBuilderResolver,
        }
    },
    {
        path     : 'flow-builder/:id',
        component: FlowBuilderComponent,
        resolve  : {
            data: FlowBuilderResolver,
        }
    }
];
