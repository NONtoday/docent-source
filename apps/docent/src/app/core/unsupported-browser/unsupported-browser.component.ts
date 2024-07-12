import { Component, OnInit, Renderer2, inject } from '@angular/core';
import { UriService } from '../../auth/uri-service';

@Component({
    selector: 'dt-unsupported-browser',
    templateUrl: './unsupported-browser.component.html',
    styleUrls: ['./unsupported-browser.component.scss'],
    standalone: true
})
export class UnsupportedBrowserComponent implements OnInit {
    private _uriService = inject(UriService);
    private renderer = inject(Renderer2);

    ngOnInit() {
        const link = 'microsoft-edge:' + window.location.href.replace(window.location.pathname, '');
        this.renderer.setAttribute(document.getElementById('edge-link'), 'href', link);
    }

    somtodayButtonClick() {
        this._uriService.navigateToSomtoday();
    }
}
