angular.module('searchPanel')
    .directive('searchPanel', ['$timeout', 'mainAppService', 'ISY.MapAPI.Map', 'ISY.EventHandler', '$http', 'searchPanelFactory', '$window', 'toolsFactory', '$location',
        function ($timeout, mainAppService, map, eventHandler, $http, searchPanelFactory, $window, toolsFactory, $location) {
            return {
                templateUrl: 'components/transclusions/searchPanel/searchPanel.html',
                restrict: 'A',
                controller: 'searchPanelController',
                link: function (scope) {
                    scope.searchBarValueChanged = function () {
                        if (scope.searchBarModel === '') {
                            scope.cleanResults();
                            return;
                        }
                        var query = _getQuery();
                        if (_checkQueryForCoordinates(query)) {
                            scope.initSearchOptions();
                            return;
                        }
                        _init(query);
                        scope.showSearchResultPanel();
                        scope.getResults(searchPanelFactory.getInitialSearchServices());
                    };

                    scope.sourceDict = searchPanelFactory.getSourceDict();

                    scope.mapEpsg = searchPanelFactory.getMapEpsg();

                    _searchResults = {};

                    _unifiedResults = {};

                    _serviceDict = {};

                    _queryDict = {};

                    String.prototype.replaceAll = function (search, replacement) {
                        var target = this;
                        return target.replace(new RegExp(search, 'g'), replacement);
                    };

                    var _parseInput = function (input) {
                        var parsedInput = {},
                            reResult, what3words,
                            decimalPairComma,
                            decimalPairDot,
                            decimalCoordinatesNE,
                            degMinNE,
                            degMinEN,
                            degMinSecNE,
                            degMinSecEN;

                        // matches two numbers using either . or , as decimal mark. Numbers using . as decimal mark are separated by , or , plus blankspace. Numbers using , as decimal mark are separated by blankspace
                        what3words = /^[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+$/;
                        decimalPairComma = /^[ \t]*([0-9]+,[0-9]+|[0-9]+)[ \t]+([0-9]+,[0-9]+|[0-9]+)(?:@([0-9]+))?[ \t]*$/;
                        decimalPairDot = /^[ \t]*([0-9]+\.[0-9]+|[0-9]+)(?:[ \t]+,|,)[ \t]*([0-9]+\.[0-9]+|[0-9]+)(?:@([0-9]+))?[ \t]*$/;
                        decimalCoordinatesNE = /^[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*[°]?[ \t]*[nN]?[ \t]*,?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*[°]?[ \t]*[eEøØoO]?[ \t]*$/;
                        degMinNE = /^[ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*[nN]?[ \t]*,?[ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*[eEoOøØ]?[ \t]*?/;
                        degMinEN = /^[ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*[eEoOøØ][ \t]*,?[ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*[nN][ \t]*?/;
                        degMinSecNE = /^[ \t]*[nN]?[ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*(?:"||''||′′)[ \t]*[nN]?[ \t]*,?[ \t]*[eEøØoO]?[ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*(?:"||''||′′)[ \t]*[eEoOøØ]?[ \t]*?/;
                        degMinSecEN = /^[ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*(?:"||''||′′)[ \t]*[eEøØoO][ \t]*,?[ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*(?:"||''||′′)[ \t]*[nN][ \t]*?/;
                        degMinSecEN2 = /^[ \t]*[eEøØoO][ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*(?:"||''||′′)[ \t]*,?[ \t]*[nN][ \t]*([0-9]+)[ \t]*[°]?[ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*['′][ \t]*([0-9]+[,\.][0-9]+|[0-9]+)[ \t]*(?:"||''||′′)[ \t]*?/;

                        var interpretAsNorthEastOrXY = function (obj) {
                            if (obj && typeof obj.first === 'number' && typeof obj.second === 'number') {
                                obj.north = obj.first;
                                delete obj.first;

                                obj.east = obj.second;
                                delete obj.second;
                            }
                            return obj;
                        };

                        if (typeof input === 'string') {
                            if (what3words.test(input)) {
                                parsedInput.phrase = input;
                                parsedInput.w3w = true;
                            } else if (decimalPairComma.test(input)) {
                                reResult = decimalPairComma.exec(input);
                                parsedInput.first = parseFloat(reResult[1]);
                                parsedInput.second = parseFloat(reResult[2]);
                                if (!!reResult[3]) {
                                    parsedInput.projectionHint = parseInt(reResult[3], 10);
                                }
                                interpretAsNorthEastOrXY(parsedInput);

                            } else if (decimalPairDot.test(input)) {
                                reResult = decimalPairDot.exec(input);
                                parsedInput.first = parseFloat(reResult[1]);
                                parsedInput.second = parseFloat(reResult[2]);
                                if (!!reResult[3]) {
                                    parsedInput.projectionHint = parseInt(reResult[3], 10);
                                }
                                interpretAsNorthEastOrXY(parsedInput);

                            } else if (decimalCoordinatesNE.test(input)) {
                                reResult = decimalCoordinatesNE.exec(input);
                                parsedInput.north = {};
                                parsedInput.east = {};
                                parsedInput.north.deg = parseFloat(reResult[1]);
                                parsedInput.east.deg = parseFloat(reResult[2]);
                            } else if (degMinNE.test(input)) {
                                reResult = degMinNE.exec(input);
                                parsedInput.north = {};
                                parsedInput.east = {};
                                parsedInput.north.deg = parseFloat(reResult[1]);
                                parsedInput.north.min = parseFloat(reResult[2]);
                                parsedInput.east.deg = parseFloat(reResult[3]);
                                parsedInput.east.min = parseFloat(reResult[4]);
                            } else if (degMinEN.test(input)) {
                                reResult = degMinEN.exec(input);
                                parsedInput.north = {};
                                parsedInput.east = {};
                                parsedInput.east.deg = parseFloat(reResult[1]);
                                parsedInput.east.min = parseFloat(reResult[2]);
                                parsedInput.north.deg = parseFloat(reResult[3]);
                                parsedInput.north.min = parseFloat(reResult[4]);
                            } else if (degMinSecNE.test(input)) {
                                reResult = degMinSecNE.exec(input);
                                parsedInput.north = {};
                                parsedInput.east = {};
                                parsedInput.north.deg = parseFloat(reResult[1]);
                                parsedInput.north.min = parseFloat(reResult[2]);
                                parsedInput.north.sec = parseFloat(reResult[3]);
                                parsedInput.east.deg = parseFloat(reResult[4]);
                                parsedInput.east.min = parseFloat(reResult[5]);
                                parsedInput.east.sec = parseFloat(reResult[6]);
                            } else if (degMinSecEN.test(input)) {
                                reResult = degMinSecEN.exec(input);
                                parsedInput.north = {};
                                parsedInput.east = {};
                                parsedInput.east.deg = parseFloat(reResult[1]);
                                parsedInput.east.min = parseFloat(reResult[2]);
                                parsedInput.east.sec = parseFloat(reResult[3]);
                                parsedInput.north.deg = parseFloat(reResult[4]);
                                parsedInput.north.min = parseFloat(reResult[5]);
                                parsedInput.north.sec = parseFloat(reResult[6]);
                            } else if (degMinSecEN2.test(input)) {
                                reResult = degMinSecEN2.exec(input);
                                parsedInput.north = {};
                                parsedInput.east = {};
                                parsedInput.east.deg = parseFloat(reResult[1]);
                                parsedInput.east.min = parseFloat(reResult[2]);
                                parsedInput.east.sec = parseFloat(reResult[3]);
                                parsedInput.north.deg = parseFloat(reResult[4]);
                                parsedInput.north.min = parseFloat(reResult[5]);
                                parsedInput.north.sec = parseFloat(reResult[6]);
                            }
                            var degMinSec2Deg = function (dms) {
                                if (typeof dms.sec === 'number') {
                                    dms.min += dms.sec / 60;
                                    delete dms.sec;
                                }
                                if (typeof dms.min === 'number') {
                                    dms.deg += dms.min / 60;
                                    delete dms.min;
                                }
                            };
                            if (parsedInput.north) {
                                degMinSec2Deg(parsedInput.north);
                                if (typeof parsedInput.north.deg === 'number') {
                                    parsedInput.north = parsedInput.north.deg;
                                }
                            }
                            if (parsedInput.east) {
                                degMinSec2Deg(parsedInput.east);
                                if (typeof parsedInput.east.deg === 'number') {
                                    parsedInput.east = parsedInput.east.deg;
                                }
                            }
                            return parsedInput;
                        }
                        return null;
                    };

                    var _w3wSearch = function (query) {
                        $.ajax({
                            url: mainAppService.generateWhat3WordsServiceUrl(),
                            data: query,
                            dataType: 'JSON',
                            success: function (r) {
                                if (!r.position) {
                                    return;
                                }
                                scope.showQueryPoint(scope.contructQueryPoint(parseFloat(r.position[0]), parseFloat(r.position[1]), 'EPSG:4326', 'coordGeo', ''));
                            }
                        });
                    };
                    
                    var _checkQueryForCoordinates = function (query) {
                        scope.coordinate = true;
                        var epsg = query.split('@')[1];
                        var params = _parseInput(query);

                        if (!!params.w3w) {
                            _w3wSearch(params.phrase);
                        } else if (typeof params.phrase === 'string') {
                            return false;
                        }
                        var availableUTMZones = searchPanelFactory.getAvailableUTMZones();
                        if (availableUTMZones.indexOf(epsg) > -1) {
                            scope.showQueryPoint(scope.contructQueryPoint(params.east, params.north, 'EPSG:' + epsg, 'coordUtm', ''));
                            return true;
                        }
                        if (!!epsg) {
                            return false;
                        }
                        if (((params.north > 32.88) && (params.east > -16.1)) && ((params.north < 84.17) && (params.east < 39.65))) {
                            epsg = 'EPSG:4258';
                            scope.showQueryPoint(scope.contructQueryPoint(params.north, params.east, epsg, 'coordGeo', ''));
                            return true;
                        }
                        if (((params.north > -2465220.60) && (params.east > 4102904.86)) && ((params.north < 771164.64) && (params.east < 9406031.63))) {
                            epsg = 'EPSG:25833';
                            scope.showQueryPoint(scope.contructQueryPoint(params.east, params.north, epsg, 'coordUtm', ''));
                            scope.searchBarModel += '@' + scope.mapEpsg.split(':')[1];
                            return true;
                        }
                        return false;
                    };

                    scope.contructQueryPoint = function (lat, lon, epsg, source, kommune) {
                        return {
                            name: '',
                            point: searchPanelFactory.constructPoint(lat, lon, epsg, scope.mapEpsg),
                            //format: _serviceDict[source].format,
                            source: source,
                            kommune: kommune
                        };
                    };

                    scope.showQueryPoint = function (queryPoint) {
                        if (!scope.searchResults) {
                            scope.searchResults = {};
                        }
                        scope.searchResults['searchBar'] = queryPoint;
                        scope.removeInfomarkers();
                        map.ShowInfoMarker(queryPoint.point);
                        scope.activatePosition(queryPoint);
                        if (queryPoint.source === 'coordGeo' || queryPoint.source === 'coordUtm') {
                            scope.showSearchOptionsPanel();
                        }
                    };

                    scope.removeInfomarkers = function () {
                        map.RemoveInfoMarkers();
                        map.RemoveInfoMarker();
                    };

                    var _init = function (query) {
                        _resetResults();
                        scope.searchResults = undefined;
                        scope.activeSearchResult = undefined;
                        scope.populateServiceDict(query);
                        scope.coordinate = false;
                        map.RemoveInfoMarker();
                        scope.placenamePage = searchPanelFactory.resetPlacenamePage() + 1;
                    };

                    var _getQuery = function () {
                        return scope.searchBarModel + '';
                    };

                    scope.populateServiceDict = function (query) {
                        _serviceDict = searchPanelFactory.getServiceDict(query);
                    };

                    scope.getResults = function (searchServices) {
                        _cancelOldRequests();
                        scope.searchTimestamp = parseInt((new Date()).getTime(), 10);
                        for (var serviceIndex = 0; serviceIndex < searchServices.length; serviceIndex++) {
                            _downloadSearchBarFromUrl(_serviceDict[searchServices[serviceIndex]], scope.searchTimestamp);
                        }
                    };

                    var _cancelOldRequests = function () {
                        for (var service in _queryDict) {
                            _queryDict[service].abort();
                        }
                    };

                    var _resetResults = function () {
                        _unifiedResults = {};
                        _searchResults = {};
                    };

                    scope.resetResultsService = function (service) {
                        _unifiedResults[service] = {};
                        _searchResults[service] = {};
                        scope.searchResults[service] = {};
                    };

                    var _readResults = function () {
                        var jsonObject;
                        for (var service in _searchResults) {
                            var searchResult = _searchResults[service];
                            jsonObject = _convertSearchResult2Json(searchResult.document, searchResult.source);
                            _iterateJsonObject(jsonObject, searchResult);
                        }
                    };

                    var _convertSearchResult2Json = function (document, source) {
                        switch (source) {
                            case ('ssr'):
                                var jsonObject = xml.xmlToJSON(document);
                                _getPlacenameHits(jsonObject);
                                return jsonObject.sokRes.stedsnavn;
                            case ('adresse'):
                                return document.adresser;
                            default:
                                return JSON.parse(document);
                        }
                    };

                    var _generateArrayWithValues = function (values) {
                        return new Array(values);
                    };

                    var _getPlacenameHits = function (jsonObject) {
                        scope.placenameHits = jsonObject.sokRes.totaltAntallTreff;
                        scope.placenameItems = _generateArrayWithValues(parseInt(scope.placenameHits, 10));
                        scope.placenamePageTotal = Math.ceil(scope.placenameHits / searchPanelFactory.getPlacenameHitsPerPage());
                    };

                    scope.getNextPlacenamePage = function () {
                        scope.placenamePage = searchPanelFactory.increasePlacenamePage() + 1;
                        scope.resetResultsService('ssr');
                        map.RemoveInfoMarker();
                        scope.populateServiceDict(scope.searchBarModel);
                        scope.getResults(['ssr']);
                    };

                    scope.getPreviousPlacenamePage = function () {
                        scope.placenamePage = searchPanelFactory.decreasePlacenamePage() + 1;
                        scope.resetResultsService('ssr');
                        map.RemoveInfoMarker();
                        scope.populateServiceDict(scope.searchBarModel);
                        scope.getResults(['ssr']);
                    };

                    scope.pageChanged = function (newPage) {
                        scope.placenamePage = newPage;
                        searchPanelFactory.setPlacenamePage(newPage);
                        scope.resetResultsService('ssr');
                        map.RemoveInfoMarker();
                        scope.populateServiceDict(scope.searchBarModel);
                        scope.getResults(['ssr']);
                    };

                    var _iterateJsonObject = function (jsonObject, searchResult) {
                        if (jsonObject) {
                            if (!jsonObject.length) {
                                jsonObject = [jsonObject];
                            }
                            for (var i = 0; i < jsonObject.length; i++) {
                                if (jsonObject[i][_serviceDict[searchResult.source].latID]) {
                                    _getValuesFromJson(_serviceDict[searchResult.source], jsonObject[i]);
                                }
                            }
                        }
                    };

                    var _getValuesFromJson = function (identifiersDict, jsonObject) {
                        var name = jsonObject[identifiersDict.nameID];
                        var lat = jsonObject[identifiersDict.latID] + '';
                        var lon = jsonObject[identifiersDict.lonID] + '';
                        var kommune = jsonObject[identifiersDict.kommuneID];
                        var point = searchPanelFactory.constructPoint(lat, lon, identifiersDict.epsg, scope.mapEpsg);
                        var husnummer = jsonObject[identifiersDict.husnummerID];
                        var navnetype = jsonObject[identifiersDict.navnetypeID];
                        var result = {
                            name: name,
                            kommune: kommune,
                            point: point,
                            format: identifiersDict.format,
                            source: identifiersDict.source,
                            husnummer: husnummer,
                            navnetype: navnetype
                        };
                        _pushToUnifiedResults(result);
                    };

                    var _removeNumberFromName = function (name) {
                        var nameArray = name.split(' ');
                        var matches = nameArray[nameArray.length - 1].match(/\d+/g);
                        if (matches != null) {
                            return name.replace(nameArray[nameArray.length - 1], '').trim();
                        } else {
                            return name.trim();
                        }
                    };

                    scope.fixNames = function (name) {
                        return _removeNumberFromName(scope.capitalizeName(name.toLowerCase()));
                    };

                    var _pushToUnifiedResults = function (result) {
                        result.name = result.source != 'matrikkelnummer' ? scope.fixNames(result.name) : result.name;
                        result.kommune = scope.capitalizeName(result.kommune.toLowerCase());
                        // var resultID = result.name + result.kommune;
                        var resultID = _createID(result);
                        if (!_unifiedResults[result.source]) {
                            _unifiedResults[result.source] = {};
                        }
                        _unifiedResults[result.source][resultID] = {
                            name: result.name,
                            point: result.point,
                            format: result.format,
                            source: result.source,
                            kommune: result.kommune,
                            id: resultID
                        };
                        if (result.husnummer) {
                            _unifiedResults[result.source][resultID]['husnummer'] = result.husnummer;
                        } else if (result.navnetype) {
                            _unifiedResults[result.source][resultID]['navnetype'] = result.navnetype;
                        }
                    };

                    var _createID = function (result) {
                        return result.name + (result.point[0] + '').split('.')[0] + (result.point[1] + '').split('.')[0];
                    };

                    scope.capitalizeName = function (name) {
                        name = name.trim();
                        name = _capitalizeNamePart(name, ' ');
                        name = _capitalizeNamePart(name, '-');
                        return name;
                    };

                    var _capitalizeNamePart = function (name, separator) {
                        var nameArray = name.split(separator);
                        var newName = '';
                        for (var i = 0; i < nameArray.length; i++) {
                            newName += _capitalizeFirstLetter(nameArray[i]) + separator;
                        }
                        newName = _rtrim(newName, 1);
                        return newName;
                    };

                    var _capitalizeFirstLetter = function (string) {
                        return string.charAt(0).toUpperCase() + string.slice(1);
                    };

                    var _rtrim = function (str, length) {
                        return str.substr(0, str.length - length);
                    };

                    var _downloadSearchBarFromUrl = function (_serviceDict, timestamp) {
                        _queryDict[_serviceDict.source] = $.ajax({
                            type: "GET",
                            url: _serviceDict.url,
                            async: true,
                            success: function (document) {
                                if (((document.length && document.length > 0) || (document.childNodes && document.childNodes[0].childNodes.length)) && scope.searchTimestamp == timestamp) {
                                    _successFullSearch(_serviceDict, document);
                                }
                            }
                            /*,
                                                         error: function (searchError) {
                                                         console.log("Error downloading from " + _serviceDict.url, searchError);
                                                         }*/
                        });
                    };

                    var _successFullSearch = function (_serviceDict, document) {
                        _searchResults[_serviceDict.source] = {
                            document: document,
                            format: _serviceDict.format,
                            source: _serviceDict.source,
                            epsg: _serviceDict.epsg
                        };
                        _readResults();
                        if (_notSingleAddressHit()) {
                            scope.addResultsToMap();
                        }
                    };

                    var _notSingleAddressHit = function () {
                        var matrikkelKey = 'matrikkeladresse';
                        if (_unifiedResults[matrikkelKey] && Object.keys(_unifiedResults[matrikkelKey]).length == 1 && !_unifiedResults['matrikkelveg'] && !_unifiedResults['ssr']) {
                            var key = Object.keys(_unifiedResults[matrikkelKey])[0];
                            var result = _unifiedResults[matrikkelKey][key];
                            scope.showQueryPoint(scope.contructQueryPoint(result.point[1], result.point[0], scope.mapEpsg, result.source, result.kommune));
                            scope.showSearchOptionsPanel();
                            return false;
                        }
                        return true;
                    };

                    scope.addResultsToMap = function () {
                        var coordinates = [];
                        for (var source in _unifiedResults) {
                            if (source == 'matrikkeladresse' && _unifiedResults['matrikkelveg'] && Object.keys(_unifiedResults['matrikkelveg']).length > 1) {
                                continue;
                            }
                            for (var result in _unifiedResults[source]) {
                                coordinates.push(_unifiedResults[source][result].point);
                            }
                        }
                        if (coordinates.length > 0) {
                            map.RemoveInfoMarkers();
                            map.ShowInfoMarkers(coordinates);
                            $timeout(function () {
                                scope.searchResults = _unifiedResults;
                            }, 0);
                        }
                    };

                    scope.mouseOver = function (searchResult) {
                        scope.mouseHoverSearchResult = searchResult;
                        map.RemoveInfoMarker();
                        map.ShowInfoMarker(searchResult.point);
                    };

                    scope.activatePosition = function (searchResult) {
                        var activePosition = {
                            lon: parseFloat(searchResult.point[0]),
                            lat: parseFloat(searchResult.point[1])
                            // epsg: scope.mapEpsg
                        };
                        var zoomTo = parseFloat(13);
                        var activeZoom = parseFloat($location.search().zoom);
                        if (scope.searchPanelLayout != "searchSeEiendomPanel" && activeZoom < zoomTo && searchResult.source != 'mouseClick') {
                            activePosition.zoom = zoomTo;
                        }
                        activePosition.geographicPoint = searchPanelFactory.constructPoint(activePosition.lat, activePosition.lon, scope.mapEpsg, 'EPSG:4326');
                        map.SetCenter(activePosition);
                        map.RemoveInfoMarkers();
                        scope.activePosition = activePosition;
                        scope.activeSearchResult = searchResult;
                        if (scope.searchOptionsDict['elevationPoint']) {
                            scope.searchOptionsDict['elevationPoint'].text.value = undefined;
                        }
                        if (scope.searchBarModel.length < searchResult.name.length && !scope.coordinate && scope.activeSearchResult.source != 'mouseClick') {
                            scope.searchBarModel = searchResult.name;
                        }
                        scope.initSearchOptions();
                    };

                    scope.cleanResults = function () {
                        _init();
                        scope.removeInfomarkers();
                        scope.searchBarModel = "";
                        // scope.showSearchResultPanel();
                        scope.deactivatePrintBoxSelect();
                    };

                    scope.resetSearchPanel = function () {
                        scope.showSearchOptionsPanel();
                        scope.searchPanelLayout = '';
                        searchPanelFactory.setShowEiendomMarkering(false);
                    };

                    var showQueryPointFromMouseClick = function (coordinates) {
                        scope.coordinate = true;
                        // scope.showSearchResultPanel();

                        scope.cleanResults();
                        scope.showQueryPoint(scope.contructQueryPoint(coordinates[1], coordinates[0], scope.mapEpsg, 'mouseClick', ''));
                        scope.initLastSearchPanel();
                    };

                    eventHandler.RegisterEvent(ISY.Events.EventTypes.MapClickCoordinate, showQueryPointFromMouseClick);

                    // Start searchOptions

                    var _clickableLinkClass = {
                        icon: 'search-options pointer-cursor',
                        text: 'pointer-cursor'
                    };

                    var _defaultClass = {
                        icon: 'search-options',
                        text: ''
                    };

                    var _downloadSearchOptionFromUrl = function (url, name) {
                        $http.get(url).then(function (response) {
                            _addSearchOptionToPanel(name, response.data);
                            scope.showMatrikelInfoSearch = false;
                        });
                    };

                    var _fetchElevationPoint = function () {
                        var lat = scope.activePosition.lat;
                        var lon = scope.activePosition.lon;
                        var epsgNumber = scope.mapEpsg.split(':')[1];
                        var elevationPointUrl = mainAppService.generateElevationPointUrl(lat, lon, epsgNumber);
                        _downloadSearchOptionFromUrl(elevationPointUrl, 'elevationPoint');
                    };

                    var _fetchMatrikkelInfo = function () {
                        scope.showMatrikelInfoSearch = true;
                        var lat = scope.activePosition.geographicPoint[1];
                        var lon = scope.activePosition.geographicPoint[0];
                        var matrikkelInfoUrl = mainAppService.generateMatrikkelInfoUrl(lat, lon, lat, lon);
                        _downloadSearchOptionFromUrl(matrikkelInfoUrl, 'seEiendom');
                    };

                    var _addKoordTransToSearchOptions = function () {
                        var name = 'koordTrans';
                        scope.searchOptionsDict[name] = _constructSearchOption(name, 'fa fa-map-marker', true, 'Se koordinater', {});
                    };

                    var _addLagTurkartToSearchOptions = function () {
                        var name = 'lagTurkart';
                        scope.searchOptionsDict[name] = _constructSearchOption(name, 'fa fa-blind', true, 'Lage turkart', {});
                    };

                    var _addLagFargeleggingskartToSearchOptions = function () {
                        var name = 'lagFargeleggingskart';
                        scope.searchOptionsDict[name] = _constructSearchOption(name, 'fa fa-paint-brush', true, 'Lage fargeleggingskart', {});
                    };

                    var _addEmergencyPosterToSearchOptions = function () {
                        var name = 'lagNodplakat';
                        scope.searchOptionsDict[name] = _constructSearchOption(name, 'fa fa-ambulance', true, 'Lage nødplakat', {});
                    };

                    var _addElevationPointToSearchOptions = function (jsonRoot, name) {
                        var stedsnavn = jsonRoot.Output[0].Data.LiteralData.Text;
                        var text = '"' + stedsnavn + '"';
                        var extra = {
                            url: mainAppService.generateFaktaarkUrl(jsonRoot.Output[3].Data.LiteralData.Text)
                        };
                        scope.searchOptionsDict['ssrFakta'] = _constructSearchOption('ssrFakta', 'fa fa-flag', true, text, extra);
                        if (scope.activeSearchResult && scope.activeSearchResult.source == 'mouseClick') {
                            scope.searchBarModel = stedsnavn;
                        }

                        text = jsonRoot.Output[2].Data.LiteralData.Text.split('.')[0] + ' ';
                        extra = {};
                        scope.searchOptionsDict[name] = _constructSearchOption(name, '↑', false, text, extra);
                    };

                    var _addMatrikkelInfoToSearchOptions = function (jsonRoot, name) {
                        if (!jsonRoot[0]) {
                            jsonRoot = [jsonRoot];
                        }
                        var matrikkelInfo = [];
                        for (var i = 0; i < jsonRoot.length; i++) {
                            if ((jsonRoot.MATRIKKELNR == 'Mnr mangler') || (jsonRoot.MATRIKKELNR == 'Mnr vann mangler')) {
                                continue;
                            }

                            var extra = {
                                kommunenr: jsonRoot[i].KOMMUNENR,
                                gardsnr: jsonRoot[i].GARDSNR,
                                bruksnr: jsonRoot[i].BRUKSNR,
                                festenr: jsonRoot[i].FESTENR,
                                seksjonsnr: jsonRoot[i].SEKSJONSNR,
                                eiendomstype: jsonRoot[i].EIENDOMSTYPE,
                                matrikkelnr: jsonRoot[i].MATRIKKELNR
                            };

                            extra.matrikkeladresse = extra.kommunenr + '-' + extra.gardsnr + '/' + extra.bruksnr;

                            if (parseInt(extra.festenr, 10) > 0) {
                                extra.matrikkeladresse += '/' + extra.festenr;
                                if (parseInt(extra.seksjonsnr, 10) > 0) {
                                    extra.matrikkeladresse += '/' + extra.seksjonsnr;
                                }
                            }

                            extra.url = mainAppService.generateSeEiendomUrl(extra.kommunenr, extra.gardsnr, extra.bruksnr, extra.festenr, extra.seksjonsnr);
                            var text = '' + extra.kommunenr + '-' + extra.matrikkelnr.replace(new RegExp(' ', 'g'), '');
                            matrikkelInfo.push(_constructSearchOption(name, 'fa fa-home', true, text, extra));
                        }

                        var tmpResults;
                        if (matrikkelInfo.length > 1) {
                            tmpResults = matrikkelInfo.sort(function (a, b) {
                                return a.matrikkeladresse.localeCompare(b.matrikkeladresse);
                            });
                        }

                        scope.searchOptionsDict[name] = matrikkelInfo[0];
                        if (tmpResults) {
                            scope.searchOptionsDict[name].allResults = tmpResults;
                        }
                    };

                    scope.fetchAddressInfoForMatrikkel = function () {
                        scope.showFetchAdressSearch = true;
                        var komunenr = scope.searchOptionsDict['seEiendom'].kommunenr;
                        var gardsnr = scope.searchOptionsDict['seEiendom'].gardsnr;
                        var bruksnr = scope.searchOptionsDict['seEiendom'].bruksnr;
                        var festenr = scope.searchOptionsDict['seEiendom'].festenr;
                        var sectionsnr = scope.searchOptionsDict['seEiendom'].seksjonsnr;
                        var url = mainAppService.generateEiendomAddress(komunenr, gardsnr, bruksnr, festenr, sectionsnr);
                        $http.get(url).then(function (response) {
                            scope.showFetchAdressSearch = false;
                            scope.vegaddresse = '';
                            scope.kommuneNavn = '';
                            scope.cityName = '';
                            var addressNum = [];
                            var responseData = response.data;
                            for (var i = 0; i < responseData.length; i++) {
                                var adressWithNum = responseData[i].VEGADRESSE2.split(" ");
                                if (scope.vegaddresse === '') {
                                    scope.vegaddresse = adressWithNum[0];
                                }
                                if (scope.kommuneNavn === '') {
                                    scope.kommuneNavn = responseData[i].KOMMUNENAVN;
                                }
                                if (scope.cityName === '' && responseData[i].VEGADRESSE !== "") {
                                    scope.cityName = responseData[i].VEGADRESSE[1];
                                }
                                addressNum.push(adressWithNum[adressWithNum.length - 1]);
                            }

                            addressNum.sort(function (a, b) {
                                if (a < b) {
                                    return -1;
                                }
                                if (a > b) {
                                    return 1;
                                }
                                return 0;
                            });

                            for (var j = 0; j < addressNum.length; j++) {
                                if (addressNum[j] !== "") {
                                    scope.vegaddresse += " " + addressNum[j];
                                    if (j !== addressNum.length - 1) {
                                        scope.vegaddresse += ",";
                                    }
                                }
                            }
                        });
                    };


                    var _addSearchOptionToPanel = function (name, data) {
                        var jsonObject;
                        var jsonRoot;
                        switch (name) {
                            case ('elevationPoint'):
                                jsonObject = xml.xmlToJSON(data);
                                jsonRoot = jsonObject.ExecuteResponse.ProcessOutputs;
                                if (!jsonRoot.Output[0].Data.LiteralData) {
                                    return;
                                }
                                _addElevationPointToSearchOptions(jsonRoot, name);
                                break;

                            case ('seEiendom'):
                                jsonObject = xml.xmlToJSON(data);
                                if (!jsonObject.FeatureCollection) {
                                    return;
                                }
                                if (!jsonObject.FeatureCollection.featureMembers) {
                                    return;
                                }
                                jsonRoot = jsonObject.FeatureCollection.featureMembers.TEIGWFS;
                                _addMatrikkelInfoToSearchOptions(jsonRoot, name);

                                scope.fetchAddressInfoForMatrikkel();
                                if (searchPanelFactory.getShowEiendomMarkering()) {
                                    scope.showSelection();
                                }
                                break;
                        }
                    };

                    var _constructSearchOption = function (name, icon, clickable, text, extra) {
                        var searchOption = {
                            icon: {
                                value: icon,
                                class: _defaultClass.icon
                            },
                            text: {
                                value: text,
                                class: _defaultClass.text
                            },
                            name: name
                        };

                        if (clickable) {
                            searchOption.icon.class = _clickableLinkClass.icon;
                            searchOption.text.class = _clickableLinkClass.text;
                        }
                        for (var key in extra) {
                            searchOption[key] = extra[key];
                        }
                        return searchOption;
                    };

                    var _emptySearchOption = function () {
                        var searchOption = {
                            icon: {
                                value: '',
                                class: ''
                            },
                            text: {
                                value: '',
                                class: ''
                            },
                            name: ''
                        };

                        return searchOption;
                    };

                    scope.initSearchOptions = function () {

                        scope.searchOptionsOrder = searchPanelFactory.getSearchOptionsOrder();
                        for (var searchOption in scope.searchOptionsOrder) {
                            scope.searchOptionsDict[scope.searchOptionsOrder[searchOption]] = _emptySearchOption();
                        }
                        _fetchElevationPoint();
                        _fetchMatrikkelInfo();
                        _addKoordTransToSearchOptions();
                        _addLagTurkartToSearchOptions();
                        _addLagFargeleggingskartToSearchOptions();
                        _addEmergencyPosterToSearchOptions();
                    };

                    var setMenuListMaxHeight = function () {
                        $(document).ready(function () {
                            var isMobile = $window.matchMedia("only screen and (max-width: 760px)");
                            if (isMobile.matches) {
                                fixElementHeight(120);
                            } else {
                                fixElementHeight(220);
                            }
                        });
                    };

                    function fixElementHeight(moveUpFromBottom) {
                        var bodyHeight = $window.innerHeight;
                        var menuListMaxHeight = Math.floor(bodyHeight - moveUpFromBottom);
                        var searchContentElements = document.getElementsByClassName("search-content");
                        for (var i = 0; i < searchContentElements.length; i++) {
                            var element = searchContentElements[i];
                            element.style.maxHeight = menuListMaxHeight + 'px';
                        }
                    }

                    $(document).ready(function () {
                        $($window).resize(setMenuListMaxHeight);
                        setMenuListMaxHeight();
                    });

                    scope.showSelection = function () {
                        var addLayerUrlTool = toolsFactory.getToolById("AddLayerUrl");
                        if (!searchPanelFactory.getShowEiendomMarkering()) {
                            addLayerUrlTool.additionalOptions.show = false;
                        } else {
                            addLayerUrlTool.additionalOptions.show = true;
                            addLayerUrlTool.additionalOptions.url = mainAppService.generateMatrikkelWfsFilterUrl(scope.searchOptionsDict['seEiendom']);
                            addLayerUrlTool.additionalOptions.geometryName = 'FLATE';
                            addLayerUrlTool.additionalOptions.style = new ol.style.Style({
                                fill: new ol.style.Fill({
                                    color: 'rgba(255,255,102,0.6)'
                                }),
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(255,255,102,1)',
                                    width: 1
                                })
                            });
                        }
                        if (addLayerUrlTool.additionalOptions.show === true) {
                            scope.showSelectedPolygon = true;
                        }

                        toolsFactory.activateTool(addLayerUrlTool);
                        toolsFactory.deactivateTool(addLayerUrlTool);
                    };

                    function showSelectedPolygonEnd() {
                        scope.$apply(function () {
                            scope.showSelectedPolygon = false;
                        }, 0);

                    }

                    eventHandler.RegisterEvent(ISY.Events.EventTypes.AddLayerUrlEnd, showSelectedPolygonEnd);

                    /*Map get feature info start*/

                    scope.layers = [];
                    scope.currentPage = 1;

                    function _handleLoadingLayers(loadingLayers) {
                        scope.layers = [];
                        for (var i = 0; i < loadingLayers.length; i++) {
                            loadingLayers[i].show = false;
                            _addLoadingLayer(loadingLayers[i]);
                        }
                    }

                    function _getLoadingLayer(id) {
                        for (var i = 0; i < scope.layers.length; i++) {
                            var loadingLayer = scope.layers[i];
                            if (loadingLayer.id === id) {
                                return loadingLayer;
                            }
                        }
                        return null;
                    }

                    function _addLoadingLayer(loadingLayer) {
                        scope.layers.push(loadingLayer);
                    }

                    function _loadResult(resultSet) {
                        var loadingLayer = _getLoadingLayer(resultSet.id);
                        if (loadingLayer !== null) {
                            if (resultSet.exception) {
                                loadingLayer.exception = resultSet.exception;
                                loadingLayer.hasException = true;
                            } else {
                                if (resultSet.features !== undefined) {
                                    if (resultSet.features.length > 0) {
                                        loadingLayer.features = resultSet.features;
                                        loadingLayer.hasFeatures = resultSet.showDialog;
                                    }
                                }
                            }

                            if (loadingLayer.hasFeatures) {
                                loadingLayer.show = true;
                            }
                            var isFirstVisibleLayerOpen = false;
                            for (var j = 0; j < scope.layers.length; j++) {
                                if (scope.layers[j].show) {
                                    if (!isFirstVisibleLayerOpen) {
                                        scope.layers[j].open = true;
                                        isFirstVisibleLayerOpen = true;
                                    } else {
                                        scope.layers[j].open = false;
                                    }

                                } else {
                                    scope.layers[j].open = false;
                                }
                            }

                            loadingLayer.isLoading = false;
                        }
                    }

                    eventHandler.RegisterEvent(ISY.Events.EventTypes.FeatureInfoStart, _handleLoadingLayers);
                    eventHandler.RegisterEvent(ISY.Events.EventTypes.FeatureInfoEnd, _loadResult);

                    scope.toggleLayer = function (layer) {
                        if (layer.open) {
                            layer.open = false;
                        } else {
                            for (var i = 0; i < scope.layers.length; i++) {
                                scope.layers[i].open = false;
                            }
                            layer.open = true;
                        }
                        scope.currentPage = 1;
                    };

                    scope.getFeatureName = function (index) {
                        var val = index + 1;
                        return "# " + val;
                    };

                    scope.toggleFeature = function (layer, feature) {
                        if (feature.open) {
                            feature.open = false;
                        } else {
                            for (var i = 0; i < layer.features.length; i++) {
                                layer.features[i].open = false;
                            }
                            feature.open = true;
                        }
                    };

                    scope.isAnyLayerToShow = function () {
                        for (var i = 0; i < scope.layers.length; i++) {
                            if (scope.layers[i].show) {
                                return true;
                            }
                        }
                        return false;
                    };

                    scope.getVisibleFeatures = function (layer) {
                        if (layer !== undefined) {
                            return layer.features.length;
                        } else {
                            return 0;
                        }
                    };

                    scope.getIdByLayer = function (layer) {
                        console.log(layer);
                        return layer.id;
                    };

                    scope.pageChangeHandler = function (value) {
                        scope.currentPage = value;
                    };

                    /*Map get feature info end*/
                }
            };
        }
    ])

    .directive('caret', [
        function () {
            return {
                scope: {
                    value: '=ngModel'
                },
                link: function (scope, element) {
                    function setCaretPosition(elem, caretPos) {
                        if (elem !== null) {
                            if (elem.createTextRange) {
                                var range = elem.createTextRange();
                                range.move('character', caretPos);
                                range.select();
                            } else {
                                if (elem.setSelectionRange) {
                                    elem.focus();
                                    elem.setSelectionRange(caretPos, caretPos);
                                } else {
                                    elem.focus();
                                }
                            }
                        }
                    }
                    scope.$watch('value', function (newValue) {
                        if (newValue && newValue.indexOf('@') > -1 && !scope.searchBarCoordinateSystemIndicator) {
                            scope.searchBarCoordinateSystemIndicator = true;
                            setCaretPosition(element[0], newValue.indexOf('@'));
                        } else if (newValue && newValue.indexOf('@') < 0) {
                            scope.searchBarCoordinateSystemIndicator = false;
                        }

                    });
                }
            };
        }
    ]);