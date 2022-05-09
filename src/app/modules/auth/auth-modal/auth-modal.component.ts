import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { StoresService } from 'app/core/store/store.service';

@Component({
  selector: 'auth-modal',
  templateUrl: './auth-modal.component.html',
})
export class AuthModalComponent implements OnInit {

    icon: string;
    title: string;
    description: string;

    constructor(
        private dialogRef: MatDialogRef<AuthModalComponent>,
        private _storesService: StoresService,
        private _changeDetectorRef: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) { }

    ngOnInit(): void {
        this.icon = this.data['icon'];
        this.title = this.data['title'];
        this.description = this.data['description'];
    }

    okButton() {
        this.dialogRef.close();
    }

    
}