import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoadingState } from '../models/shared.model';

export function startLoading<T>(loading: LoadingState, delay = 1000): (source: Observable<T>) => Observable<T> {
    return (source: Observable<T>): Observable<T> =>
        source.pipe(tap(() => (loading.timeout = setTimeout(() => (loading.isLoading = !!loading.timeout), delay))));
}

export function stopLoading<T>(loading: LoadingState): (source: Observable<T>) => Observable<T> {
    return (source: Observable<T>): Observable<T> =>
        source.pipe(
            tap(() => {
                if (loading.timeout) {
                    clearTimeout(loading.timeout);
                }
                loading.timeout = undefined;
                loading.isLoading = false;
            })
        );
}
