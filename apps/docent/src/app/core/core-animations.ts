import { animate, animateChild, query, state, style, transition, trigger } from '@angular/animations';

export const shrinkOutAnimation = trigger('shrinkOut', [
    state('in', style({ height: '*' })),
    transition('* => void', [style({ height: '*' }), animate(100, style({ height: 0 }))]),
    transition('void => *', [style({ height: 0 }), animate(100, style({ height: '*' }))])
]);

export const openClosedAnimation = trigger('openClosed', [
    state(
        'open',
        style({
            height: '*',
            display: 'block'
        })
    ),
    state(
        'closed',
        style({
            height: '0',
            display: 'none'
        })
    ),
    transition('open <=> closed', animate('300ms ease-in-out'))
]);

export const allowChildAnimations = trigger('allowLeaveAnimation', [
    transition('* => void', [query('@*', [animateChild()], { optional: true })])
]);

export const blockInitialRenderAnimation = trigger('blockInitialRenderAnimation', [transition(':enter', [])]);
