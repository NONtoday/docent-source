import { animate, state, style, transition, trigger } from '@angular/animations';
import { background_6, primary_1 } from '../../rooster-shared/colors';

// animations use OverzichtType state. 0 = 'Week', 1 = 'Dag'
export const weekToggle = trigger('weekToggle', [
    state(
        '0',
        style({
            backgroundPosition: '100% 0%',
            color: background_6
        })
    ),
    state(
        '1',
        style({
            backgroundPosition: '0%',
            color: primary_1
        })
    ),
    transition('0 <=> 1', [animate('0.25s ease-in')])
]);

export const dagToggle = trigger('dagToggle', [
    state(
        '0',
        style({
            backgroundPosition: '0%',
            color: primary_1
        })
    ),
    state(
        '1',
        style({
            backgroundPosition: '-100%',
            color: background_6
        })
    ),
    transition('0 <=> 1', [animate('0.25s ease-in')])
]);
