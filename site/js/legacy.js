// Canonical destinations for bookmarks from the retired one-page design.
const route = {home:"",dashboard:"",apply:"demande/",demande:"demande/",vote:"tribunal/",tribunal:"tribunal/",transparency:"transparence/",token:"token/",lots:"lots/",wallet:"wallet/",validators:"validateurs/",council:"conseil/",antibot:"antibot/"};
const fragment = location.hash.slice(1).toLowerCase();
location.replace(new URL(`../${Object.hasOwn(route,fragment)?route[fragment]:""}`,location.href));
