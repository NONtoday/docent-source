import { BijlageFieldsFragment, BijlageMapFieldsFragment, BijlageType, MethodeInhoud, NotitieBijlageInput } from '@docent/codegen';

export const bijlagenToOptimisticResponse = (bijlagen: BijlageFieldsFragment[]) =>
    bijlagen.map((bijlage) => ({
        __typename: 'Bijlage',
        ...bijlage
    }));

export const kopieerBijlagenOptimisticResponse = (bijlageMappen: BijlageMapFieldsFragment[], bijlagen: BijlageFieldsFragment[]) => ({
    __typename: 'KopieerBijlagenResponse',
    mappen: bijlageMappen.map((bijlagemap) => ({
        __typename: 'BijlageMap',
        ...bijlagemap
    })),
    bijlagen: bijlagenToOptimisticResponse(bijlagen)
});

export const bijlageToOptimisticResponse = (bijlage: BijlageFieldsFragment) => ({
    __typename: 'Bijlage',
    ...bijlage
});

export const jaarbijlageToJaarbijlageInput = (bijlage: BijlageFieldsFragment) => ({
    id: bijlage.id,
    type: bijlage.type
});

export const bijlageFieldsFragmentToBijlageInput = (bijlage: BijlageFieldsFragment): NotitieBijlageInput => ({
    contentType: bijlage.contentType,
    id: bijlage.id,
    titel: bijlage.titel,
    uploadContextId: bijlage.uploadContextId,
    url: bijlage.url,
    extensie: bijlage.extensie
});

export const toKopieerJaarbijlageMapInput = (bijlagemap: BijlageMapFieldsFragment) => ({
    id: bijlagemap.id,
    bijlagen: bijlagemap.bijlagen.map(jaarbijlageToJaarbijlageInput)
});

export const methodeInhoudToBijlage = (methodeInhoud: MethodeInhoud, index: number): BijlageFieldsFragment =>
    ({
        id: undefined,
        type: BijlageType.URL,
        titel: methodeInhoud.naam,
        url: methodeInhoud.url,
        zichtbaarVoorLeerling: true,
        extensie: 'URL',
        sortering: index,
        contentType: 'text/html',
        methodeId: methodeInhoud.id,
        synchroniseertMet: null,
        uploadContextId: null,
        differentiatiegroepen: [],
        differentiatieleerlingen: []
    }) as any as BijlageFieldsFragment;
