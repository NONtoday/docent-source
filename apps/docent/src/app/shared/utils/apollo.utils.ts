import { ApolloError, ApolloQueryResult, NetworkStatus } from '@apollo/client/core';
import { Maybe } from '@docent/codegen';
import { Observable, catchError, map, of, pipe, startWith } from 'rxjs';
import { match } from 'ts-pattern';
import { parseErrorMessage } from '../../core/error-parser';

interface DocentApolloGraphqlError {
    message: string;
    extensions: {
        code: string;
        url: string;
        customErrorHandling: boolean;
    };
}

interface DocentQueryError {
    message: string;
    code: string;
}

export interface DocentQueryBase<D> {
    data: D;
    status: 'pending' | 'success' | 'error';
    error: Maybe<DocentQueryError>;
    isFetching: boolean;
    isPending: boolean;
    hasError: boolean;
    isSuccess: boolean;
}
export type DocentPendingQuery<D> = DocentQueryBase<D> & {
    status: 'pending';
    isFetching: true;
    isPending: true;
    hasError: false;
    isSuccess: false;
};
export type DocentSuccessQuery<D> = DocentQueryBase<D> & {
    status: 'success';
    isFetching: false;
    isPending: false;
    hasError: false;
    isSuccess: true;
};
export type DocentErrorQuery<D> = DocentQueryBase<D> & {
    error: DocentQueryError;
    status: 'error';
    isFetching: false;
    isPending: false;
    hasError: true;
    isSuccess: false;
};
export type DocentRefetchingQuery<D> = DocentQueryBase<D> & {
    status: 'success';
    isFetching: true;
    isPending: false;
    hasError: false;
    isSuccess: true;
};

/**
 * Een DocentQuery is altijd in 1 van de volgende states:
 *
 *  Pending - De query is aan het laden. Er is nog geen data van de server binnen. Data is de initiele data die je hebt meegegeven.
 *
 *  Success - De query is succesvol geladen. Data is de data die je van de server hebt gekregen.
 *
 *  Error - De query heeft een error opgeleverd. Dta is de initiele data die je hebt meegegeven.
 *
 *  Refetching - De query is al een keer succesvol geladen, maar wordt opnieuw geladen. Bijvoorbeeld door een refetch te doen, of bij een polling oplossing.
 *  Data is de data die je van de server hebt gekregen.
 */
export type DocentQuery<D> = DocentPendingQuery<D> | DocentSuccessQuery<D> | DocentErrorQuery<D> | DocentRefetchingQuery<D>;

/**
 * Gebruik deze functie om de initiële waarde van een signal op te geven.
 * Voorbeeld:
 * ```
 * public foo = derivedFrom( // uit ngxtension package
 *  [this.bar$, this.baz], // respectievelijk een Observable en Signal
 *  (bar, baz) => ... , // de waardes gebruiken
 *  { initialValue: docentPendingQuery(fooDefault) }
 * );
 * ```
 */
export const docentPendingQuery = <D>(initialData: D): DocentPendingQuery<D> => ({
    data: initialData,
    status: 'pending',
    error: null,
    isFetching: true,
    isPending: true,
    hasError: false,
    isSuccess: false
});

/**
 * Deze functie is vooral voor intern gebruik en tests, om een bepaalde state te emuleren.
 */
export const docentSuccessQuery = <D>(data: D): DocentSuccessQuery<D> => ({
    data,
    status: 'success',
    error: null,
    isFetching: false,
    isPending: false,
    hasError: false,
    isSuccess: true
});

/**
 * Deze functie is vooral voor intern gebruik en tests, om een bepaalde state te emuleren.
 */
export const docentErrorQuery = <D>(data: D, error: DocentApolloGraphqlError): DocentErrorQuery<D> => ({
    data,
    status: 'error',
    error: {
        message: error.message,
        code: error.extensions.code
    },
    isFetching: false,
    isPending: false,
    hasError: true,
    isSuccess: false
});

/**
 * Deze functie is vooral voor intern gebruik en tests, om een bepaalde state te emuleren.
 */
export const docentRefetchingQuery = <D>(data: D): DocentRefetchingQuery<D> => ({
    data,
    status: 'success',
    error: null,
    isFetching: true,
    isPending: false,
    hasError: false,
    isSuccess: true
});

/**
 * Gebruik deze RxJS operator in combinatie met de apollo `watchQuery` method.
 * Voorbeeld:
 * ```
 * getFoo() {
 *  return this.apollo.watchQuery({ query: FooDocument })
 *      .valueChanges().pipe(docentQuery(fooDefault));
 * }
 * ```
 */
export function docentQuery<D>(initialData: D) {
    return pipe(removeQuerynameProperty(), mapToDocentQuery(initialData), startWith(docentPendingQuery(initialData)));
}

export function mapToDocentQuery<D>(initialData: D) {
    return function (source: Observable<ApolloQueryResult<D>>) {
        return source.pipe(
            map(
                (res: ApolloQueryResult<D>): DocentQuery<D> =>
                    match(res.networkStatus)
                        .returnType<DocentQuery<D>>()
                        .with(NetworkStatus.loading, () => docentPendingQuery(res.data))
                        .with(NetworkStatus.ready, () => docentSuccessQuery(res.data))
                        .with(NetworkStatus.refetch, NetworkStatus.fetchMore, NetworkStatus.poll, NetworkStatus.setVariables, () =>
                            docentRefetchingQuery(res.data)
                        )
                        // hier zou die in principe alleen moeten komen met apollo queryoption 'errorPolicy: "all"'
                        // die geeft zowel data als errors terug.
                        .with(NetworkStatus.error, () => docentErrorQuery(res.data, res.errors?.[0] as unknown as DocentApolloGraphqlError))
                        // .exhaustive() werkt niet met cijfer enums vanwege typescript redenen
                        .run()
            ),
            catchError((error: ApolloError) => {
                // mogelijk kunnen we hier nog een lijst van door het component af te vangen errors meegeven
                // wanneer die niet in de lijst voor komt het doorsturen naar de toast. (met dezelfde return als hieronder zodat het component niet kapot gaat)
                if (error.graphQLErrors.length > 0) {
                    return of(docentErrorQuery(initialData, error.graphQLErrors[0] as unknown as DocentApolloGraphqlError));
                }

                return of(
                    docentErrorQuery(initialData, {
                        message: parseErrorMessage(error.networkError?.message ?? '')
                    } as unknown as DocentApolloGraphqlError)
                );
            })
        );
    };
}

/**
 * Gebruik deze operator om de data van de query te manipuleren.
 * Voorbeeld:
 * ```
 * this.voorbeeldService.getLeerlingenQuery().pipe(
 *  mapDocentQueryData((leerlingen) => leerlingen.filter( ... ))
 * )
 * ```
 */
export function mapDocentQueryData<T, Return>(mapFn: (data: T) => Return) {
    return function (source: Observable<DocentQuery<T>>) {
        return source.pipe(
            map((res) => ({
                ...res,
                data: mapFn(res.data)
            }))
        );
    };
}

export function removeQuerynameProperty<
    T extends { [P in keyof T]: T[P] },
    Q extends keyof { [Prop in keyof T as Exclude<Prop, '__typename'>]: T[Prop] }
>() {
    return function (source: Observable<ApolloQueryResult<T>>) {
        return source.pipe(
            map((res) => {
                const name = Object.keys(res.data ?? {}).filter((p) => p !== '__typename')[0] as Q;
                return {
                    ...res,
                    data: res.data?.[name]
                };
            })
        );
    };
}

export function defaultQueryResult<T>(data: T) {
    return { data, loading: true, errors: undefined, networkStatus: 1 };
}
