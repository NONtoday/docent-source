import { animate, group, style, transition, trigger } from '@angular/animations';

export const weekAnimatie = trigger('weekAnimatie', [
    transition('void => forward', [
        style({
            transform: 'translateX(20%)',
            opacity: 1,
            zIndex: 11
        }),
        group([
            animate(
                '250ms',
                style({
                    transform: 'translateX(0%)'
                })
            )
        ])
    ]),
    transition('void => backward', [
        style({
            transform: 'translateX(-20%)',
            opacity: 1,
            zIndex: 11
        }),
        group([
            animate(
                '250ms',
                style({
                    transform: 'translateX(0%)'
                })
            )
        ])
    ]),
    transition('forward => void', [
        style({
            position: 'absolute',
            width: '100%',
            top: 0,
            zIndex: 0
        }),
        group([
            animate(
                '100ms ease-in',
                style({
                    transform: 'translateX(-15%)'
                })
            ),
            animate(
                '200ms ease-out',
                style({
                    opacity: 0
                })
            )
        ])
    ]),
    transition('backward => void', [
        style({
            position: 'absolute',
            width: '100%',
            top: 0,
            zIndex: 0
        }),
        group([
            animate(
                '100ms ease-out',
                style({
                    transform: 'translateX(15%)'
                })
            ),
            animate(
                '200ms ease-out',
                style({
                    opacity: 0
                })
            )
        ])
    ])
]);
