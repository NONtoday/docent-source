import { ViewContainerRef } from '@angular/core';
import get from 'lodash-es/get';
import { SjabloonWeek, StudiewijzerAfspraak, StudiewijzerDag, StudiewijzerWeek, Toekenning } from '../../../generated/_types';
import { AbstractStudiewijzerId } from '../../core/models/studiewijzers/shared.model';
import { StudiewijzerContent } from '../../core/models/studiewijzers/studiewijzer.model';
import { PopupService } from '../../core/popup/popup.service';
import { Optional } from '../../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';
import { stripHtmlTags, stripWhitespace } from './html.utils';

export function isToekenningOrEmpty(toekenning: any): toekenning is Toekenning {
    return !toekenning || 'studiewijzeritem' in toekenning;
}

export function isSjabloonWeek(sjabloonWeek: any): sjabloonWeek is SjabloonWeek {
    return !sjabloonWeek || 'weeknummer' in sjabloonWeek;
}

export function isStudiewijzerIdOrEmpty(abstractStudiewijzerId: any): abstractStudiewijzerId is AbstractStudiewijzerId {
    return !abstractStudiewijzerId || 'isSjabloon' in abstractStudiewijzerId;
}

export function isStudiewijzerContentContainer(contentContainer: StudiewijzerContent): boolean {
    return contentContainer
        ? !get(contentContainer, 'lesgroep') &&
              (!!(<StudiewijzerWeek>contentContainer).dagen ||
                  !!(<StudiewijzerDag>contentContainer).afspraken ||
                  !!(<StudiewijzerAfspraak>contentContainer).afspraak)
        : true;
}

// Plain text-content van de eerste regel tekst (p-element) of het eerste bolletje (li-element)
export function berekenOnderwerp(omschrijving: Optional<string>): Optional<string> {
    if (omschrijving) {
        let firstCharIndex = -1;
        let closingIndex = -1;
        const openingIndexLi = omschrijving.indexOf('<li>');
        const openingIndexP = omschrijving.indexOf('<p>');
        const openingIndexDiv = omschrijving.indexOf('<div>');

        if (openingIndexLi >= 0 && (openingIndexP < 0 || openingIndexLi < openingIndexP)) {
            closingIndex = omschrijving.indexOf('</li>');
            firstCharIndex = openingIndexLi + 4;
        } else if (openingIndexP >= 0) {
            closingIndex = omschrijving.indexOf('</p>');
            firstCharIndex = openingIndexP + 3;
        } else if (openingIndexDiv >= 0) {
            closingIndex = omschrijving.indexOf('</div>');
            firstCharIndex = openingIndexDiv + 5;
            if (openingIndexDiv > 20) {
                firstCharIndex = 0;
                closingIndex = openingIndexDiv;
            }
        }

        if (firstCharIndex >= 0 && firstCharIndex < closingIndex) {
            return stripWhitespace(stripHtmlTags(omschrijving.substring(firstCharIndex, closingIndex)) ?? '');
        }
    }
    return null;
}

export function genereerSyncGuardPopup(popupService: PopupService, connectedComponent: ViewContainerRef) {
    const popup = popupService.popup(connectedComponent, ConfirmationDialogComponent.defaultPopupSettings, ConfirmationDialogComponent);

    popup.title = 'Wijzigingen opslaan en synchroniseren?';
    popup.message =
        'Wil je wijzigingen opslaan en synchroniseren met het sjabloon? Wanneer je opslaat ' +
        `zonder synchronisatie wordt dit lesitem een kopie en synchroniseert ` +
        'het niet meer met het sjabloon. Zichtbaarheid wordt nooit gesynchroniseerd met een sjabloon.';
    popup.cancelLabel = `Opslaan zonder synchronisatie`;
    popup.actionLabel = 'Opslaan en synchroniseren';
    popup.cancelGtmTag = 'wijzigingen-niet-synchroniseren';
    popup.confirmGtmTag = 'wijzigingen-synchroniseren';
    popup.cancelWordWrap = true;

    return popup;
}
