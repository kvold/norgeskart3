angular.module('mainApp')
    .controller('mainAppController', ['$scope','ISY.MapAPI.Map','mainAppFactory','toolsFactory','ISY.EventHandler','isyTranslateFactory','$location','mainMenuPanelFactory', 'localStorageFactory','$translate','$timeout', '$window',
        function($scope, map, mainAppFactory, toolsFactory, eventHandler, isyTranslateFactory, $location, mainMenuPanelFactory, localStorageFactory, $translate, $timeout, $window){

            function _initToolbar() {
                toolsFactory.initToolbar();
            }

            var _setSearch = function (obj) {
                if (!angular.equals(obj, $location.search())) {
                    var newSearch = angular.extend($location.search(), obj);
                    $location.search(newSearch);
                    mainMenuPanelFactory.setProjectById($location.search().project);
                }
            };

            function _viewChanged(obj) {
                localStorageFactory.set("lat", $location.search().lat);
                localStorageFactory.set("lon", $location.search().lon);
                localStorageFactory.set("zoom", $location.search().zoom);
                $timeout(function() {
                    $scope.$apply(function () {
                        _setSearch(obj);
                    }, 0);
                },10);
            }

            function _loadingLayerEnd(obj) {
                localStorageFactory.set("lat", $location.search().lat);
                localStorageFactory.set("lon", $location.search().lon);
                localStorageFactory.set("zoom", $location.search().zoom);
                $timeout(function() {
                    $scope.$apply(function () {
                        _setSearch(obj);
                    },0);
                },5);
            }

            function _registerEvents(){
                eventHandler.RegisterEvent(ISY.Events.EventTypes.MapConfigLoaded, _initToolbar);
                eventHandler.RegisterEvent(ISY.Events.EventTypes.MapMoveend, _viewChanged);
                eventHandler.RegisterEvent(ISY.Events.EventTypes.ChangeLayers, _loadingLayerEnd);
            }

            function _initUrl() {
                var obj = $location.search();
                if (obj.zoom !== undefined && obj.lat !== undefined && obj.lon !== undefined){
                    if (localStorageFactory.get("zoom") !== null && localStorageFactory.get("lat") !== null && localStorageFactory.get("lon") !== null){
                        var center = {
                            "lon": localStorageFactory.get("lon"),
                            "lat": localStorageFactory.get("lat"),
                            "zoom": localStorageFactory.get("zoom")
                        };
                        map.SetCenter(center);
                    }
                }

                if (obj.layers !== undefined){
                    mainAppFactory.setInitLayersInUrl(obj.layers);
                }
                var newSearch = angular.extend($location.search(), obj);
                $location.search(newSearch);
            }

            var _setDeafultProject = function () {
                var obj = $location.search();
                obj.project = "seeiendom";
                var newSearch = angular.extend($location.search(), obj);
                $location.search(newSearch);
                $timeout(function () {
                    window.location.reload();
                }, 0);
            };

            $scope.initMapLayout = function(){
                _initActiveLanguage();
                var obj = $location.search();
                if (obj.type !== undefined){
                    if (obj.type === "1"){
                        $scope.showMapLayout();
                        return;
                    }
                }
                var absUrl = $location.$$absUrl;
                if (absUrl.indexOf("project=") > -1){
                    var projectName = /project=([^&]+)&/.exec(absUrl);
                    if (projectName === null){
                        projectName = /project=([^]+)/.exec(absUrl);
                        if (projectName === null){
                            _setDeafultProject();
                        }
                    }
                    return decodeURIComponent(projectName[1]);
                }else{
                    _setDeafultProject();
                }
                $scope.showMapOverlaysLayout();
            };

            function _initActiveLanguage() {
                var langId = localStorageFactory.get("activeLanguage");
                if (langId !== null){
                    isyTranslateFactory.setCurrentLanguage(langId);
                    map.SetTranslateOptions(isyTranslateFactory.getTranslateOptionsByActiveLanguage());
                    $translate.use(langId);
                }
            }

            function _initMapLayers() {
                var mapLayers = mainAppFactory.getInitLayersInUrl();
                if (mapLayers !== undefined){
                    var layers = mapLayers.split(",");
                    var overlayLayers = map.GetOverlayLayers();
                    var baseLayers = map.GetBaseLayers();
                    for (var i = 0; i < layers.length; i++){
                        for (var j = 0; j < overlayLayers.length; j++){
                            if (parseInt(layers[i], 10) === overlayLayers[j].id){
                                overlayLayers[j].isVisible = true;
                                map.ShowLayer(overlayLayers[j]);
                            }
                        }
                        for (var m = 0; m < baseLayers.length; m++){
                            if (parseInt(layers[i], 10) === baseLayers[m].id){
                                map.SetBaseLayer(baseLayers[m]);
                            }
                        }
                    }
                }
            }

            function _showMapMarker () {
                var parameters=$location.search();
                var marker=parameters['marker_lon'] && parameters['marker_lat'] ? [parameters['marker_lon'], parameters['marker_lat']] : undefined;
                if (marker) {
                    map.ShowInfoMarker(marker);
                }
            }

            $scope.initMainPage = function () {
                _registerEvents();
                map.SetTranslateOptions(isyTranslateFactory.getTranslateOptionsByActiveLanguage());
                map.SetImageInfoMarker("assets/img/pin-md-orange.png");
                mainAppFactory.updateMapConfig();
                var mapConfig = mainAppFactory.getMapConfig();
                map.Init('mapDiv', mapConfig);
                map.AddZoom();
                map.AddScaleLine();
                _initUrl();
                _initMapLayers();
                _showMapMarker();
            };

            $( document ).ready(function() {
                $scope.initMainPage();
                $scope.deactivateDrawFeatureTool();
            });

            $scope.showMapLayout = function () {
                $scope.mapTypeLayout = "mapLayout";
            };

            $scope.showMapOverlaysLayout = function () {
                $scope.mapTypeLayout = "mapOverlaysLayout";
            };

            $scope.mapTypeLayout = "mapOverlaysLayout";

            $scope.isDrawActivated = function () {
                if($scope.drawActivated){
                    return true;
                }
                else {
                    $scope.drawActivated=true;
                    return false;
                }
            };

            $scope.setGeoJSON = function (GeoJSON) {
                $scope.GeoJSON=GeoJSON;
            };

            $scope.drawActivated=false;

            $scope.initDrawFeatureTool = function(){
                var drawFeatureTool = toolsFactory.getToolById("DrawFeature");
                toolsFactory.activateTool(drawFeatureTool);
            };

            $scope.deactivateDrawFeatureTool = function(){
                var drawFeatureTool = toolsFactory.getToolById("DrawFeature");
                toolsFactory.deactivateTool(drawFeatureTool);
                $scope.drawActivated = false;
            };

            $scope.deactivateAddLayerFeatureTool = function(){
                var addLayerFeature = toolsFactory.getToolById("AddLayerFeature");
                toolsFactory.deactivateTool(addLayerFeature);
            };

            $scope.openNav = function() {
                var isMobile = $window.matchMedia("only screen and (max-width: 760px)");
                if (isMobile.matches) {
                    document.getElementById("mySidenav").style.width = "320px";
                    document.getElementById("sideMenuPosition").style.width = "320px";
                }else{
                    document.getElementById("mySidenav").style.width = "395px";
                    document.getElementById("sideMenuPosition").style.width = "395px";
                }
                // document.getElementById("mySidenav").style.width = "395px";
                document.getElementById("mySidenav").style.overflowY = "auto";
                document.getElementById("main").style.backgroundColor = "rgba(0,0,0,0.4)";
                document.getElementById("main").style.transition = "0.4s";

                // document.getElementById("sideMenuPosition").style.width = "395px";
                mainAppFactory.setMainMenuStatus(true);
                localStorageFactory.set("mainMenuIsOpen", true);
            };

            $scope.closeNav = function() {
                if(document.getElementById("mySidenav") && document.getElementById("main")) {
                    document.getElementById("mySidenav").style.width = "0";
                    $timeout(function () {
                        document.getElementById("sideMenuPosition").style.width = "0";
                    }, 400);

                    document.getElementById("mySidenav").style.overflowY = "hidden";
                    document.getElementById("main").style.backgroundColor = "transparent";
                    document.getElementById("main").style.transition = "0.4s";

                    localStorageFactory.set("mainMenuIsOpen", false);
                    mainAppFactory.setMainMenuStatus(false);
                }
            };

            // $scope.openBaseMapNav = function () {
            //     var lengthDeselectBaseMaps = changeBaseMapPanelFactory.lengthDeselectBaseMaps();
            //     if (lengthDeselectBaseMaps === 3){
            //         document.getElementById('mySideBaseMapNav').style.minWidth="214px";
            //         document.getElementById("sideBasMapPosition").style.minWidth = "214px";
            //     }else{
            //         document.getElementById('mySideBaseMapNav').style.minWidth="146px";
            //         document.getElementById("sideBasMapPosition").style.minWidth = "146px";
            //     }
            //
            //
            //
            // };
            //
            // $scope.closeBaseMapNav = function () {
            //     document.getElementById('mySideBaseMapNav').style.minWidth="0";
            //     $timeout(function () {
            //         document.getElementById("sideBasMapPosition").style.minWidth = "0";
            //     }, 400);
            //
            // };

        }
    ]);