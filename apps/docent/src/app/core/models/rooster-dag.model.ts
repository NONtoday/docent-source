import { RoosterItem } from './afspraak.model';

export const TWINTIG_MIN_MS = 1200000;

export interface VRoosterDag {
    datum: Date;
    roosterItems: RoosterItem[];
    isWeekend: boolean;
    isAdjacentWeek: boolean;
}
