import { ConfirmationDialogComponent } from './confirmation-dialog.component';

export const syncedLesitemVerwijderPopupProperties: Partial<ConfirmationDialogComponent> = {
    title: 'Let op, lesitem synchroniseert met sjabloon',
    message:
        'Dit lesitem synchroniseert met een sjabloon. Wil je dit lesitem alleen uit deze studiewijzer verwijderen of ook uit het sjabloon?',
    actionLabel: 'Alleen uit studiewijzer',
    cancelLabel: 'Ook uit sjabloon',
    outlineConfirmKnop: true,
    buttonColor: 'accent_negative_1',
    cancelGtmTag: 'verwijder-uit-sjabloon',
    confirmGtmTag: 'verwijder-alleen-uit-studiewijzer',
    cancelWordWrap: false
};

export const syncedLesitemVerwijderUitLesplanningPopupProperties: Partial<ConfirmationDialogComponent> = {
    title: 'Let op, lesitem synchroniseert met sjabloon',
    message:
        'Het lesitem synchroniseert met een sjabloon. Wil je dit lesitem alleen voor deze lesgroep verwijderen of ook uit het sjabloon?',
    actionLabel: 'Alleen voor deze lesgroep',
    cancelLabel: 'Ook uit sjabloon',
    outlineConfirmKnop: true,
    buttonColor: 'accent_negative_1',
    cancelGtmTag: 'verwijder-uit-sjabloon',
    confirmGtmTag: 'verwijder-alleen-voor-lesgroep'
};

export const syncedConceptInleveropdrachtVerwijderPopupProperties: Partial<ConfirmationDialogComponent> = {
    title: 'Let op, sjabloon synchroniseert met studiewijzer(s)',
    message:
        'De inleveropdracht met eventuele inleveringen wordt ook definitief verwijderd uit alle gesynchroniseerde studiewijzers. \n\n Weet je zeker dat je de inleveropdracht wilt verwijderen?',
    actionLabel: 'Defintief verwijderen',
    cancelLabel: 'Annuleren',
    outlineConfirmKnop: true,
    buttonColor: 'accent_negative_1',
    cancelGtmTag: undefined,
    confirmGtmTag: 'verwijder-synced-conceptinleveropdracht',
    cancelWordWrap: false
};

export const bulkSyncedConceptInleveropdrachtVerwijderPopupProperties: Partial<ConfirmationDialogComponent> = {
    title: 'Let op, sjabloon synchroniseert met studiewijzer(s)',
    message:
        'Geselecteerde inleveropdrachten met eventuele inleveringen worden ook definitief verwijderd uit alle gesynchroniseerde studiewijzers. \n\n Weet je zeker dat je deze inleveropdrachten ook wilt verwijderen?',
    actionLabel: 'Defintief verwijderen',
    cancelLabel: 'Annuleren',
    outlineConfirmKnop: true,
    buttonColor: 'accent_negative_1',
    cancelGtmTag: undefined,
    confirmGtmTag: 'verwijder-synced-conceptinleveropdracht',
    cancelWordWrap: false
};

export const toetsKolomDirtyPopupProperties: Partial<ConfirmationDialogComponent> = {
    title: 'Wijzigen zijn niet opgeslagen',
    message: 'Weet je zeker dat je wilt stoppen met bewerken van deze toetskolom? Wijzigen worden niet opgeslagen.',
    actionLabel: 'Stoppen met bewerken',
    cancelLabel: 'Annuleren',
    outlineConfirmKnop: true,
    buttonColor: 'accent_negative_1'
};

export const toetsKolomMetCijfersVerwijderenPopupProperties: Partial<ConfirmationDialogComponent> = {
    title: 'Toetskolom verwijderen',
    message: 'De toetskolom bevat al ingevulde cijfers. Weet je zeker dat je de toets wil verwijderen?',
    actionLabel: 'Toetskolom verwijderen',
    cancelLabel: 'Annuleren',
    outlineConfirmKnop: true,
    buttonColor: 'accent_negative_1'
};
