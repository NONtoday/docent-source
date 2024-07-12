import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { IconDirective } from 'harmony';
import { IconIdeeenbord, IconSmiley, provideIcons } from 'harmony-icons';
import { take } from 'rxjs/operators';
import { MedewerkerDataService } from '../../../core/services/medewerker-data.service';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { FeedbackDataService } from './../feedback-popup/feedback-data.service';

@Component({
    selector: 'dt-feedback-menu-popup',
    templateUrl: './feedback-menu-popup.component.html',
    styleUrls: ['./feedback-menu-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, IconDirective, OutlineButtonComponent],
    providers: [provideIcons(IconIdeeenbord, IconSmiley)]
})
export class FeedbackMenuPopupComponent implements OnInit, Popup {
    private medewerkerDataService = inject(MedewerkerDataService);
    private feedbackDataService = inject(FeedbackDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    onFeedbackClick: () => unknown;

    private baseUrl = 'https://portal.productboard.com/somtodaydocent';
    url = this.baseUrl;

    ngOnInit() {
        this.setUrl();
    }

    mayClose(): boolean {
        return true;
    }

    async setUrl() {
        const medewerker = await this.medewerkerDataService.getMedewerkerPromise();
        this.feedbackDataService
            .getProductboardToken(medewerker)
            .pipe(take(1))
            .subscribe((token) => {
                if (token) {
                    this.url = this.baseUrl + '?token=' + token;
                }
            });
    }

    openProductboard() {
        window.open(this.url, '_blank');
    }
}
