import { BijlageFieldsFragment, SubmissionError } from '../../../../generated/_types';

export type InleveropdrachtenTab = 'verlopen' | 'aankomend';
export type InleveropdrachtSorteerHeader = 'deadline' | 'lesgroep';
export type SorteerOrder = 'asc' | 'desc';
export interface OrderByArgs {
    properties: string[];
    order: SorteerOrder[];
}

const deadlineSortProperties = ['studiewijzeritem.inleverperiode.eind', 'lesgroep.naam', 'studiewijzeritem.onderwerp'];
const lesgroepSortProperties = ['lesgroep.naam', 'studiewijzeritem.inleverperiode.eind', 'studiewijzeritem.onderwerp'];
const sortAsc: SorteerOrder[] = ['asc', 'asc'];
const sortDesc: SorteerOrder[] = ['desc', 'asc'];

export const inleveropdrachtSorteringen: Record<InleveropdrachtSorteerHeader, Record<SorteerOrder, OrderByArgs>> = {
    deadline: {
        asc: { properties: deadlineSortProperties, order: sortAsc },
        desc: { properties: deadlineSortProperties, order: sortDesc }
    },
    lesgroep: {
        asc: { properties: lesgroepSortProperties, order: sortAsc },
        desc: { properties: lesgroepSortProperties, order: sortDesc }
    }
};

export const SubmissionErrorDescription: { [key in SubmissionError]: string } = {
    [SubmissionError.UNSUPPORTED_FILETYPE]:
        'Het geüploade bestand wordt niet ondersteund: De volgende bestandstypes kunnen worden gecontroleerd: doc, docx, htm, html, hwp, odt, pdf, ps, ppt, pps, ppsx, pptx, rtf, txt, wpd, xls, xlsx.',
    [SubmissionError.PROCESSING_ERROR]:
        'Er is een onverwachte fout opgetreden tijdens het verwerken van het geüploade bestand. Probeer het opnieuw.',
    [SubmissionError.CANNOT_EXTRACT_TEXT]: 'Het bestand bevat geen tekst.',
    [SubmissionError.TOO_LITTLE_TEXT]: 'Het bestand bevat minder dan 20 woorden.',
    [SubmissionError.TOO_MUCH_TEXT]: 'Het bestand bevat teveel tekst.',
    [SubmissionError.TOO_MANY_PAGES]: "Het bestand heeft meer dan 800 pagina's. Daardoor kan er geen plagiaatrapport worden aangemaakt.",
    [SubmissionError.FILE_LOCKED]: 'Het bestand vereist een wachtwoord om te worden geopend.',
    [SubmissionError.CORRUPT_FILE]: 'Het bestand lijkt te zijn beschadigd.'
};

export interface InleveropdrachtBericht {
    inhoud: string;
    bijlagen: BijlageFieldsFragment[];
    ontvangerIds?: string[];
}
