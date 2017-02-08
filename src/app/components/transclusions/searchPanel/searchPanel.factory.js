angular
    .module('searchPanel')
    .factory('searchPanelFactory', ['mainAppService',
        function(mainAppService) {

        var placenameHitsPerPage = 15;

        var placenamePage=0;

        var mapEpsg='EPSG:25833';

        var initialSearchServices= ['ssr', 'matrikkelveg', 'matrikkeladresse', 'matrikkelnummer'];

        var availableUTMZones=['25832','25833','25834','25835','25836','32632','32633','32634','32635','32636'];

            var sourceDict = {
                'ssr': 'Stedsnavn',
                'adresse': 'Adresse',
                'matrikkelveg': 'Vegnavn',
                'matrikkeladresse': 'Adresse',
                'coordGeo': 'Geografisk koordinat',
                'coordUtm': 'UTM-koordinat',
                'mouseClick': 'Klikk i kartet',
                'matrikkelnummer': 'Gårds og bruksnummer'
            };

            var generateServiceDict = function (query) {
                var serviceDict = {};
                serviceDict['ssr'] = {
                    url: mainAppService.generateSearchStedsnavnUrl(query, placenamePage, placenameHitsPerPage),
                    format: 'xml',
                    source: 'ssr',
                    epsg: 'EPSG:25833',
                    nameID: 'stedsnavn',
                    latID: 'nord',
                    lonID: 'aust',
                    kommuneID: 'kommunenavn',
                    husnummerID: 'HUSNR',
                    navnetypeID: 'navnetype'
                };
                serviceDict['matrikkelveg'] = {
                    url: mainAppService.generateSearchMatrikkelVegUrl(query),
                    format: 'json',
                    source: 'matrikkelveg',
                    epsg: 'EPSG:25832',
                    nameID: 'NAVN',
                    latID: 'LATITUDE',
                    lonID: 'LONGITUDE',
                    kommuneID: 'KOMMUNENAVN',
                    husnummerID: 'HUSNUMMER',
                    navnetypeID: false
                };
                serviceDict['matrikkeladresse'] = {
                    url: mainAppService.generateSearchMatrikkelAdresseUrl(query),
                    format: 'json',
                    source: 'matrikkeladresse',
                    epsg: 'EPSG:25832',
                    nameID: 'NAVN',
                    latID: 'LATITUDE',
                    lonID: 'LONGITUDE',
                    kommuneID: 'KOMMUNENAVN',
                    husnummerID: false,
                    navnetypeID: false
                };
                serviceDict['matrikkelnummer'] = {
                    url: mainAppService.generateSearchMatrikkelNummerUrl(query),
                    format: 'json',
                    source: 'matrikkelnummer',
                    epsg: 'EPSG:25832',
                    nameID: 'NAVN',
                    latID: 'LATITUDE',
                    lonID: 'LONGITUDE',
                    kommuneID: 'KOMMUNENAVN',
                    husnummerID: false,
                    navnetypeID: false
                };
                 serviceDict['adresse'] = {
                     url: mainAppService.generateSearchAdresseUrl(query),
                     format: 'json',
                     source: 'adresse',
                     epsg: 'EPSG:4326',
                     nameID: 'adressenavn',
                     latID: 'nord',
                     lonID: 'aust',
                     kommuneID: false,
                     husnummerID: false,
                     navnetypeID: false
                 };
                return serviceDict;
            };

            var searchOptionsOrder=['seEiendom', 'ssrFakta',  'koordTrans', 'lagTurkart', 'lagFargeleggingskart', 'lagNodplakat'];
            var eiendomMarkering = false;

            return {
                getSourceDict: function () {
                    return sourceDict;
                },
                getServiceDict: function (query) {
                    return generateServiceDict(query);
                },
                getAvailableUTMZones: function () {
                    return availableUTMZones;
                },
                getSearchOptionsOrder: function () {
                    return searchOptionsOrder;
                },
                getInitialSearchServices: function () {
                    return initialSearchServices;
                },
                getMapEpsg: function () {
                    return mapEpsg;
                },
                getPlacenameHitsPerPage: function () {
                    return placenameHitsPerPage;
                },
                resetPlacenamePage: function () {
                    placenamePage=0;
                    return placenamePage;
                },
                decreasePlacenamePage: function () {
                    if(placenamePage>0) {
                        placenamePage--;
                    }
                    return placenamePage;
                },
                increasePlacenamePage: function () {
                    placenamePage++;
                    return placenamePage;
                },
                getPlacenamePage: function () {
                    return placenamePage;
                },

                setPlacenamePage: function (value) {
                    placenamePage = value;
                },

                constructPoint : function (lat, lon, epsgFrom, epsgTo) {
                    return ol.proj.transform([lon, lat], epsgFrom, epsgTo);
                },

                setShowEiendomMarkering: function (value) {
                    eiendomMarkering = value;
                },

                getShowEiendomMarkering: function () {
                    return eiendomMarkering;
                }
            };

        }
        ]);