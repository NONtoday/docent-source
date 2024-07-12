import { Signal, assertInInjectionContext, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, map, of, switchMap } from 'rxjs';
import { isPresent } from './../../rooster-shared/utils/utils';

export function injectParentParams(key: keyof Params): Signal<string> {
    assertInInjectionContext(injectParentParams);
    const route = inject(ActivatedRoute);

    return toSignal(
        of(route.parent).pipe(
            filter(isPresent),
            switchMap((parent) => parent.params),
            map((params) => params[key])
        ),
        {
            initialValue: route.parent?.snapshot.params[key]
        }
    );
}
