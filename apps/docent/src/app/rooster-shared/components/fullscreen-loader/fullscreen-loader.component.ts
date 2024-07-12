import { Component } from '@angular/core';
import { SpinnerComponent } from 'harmony';

@Component({
    selector: 'dt-fullscreen-loader',
    templateUrl: './fullscreen-loader.component.html',
    styleUrls: ['./fullscreen-loader.component.scss'],
    standalone: true,
    imports: [SpinnerComponent]
})
export class FullscreenLoaderComponent {}
