import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedBackgroundComponent } from "./shared-background.component";


@NgModule({
    declarations: [
        SharedBackgroundComponent
  
    ],
    imports     : [
        CommonModule 
    ],
    exports: [
        SharedBackgroundComponent
    ]
})
export class SharedBackgroundModule
{
}
