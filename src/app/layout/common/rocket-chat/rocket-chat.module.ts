import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar';
import { SharedModule } from 'app/shared/shared.module';
import { RocketChatComponent } from './rocket-chat.component';

@NgModule({
    declarations: [
        RocketChatComponent
    ],
    imports     : [
        RouterModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        FuseDrawerModule,
        FuseScrollbarModule,
        SharedModule
    ],
    exports     : [
        RocketChatComponent
    ]
})
export class RocketChatModule
{
}
