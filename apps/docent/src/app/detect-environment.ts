export const detectEnvironment = (host = window.location.host) => {
    const environments = {
        develop: /^dev\.docenttoday\.build$/,
        nightly: /^pre\.docenttoday\.build$/,
        test: /^.*\.test\.somtoday\.nl$/,
        acceptatie: /^.*\.acceptatie\.somtoday\.nl$/,
        inkijk: /^.*\.inkijk\.somtoday\.nl$/,
        productie: /^docent\.somtoday\.nl$/
    };

    for (const index in environments) {
        if ((<any>environments)[index].test(host)) {
            return index;
        }
    }

    return 'lokaal'; // for local dev server willen we geen data naar bugsnag sturen
};
