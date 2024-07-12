import { animate, style, transition, trigger } from '@angular/animations';

export const popupAnimation = trigger('popupAnimation', [
    transition('void => mobile', [
        style({
            transform: 'translateY(100%)'
        }),
        animate(
            200,
            style({
                transform: 'translateY(0)'
            })
        )
    ]),
    transition('void => desktop', [
        style({
            opacity: 0
        }),
        animate(
            200,
            style({
                opacity: 1
            })
        )
    ]),
    transition('desktop => void', [
        style({
            opacity: 1
        }),
        animate(
            200,
            style({
                opacity: 0
            })
        )
    ]),
    transition('mobile => void', [
        style({
            transform: 'translateY(0)'
        }),
        animate(
            200,
            style({
                transform: 'translateY(100%)'
            })
        )
    ]),
    transition('mobile-rolldown => void', [
        style({
            transform: 'translateY(0)'
        }),
        animate(
            200,
            style({
                transform: 'translateY(-100%)'
            })
        )
    ]),
    transition('void => mobile-rolldown', [
        style({
            transform: 'translateY(-100%)'
        }),
        animate(
            200,
            style({
                transform: 'translateY(0)'
            })
        )
    ])
]);
