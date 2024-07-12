export enum EditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE'
}

export interface LoadingState {
    timeout: NodeJS.Timeout | undefined;
    isLoading: boolean;
}

export type TijdInput = `${number}:${number}`;

export type SorteringNaam = 'registratie' | 'resultaten';

export const Maanden = [
    'Januari',
    'Februari',
    'Maart',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Augustus',
    'September',
    'Oktober',
    'November',
    'December'
] as const;
export type Maand = (typeof Maanden)[number];
export interface IdObject {
    id: string;
}
