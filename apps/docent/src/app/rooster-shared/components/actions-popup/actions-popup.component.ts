import { Component, Input, ViewChild, inject } from '@angular/core';
import {
    IconAZ,
    IconBewerken,
    IconCheck,
    IconDifferentiatie,
    IconDupliceren,
    IconKopierenNaar,
    IconLink,
    IconMapVerplaatsen,
    IconName,
    IconNietZichtbaarCheckbox,
    IconNoRadio,
    IconOntkoppelen,
    IconOpmerkingVerwijderen,
    IconSluiten,
    IconVerwijderen,
    IconYesRadio,
    IconZA,
    IconZichtbaar,
    IconZichtbaarCheckbox,
    provideIcons
} from 'harmony-icons';
import { capitalize } from 'lodash-es';
import { Observable } from 'rxjs';
import { Lesgroep, SorteringOrder, SorteringVeld } from '../../../../generated/_types';
import { SorteerOrder } from '../../../core/models/inleveropdrachten/inleveropdrachten.model';
import { PopupService } from '../../../core/popup/popup.service';
import { Appearance, PopupDirection, PopupSettings } from '../../../core/popup/popup.settings';
import { HarmonyColorName } from '../../colors';
import { Optional } from '../../utils/utils';
import { ActionsComponent } from '../actions/actions.component';
import { Popup, PopupComponent } from '../popup/popup.component';

export interface ActionButton {
    icon?: Optional<IconName>;
    iconcolor?: Optional<HarmonyColorName>;
    text: string;
    textcolor?: Optional<HarmonyColorName>;
    textHoverColor?: Optional<HarmonyColorName>;
    isVerwijderButton?: Optional<boolean>;
    onClickFn: (...args: unknown[]) => void;
    customCssClass?: Optional<string>;
    gtmTag?: Optional<string>;
    notificationCount?: Observable<number>;
}

export const differentiatiegroepen = (onClickFn: (lesgroep: Lesgroep) => void, gtmTag?: Optional<string>): ActionButton => ({
    icon: 'differentiatie',
    text: 'Differentiatiegroepen',
    iconcolor: 'primary_1',
    gtmTag,
    onClickFn
});

export const accorderenButton = (onClickFn: () => void, gtmTag?: string): ActionButton => ({
    icon: 'yesRadio',
    iconcolor: 'accent_positive_1',
    text: 'Accorderen',
    textcolor: 'accent_positive_1',
    isVerwijderButton: false,
    onClickFn,
    gtmTag
});

export const afwijzenButton = (onClickFn: () => void, gtmTag?: string): ActionButton => ({
    icon: 'noRadio',
    iconcolor: 'accent_negative_1',
    text: 'Afwijzen',
    textcolor: 'accent_negative_1',
    isVerwijderButton: false,
    onClickFn,
    gtmTag
});

export const zichtbaarheidButton = (
    zichtbaar: boolean,
    customCssClass: string,
    zichtbaarheidFn: () => void,
    gtmTag?: Optional<string>
): ActionButton => ({
    icon: zichtbaar ? 'nietZichtbaarCheckbox' : 'zichtbaarCheckbox',
    iconcolor: zichtbaar ? 'accent_negative_1' : 'primary_1',
    text: zichtbaar ? 'Maak onzichtbaar voor leerling' : 'Maak zichtbaar voor leerling',
    textcolor: zichtbaar ? 'accent_negative_1' : 'primary_1',
    customCssClass,
    onClickFn: zichtbaarheidFn,
    gtmTag
});

export const ontkoppelButton = (onClickFn: () => void): ActionButton => ({
    icon: 'ontkoppelen',
    iconcolor: 'accent_negative_1',
    text: 'Ontkoppel van sjabloon',
    textcolor: 'accent_negative_1',
    onClickFn,
    gtmTag: 'ontkoppel-item-van-sjabloon'
});

export const annulerenButton = (onClickFn?: () => void): ActionButton => ({
    icon: 'sluiten',
    iconcolor: 'typography_3',
    text: 'Annuleren',
    textcolor: 'typography_3',
    onClickFn: onClickFn
        ? onClickFn
        : () => {
              // do nothing
          }
});

export const naarSomtodayButton = (onClickFn: () => void): ActionButton => ({
    icon: 'link',
    iconcolor: 'primary_1',
    text: 'Naar Somtoday',
    textcolor: 'primary_1',
    isVerwijderButton: false,
    onClickFn
});

export const bewerkButton = (bewerkFn: () => void, gtmTag?: Optional<string>): ActionButton => ({
    icon: 'bewerken',
    iconcolor: 'primary_1',
    text: 'Bewerken',
    textcolor: 'primary_1',
    isVerwijderButton: false,
    onClickFn: bewerkFn,
    gtmTag
});

export const verwijderButton = (verwijderFn: () => void, gtmTag?: Optional<string>): ActionButton => ({
    icon: 'verwijderen',
    iconcolor: 'accent_negative_1',
    text: 'Verwijderen',
    textcolor: 'accent_negative_1',
    isVerwijderButton: true,
    onClickFn: verwijderFn,
    gtmTag
});

export const kopieerButton = (kopieerFn: () => void, gtmTag?: Optional<string>): ActionButton => ({
    icon: 'kopierenNaar',
    iconcolor: 'primary_1',
    text: 'Kopiëren naar',
    textcolor: 'primary_1',
    onClickFn: kopieerFn,
    gtmTag
});

export const dupliceerButton = (dupliceerFn: () => void, gtmTag?: Optional<string>): ActionButton => ({
    icon: 'dupliceren',
    iconcolor: 'primary_1',
    text: 'Dupliceren',
    textcolor: 'primary_1',
    onClickFn: dupliceerFn,
    gtmTag
});

export const verplaatsButton = (onClick: () => void, gtmTag?: Optional<string>): ActionButton => ({
    icon: 'mapVerplaatsen',
    iconcolor: 'primary_1',
    onClickFn: onClick,
    text: 'Verplaatsen',
    textcolor: 'primary_1',
    gtmTag
});

export const opslaanEnKopieerButton = (onClick: () => void, gtmTag?: Optional<string>): ActionButton => ({
    icon: 'dupliceren',
    iconcolor: 'primary_1',
    onClickFn: onClick,
    text: 'Opslaan en kopie maken',
    textcolor: 'primary_1',
    gtmTag
});

export type SorteerButtonClickFn = (type: SorteringVeld, order: SorteringOrder) => void;
export const sorteerButtons = (
    activeSort: SorteringVeld,
    activeOrder: SorteringOrder,
    velden: SorteringVeld[],
    onClick: SorteerButtonClickFn
): ActionButton[] => {
    const sortorders: SorteerOrder[] = ['asc', 'desc'];
    const currentOrder = activeOrder === SorteringOrder.ASC ? 'asc' : 'desc';

    //maak voor elk type voor beide sortorders een button
    return velden
        .map((veld) =>
            sortorders.map((order) => {
                const but = sorteerButton(
                    activeSort,
                    currentOrder,
                    () => onClick(veld, SorteringOrder[order.toUpperCase() as keyof typeof SorteringOrder]),
                    veld,
                    order,
                    `sortering-${veld.toLowerCase()}`
                );
                return but;
            })
        )
        .flatMap((buttons) => buttons);
};

const orderToIcon = (order: SorteerOrder): IconName => (order === 'asc' ? 'aZ' : 'zA');
const orderToAZ = (order: SorteerOrder) => (order === 'asc' ? 'A-Z' : 'Z-A');
export const sorteerButton = (
    activeSort: string,
    activeOrder: SorteerOrder,
    onClick: (...args: unknown[]) => void,
    label: string,
    order: SorteerOrder,
    gtmTag = ''
): ActionButton => ({
    icon: activeSort === label && activeOrder === order ? 'check' : orderToIcon(order),
    iconcolor: activeSort === label && activeOrder === order ? 'accent_positive_1' : 'primary_1',
    onClickFn: onClick,
    text: `${capitalize(label)} ${orderToAZ(order)}`,
    gtmTag
});

export const bekijkOpdrachtButton = (onClick: () => void): ActionButton => ({
    icon: 'zichtbaar',
    iconcolor: 'primary_1',
    text: 'Bekijk opdracht',
    textcolor: 'primary_1',
    isVerwijderButton: false,
    onClickFn: onClick,
    gtmTag: 'inl-overzicht-bekijk-opdracht'
});

export const methodeButton = (text: string, onClickFn: () => void): ActionButton => ({
    text,
    gtmTag: 'sjabloon-methode-selectie',
    onClickFn,
    iconcolor: 'primary_1',
    textcolor: 'primary_1'
});

export const primaryButton = (icon: Optional<IconName>, text: string, onClickFn: () => void, gtmTag?: Optional<string>): ActionButton => ({
    icon,
    iconcolor: 'primary_1',
    text,
    textcolor: 'primary_1',
    isVerwijderButton: false,
    onClickFn,
    gtmTag
});

export const negativeButton = (icon: Optional<IconName>, text: string, onClickFn: () => void, gtmTag?: Optional<string>): ActionButton => ({
    icon,
    iconcolor: 'accent_negative_1',
    text,
    textcolor: 'accent_negative_1',
    isVerwijderButton: false,
    onClickFn,
    gtmTag
});

export const opmerkingVerwijderenButton = (onClick: () => void): ActionButton => ({
    icon: 'opmerkingVerwijderen',
    iconcolor: 'accent_negative_1',
    text: 'Opmerking verwijderen',
    textcolor: 'accent_negative_1',
    textHoverColor: 'accent_negative_2',
    onClickFn: onClick,
    gtmTag: 'opmerking-verwijderen'
});

export const defaultButtons = (
    bewerkFn: () => void,
    verwijderFn: () => void,
    bewerkGtmTag?: Optional<string>,
    verwijderGtmTag?: Optional<string>
) => [bewerkButton(bewerkFn, bewerkGtmTag), verwijderButton(verwijderFn, verwijderGtmTag)];

@Component({
    selector: 'dt-actions-popup',
    templateUrl: './actions-popup.component.html',
    styleUrls: ['./actions-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, ActionsComponent],
    providers: [
        provideIcons(
            IconDifferentiatie,
            IconYesRadio,
            IconNoRadio,
            IconNietZichtbaarCheckbox,
            IconZichtbaarCheckbox,
            IconOntkoppelen,
            IconSluiten,
            IconLink,
            IconBewerken,
            IconVerwijderen,
            IconKopierenNaar,
            IconDupliceren,
            IconMapVerplaatsen,
            IconAZ,
            IconZA,
            IconCheck,
            IconZichtbaar,
            IconOpmerkingVerwijderen
        )
    ]
})
export class ActionsPopupComponent implements Popup {
    public popupService = inject(PopupService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input() title: Optional<string>;
    @Input() customButtons: ActionButton[];
    @Input() buttonsBeforeDivider: number;
    @Input() onActionClicked = () => {
        // do nothing
    };

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupsettings() {
        const popupSettings = new PopupSettings();

        popupSettings.showCloseButton = false;
        popupSettings.headerClass = 'none';
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }

    public static get sorteerPopupsettings() {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 192;
        return popupSettings;
    }
}
