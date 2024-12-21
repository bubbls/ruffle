"use strict";
var Engine;
(function (Engine) {
    var EventType;
    (function (EventType) {
        EventType[EventType["CUSTOM"] = 0] = "CUSTOM";
        EventType[EventType["INIT_SCENE"] = 1] = "INIT_SCENE";
        EventType[EventType["RESET_SCENE"] = 2] = "RESET_SCENE";
        EventType[EventType["VIEW_UPDATE"] = 3] = "VIEW_UPDATE";
        EventType[EventType["STEP_UPDATE"] = 4] = "STEP_UPDATE";
        EventType[EventType["TIME_UPDATE"] = 5] = "TIME_UPDATE";
        EventType[EventType["CLEAR_SCENE"] = 6] = "CLEAR_SCENE";
        EventType[EventType["DESTROY"] = 7] = "DESTROY";
        EventType[EventType["SURVIVE"] = 8] = "SURVIVE";
    })(EventType = Engine.EventType || (Engine.EventType = {}));
    var EventListenerGroup = /** @class */ (function () {
        function EventListenerGroup(name) {
            this.name = "";
            this.receptors = new Array();
            this.name = name;
        }
        return EventListenerGroup;
    }());
    var EventReceptor = /** @class */ (function () {
        function EventReceptor(chainable, action) {
            this.chainable = chainable;
            this.action = action;
        }
        return EventReceptor;
    }());
    var System = /** @class */ (function () {
        function System() {
        }
        System.triggerEvents = function (type) {
            for (var _i = 0, _a = System.listenerGroups[type]; _i < _a.length; _i++) {
                var listener = _a[_i];
                for (var _b = 0, _c = listener.receptors; _b < _c.length; _b++) {
                    var receptor = _c[_b];
                    receptor.action.call(receptor.chainable);
                }
            }
        };
        System.triggerCustomEvent = function (name) {
            for (var _i = 0, _a = System.listenerGroups[EventType.CUSTOM]; _i < _a.length; _i++) {
                var listener = _a[_i];
                if (listener.name == name) {
                    for (var _b = 0, _c = listener.receptors; _b < _c.length; _b++) {
                        var receptor = _c[_b];
                        receptor.action.call(receptor.chainable);
                    }
                    return;
                }
            }
            console.log("error");
        };
        System.getDestroyReceptors = function () {
            var callReceptors = [];
            for (var _i = 0, _a = System.listenerGroups[EventType.DESTROY]; _i < _a.length; _i++) {
                var listener = _a[_i];
                for (var _b = 0, _c = listener.receptors; _b < _c.length; _b++) {
                    var receptor = _c[_b];
                    var owner = receptor.chainable;
                    while (owner.owner != null) {
                        owner = owner.owner;
                    }
                    if (owner.preserved == null || !owner.preserved) {
                        callReceptors.push(receptor);
                    }
                }
            }
            return callReceptors;
        };
        System.onViewChanged = function () {
            System.triggerEvents(EventType.VIEW_UPDATE);
        };
        System.onStepUpdate = function () {
            if (System.nextSceneClass != null) {
                System.needReset = true;
                if (System.currentScene != null) {
                    System.triggerEvents(EventType.CLEAR_SCENE);
                    var destroyReceptors = System.getDestroyReceptors();
                    for (var _i = 0, _a = System.listenerGroups; _i < _a.length; _i++) {
                        var listenerGroup = _a[_i];
                        for (var _b = 0, listenerGroup_1 = listenerGroup; _b < listenerGroup_1.length; _b++) {
                            var listener = listenerGroup_1[_b];
                            var newReceptors = [];
                            for (var _c = 0, _d = listener.receptors; _c < _d.length; _c++) {
                                var receptor = _d[_c];
                                var owner = receptor.chainable;
                                while (owner.owner != null) {
                                    owner = owner.owner;
                                }
                                if (owner.preserved != null && owner.preserved) {
                                    newReceptors.push(receptor);
                                }
                            }
                            listener.receptors = newReceptors;
                        }
                    }
                    for (var _e = 0, destroyReceptors_1 = destroyReceptors; _e < destroyReceptors_1.length; _e++) {
                        var receptor = destroyReceptors_1[_e];
                        receptor.action.call(receptor.chainable);
                    }
                    //@ts-ignore
                    Engine.Texture.recycleAll();
                    //@ts-ignore
                    Engine.AudioPlayer.recycleAll();
                    System.triggerEvents(EventType.SURVIVE);
                }
                System.currentSceneClass = System.nextSceneClass;
                System.nextSceneClass = null;
                //@ts-ignore
                System.canCreateScene = true;
                //@ts-ignore
                System.currentScene = new System.currentSceneClass();
                System.addListenersFrom(System.currentScene);
                //@ts-ignore
                System.canCreateScene = false;
                System.creatingScene = false;
                System.triggerEvents(EventType.INIT_SCENE);
            }
            if (System.needReset) {
                System.needReset = false;
                System.triggerEvents(EventType.RESET_SCENE);
            }
            System.triggerEvents(EventType.STEP_UPDATE);
        };
        System.onTimeUpdate = function () {
            //@ts-ignore
            Engine.AudioManager.checkSuspended();
            System.triggerEvents(EventType.TIME_UPDATE);
        };
        System.requireReset = function () {
            System.needReset = true;
        };
        System.update = function () {
            //if(System.hasFocus && !document.hasFocus()){
            //    System.hasFocus = false;
            //    Engine.pause();
            //}
            //else if(!System.hasFocus && document.hasFocus()){
            //    System.hasFocus = true;
            //    Engine.resume();
            //}
            if (System.pauseCount == 0) {
                //@ts-ignore
                Engine.Renderer.clear();
                while (System.stepTimeCount >= System.STEP_DELTA_TIME) {
                    //@ts-ignore
                    System.stepExtrapolation = 1;
                    if (System.inputInStepUpdate) {
                        //(NewKit as any).updateTouchscreen();
                        //@ts-ignore
                        Engine.Keyboard.update();
                        //@ts-ignore
                        Engine.Mouse.update();
                    }
                    System.onStepUpdate();
                    //@ts-ignore
                    Engine.Renderer.updateHandCursor();
                    System.stepTimeCount -= System.STEP_DELTA_TIME;
                }
                //@ts-ignore
                System.stepExtrapolation = System.stepTimeCount / System.STEP_DELTA_TIME;
                if (Engine.Renderer.xSizeWindow != window.innerWidth || Engine.Renderer.ySizeWindow != window.innerHeight) {
                    //@ts-ignore
                    Engine.Renderer.fixCanvasSize();
                    System.triggerEvents(EventType.VIEW_UPDATE);
                }
                if (!System.inputInStepUpdate) {
                    //(NewKit as any).updateTouchscreen();
                    //@ts-ignore
                    Engine.Keyboard.update();
                    //@ts-ignore
                    Engine.Mouse.update();
                }
                System.onTimeUpdate();
                //@ts-ignore
                Engine.Renderer.update();
                //@ts-ignore
                var nowTime = Date.now() / 1000.0;
                //@ts-ignore
                System.deltaTime = nowTime - System.oldTime;
                if (System.deltaTime > System.MAX_DELTA_TIME) {
                    //@ts-ignore
                    System.deltaTime = System.MAX_DELTA_TIME;
                }
                else if (System.deltaTime < 0) {
                    //@ts-ignore
                    System.deltaTime = 0;
                }
                System.stepTimeCount += System.deltaTime;
                System.oldTime = nowTime;
            }
            window.requestAnimationFrame(System.update);
        };
        System.pause = function () {
            //@ts-ignore
            System.pauseCount += 1;
            if (System.pauseCount == 1) {
                //@ts-ignore
                Engine.AudioManager.pause();
            }
        };
        ;
        System.resume = function () {
            if (System.pauseCount > 0) {
                //@ts-ignore
                System.pauseCount -= 1;
                if (System.pauseCount == 0) {
                    //@ts-ignore
                    Engine.AudioManager.resume();
                    System.oldTime = Date.now() - System.STEP_DELTA_TIME;
                }
            }
            else {
                console.log("error");
            }
        };
        ;
        System.start = function () {
            if (Engine.Renderer.inited && Engine.AudioManager.inited) {
                System.canCreateEvents = true;
                System.onInit();
                System.canCreateEvents = false;
                //@ts-ignore
                System.started = true;
                window.requestAnimationFrame(System.update);
            }
            else {
                setTimeout(System.start, 1.0 / 60.0);
            }
        };
        System.run = function () {
            if (System.inited) {
                console.log("ERROR");
            }
            else {
                System.inited = true;
                //@ts-ignore
                Engine.Renderer.init();
                //@ts-ignore
                Engine.AudioManager.init();
                setTimeout(System.start, 1.0 / 60.0);
            }
        };
        System.STEP_DELTA_TIME = 1.0 / 60.0;
        System.MAX_DELTA_TIME = System.STEP_DELTA_TIME * 4;
        System.PI_OVER_180 = Math.PI / 180;
        System.inited = false;
        System.started = false;
        System.stepTimeCount = 0;
        System.stepExtrapolation = 0;
        System.oldTime = 0;
        System.deltaTime = 0;
        System.pauseCount = 0;
        System.listenerGroups = [[], [], [], [], [], [], [], [], []];
        System.canCreateEvents = false;
        System.canCreateScene = false;
        System.creatingScene = false;
        System.needReset = false;
        /*
        Engine.useHandPointer = false;
        Engine.onclick = null;
        */
        System.inputInStepUpdate = true;
        System.createEvent = function (type, name) {
            if (System.canCreateEvents) {
                System.listenerGroups[type].push(new EventListenerGroup(name));
            }
            else {
                console.log("error");
            }
        };
        System.addListenersFrom = function (chainable) {
            if (!System.creatingScene) {
                console.log("error");
            }
            for (var _i = 0, _a = System.listenerGroups; _i < _a.length; _i++) {
                var listenerGroup = _a[_i];
                for (var _b = 0, listenerGroup_2 = listenerGroup; _b < listenerGroup_2.length; _b++) {
                    var listener = listenerGroup_2[_b];
                    for (var prop in chainable) {
                        if (prop == listener.name) {
                            listener.receptors.push(new EventReceptor(chainable, chainable[prop]));
                        }
                    }
                }
            }
        };
        return System;
    }());
    Engine.System = System;
    if (!window.requestAnimationFrame) {
        //@ts-ignore
        window.requestAnimationFrame = function () {
            window.requestAnimationFrame =
                window['requestAnimationFrame'] ||
                    //@ts-ignore
                    window['mozRequestAnimationFrame'] ||
                    window['webkitRequestAnimationFrame'] ||
                    //@ts-ignore
                    window['msRequestAnimationFrame'] ||
                    //@ts-ignore
                    window['oRequestAnimationFrame'] ||
                    //@ts-ignore
                    function (callback, element) {
                        element = element;
                        window.setTimeout(callback, 1000 / 60);
                    };
        };
    }
    window.onclick = function () {
        //@ts-ignore
        Engine.AudioManager.verify();
        //@ts-ignore
        Engine.LinkManager.trigger();
    };
})(Engine || (Engine = {}));
///<reference path="Engine/System.ts"/>
var Game;
(function (Game) {
    Game.URL_MORE_GAMES = "http://noadev.com/games";
    Game.levelStates = new Array();
    Game.X_BUTTONS = 12;
    Game.Y_BUTTONS = 5;
    Engine.System.onInit = function () {
        Engine.System.createEvent(Engine.EventType.RESET_SCENE, "onReset");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateAnchor");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateText");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMoveUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onOverlapUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onAnimationUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdateFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onTimeUpdate");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawScene");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawDialogs");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawButtons");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawText");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesBack");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSwitchs");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjects");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPlayer");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawGoal");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesFront");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawTextFront");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawFade");
        Engine.System.createEvent(Engine.EventType.CLEAR_SCENE, "onClearScene");
        //-console.log("kongregate api");
        //-console.log("screenshoots");
        //-console.log("blog update");
        //-console.log("kongregate setup and tests");
        //console.log("change thumbnail");
        //-console.log("lower volume ice sound");
        //-console.log("edge, chrome, opera, ie, firefox test");
        //-console.log("edge, chrome, opera, ie, firefox test");
        //-console.log("safari test");
        //console.log("ie test");
        //console.log("ie music");
        Game.startingSceneClass = Game.MainMenu;
        for (var i = 0; i < 50; i += 1) {
            Game.levelStates[i] = Engine.Data.load("Level " + i);
        }
        if (Game.levelStates[0] == "") {
            Game.levelStates[0] = "unlocked";
        }
        Game.triggerActions("loadgame");
    };
})(Game || (Game = {}));
var Game;
(function (Game) {
    Game.HAS_LINKS = true;
    Game.IS_EDGE = /Edge/.test(navigator.userAgent);
    var pathGroups = new Array();
    var actionGroups = new Array();
    function addElement(groups, type, element) {
        for (var _i = 0, groups_1 = groups; _i < groups_1.length; _i++) {
            var group = groups_1[_i];
            if (group.type == type) {
                group.elements.push(element);
                return;
            }
        }
        var group = {};
        group.type = type;
        group.elements = [element];
        groups.push(group);
    }
    function addPath(type, path) {
        addElement(pathGroups, type, path);
    }
    Game.addPath = addPath;
    function addAction(type, action) {
        addElement(actionGroups, type, action);
    }
    Game.addAction = addAction;
    function forEachPath(type, action) {
        for (var _i = 0, pathGroups_1 = pathGroups; _i < pathGroups_1.length; _i++) {
            var group = pathGroups_1[_i];
            if (group.type == type) {
                for (var _a = 0, _b = group.elements; _a < _b.length; _a++) {
                    var path = _b[_a];
                    action(path);
                }
                return;
            }
        }
    }
    Game.forEachPath = forEachPath;
    function triggerActions(type) {
        for (var _i = 0, actionGroups_1 = actionGroups; _i < actionGroups_1.length; _i++) {
            var group = actionGroups_1[_i];
            if (group.type == type) {
                for (var _a = 0, _b = group.elements; _a < _b.length; _a++) {
                    var action = _b[_a];
                    action();
                }
                return;
            }
        }
    }
    Game.triggerActions = triggerActions;
})(Game || (Game = {}));
var Engine;
(function (Engine) {
    var Asset = /** @class */ (function () {
        function Asset(path) {
            this.headerReceived = false;
            this.size = 0;
            this.downloadedSize = 0;
            this.path = path;
        }
        return Asset;
    }());
    var ImageAssetData = /** @class */ (function () {
        function ImageAssetData(xSize, ySize, imageData, bytes) {
            this.xSize = xSize;
            this.ySize = ySize;
            this.imageData = imageData;
            this.bytes = bytes;
        }
        return ImageAssetData;
    }());
    Engine.ImageAssetData = ImageAssetData;
    var Assets = /** @class */ (function () {
        function Assets() {
        }
        Assets.downloadNextAssetHeader = function () {
            Assets.currentAsset = Assets.assets[Assets.assetHeaderDownloadIndex];
            var xhr = new XMLHttpRequest();
            xhr.onloadstart = function () {
                this.responseType = "arraybuffer";
            };
            //xhr.responseType = "arraybuffer";
            xhr.open("GET", Assets.currentAsset.path, true);
            xhr.onreadystatechange = function () {
                if (this.readyState == this.HEADERS_RECEIVED) {
                    Assets.currentAsset.headerReceived = true;
                    if (this.getResponseHeader("Content-Length") != null) {
                        Assets.currentAsset.size = +this.getResponseHeader("Content-Length");
                    }
                    else {
                        Assets.currentAsset.size = 1;
                    }
                    this.abort();
                    Assets.assetHeaderDownloadIndex += 1;
                    if (Assets.assetHeaderDownloadIndex == Assets.assets.length) {
                        Assets.downloadNextAssetBlob();
                    }
                    else {
                        Assets.downloadNextAssetHeader();
                    }
                }
            };
            xhr.onerror = function () {
                //console.log("ERROR");
                Assets.downloadNextAssetHeader();
            };
            xhr.send();
        };
        Assets.downloadNextAssetBlob = function () {
            Assets.currentAsset = Assets.assets[Assets.assetBlobDownloadIndex];
            var xhr = new XMLHttpRequest();
            xhr.onloadstart = function () {
                if (Assets.currentAsset.path.indexOf(".json") > 0 || Assets.currentAsset.path.indexOf(".txt") > 0 || Assets.currentAsset.path.indexOf(".glsl") > 0) {
                    xhr.responseType = "text";
                }
                else {
                    xhr.responseType = "arraybuffer";
                }
            };
            /*
            if(Assets.currentAsset.path.indexOf(".json") > 0 || Assets.currentAsset.path.indexOf(".txt") > 0 || Assets.currentAsset.path.indexOf(".glsl") > 0){
                xhr.responseType = "text";
            }
            else{
                xhr.responseType = "arraybuffer";
            }
            */
            xhr.open("GET", Assets.currentAsset.path, true);
            xhr.onprogress = function (e) {
                Assets.currentAsset.downloadedSize = e.loaded;
                if (Assets.currentAsset.downloadedSize > Assets.currentAsset.size) {
                    Assets.currentAsset.downloadedSize = Assets.currentAsset.size;
                }
            };
            xhr.onreadystatechange = function () {
                if (this.readyState == XMLHttpRequest.DONE) {
                    if (this.status == 200 || this.status == 304 || this.status == 206 || (this.status == 0 && this.response)) {
                        Assets.currentAsset.downloadedSize = Assets.currentAsset.size;
                        if (Assets.currentAsset.path.indexOf(".png") > 0 || Assets.currentAsset.path.indexOf(".jpg") > 0 || Assets.currentAsset.path.indexOf(".jpeg") > 0 || Assets.currentAsset.path.indexOf(".jpe") > 0) {
                            Assets.currentAsset.blob = new Blob([new Uint8Array(this.response)]);
                            Assets.prepareImageAsset();
                        }
                        else if (Assets.currentAsset.path.indexOf(".m4a") > 0 || Assets.currentAsset.path.indexOf(".ogg") > 0 || Assets.currentAsset.path.indexOf(".wav") > 0) {
                            Assets.currentAsset.buffer = this.response;
                            Assets.prepareSoundAsset();
                        }
                        else if (Assets.currentAsset.path.indexOf(".json") > 0 || Assets.currentAsset.path.indexOf(".txt") > 0 || Assets.currentAsset.path.indexOf(".glsl") > 0) {
                            Assets.currentAsset.text = xhr.responseText;
                            Assets.stepAssetDownloadQueue();
                        }
                        else {
                            Assets.currentAsset.blob = this.response;
                            Assets.stepAssetDownloadQueue();
                        }
                    }
                    else {
                        //console.log("ERROR");
                        Assets.downloadNextAssetBlob();
                    }
                }
            };
            xhr.onerror = function () {
                //console.log("ERROR");
                Assets.downloadNextAssetBlob();
            };
            xhr.send();
        };
        Assets.stepAssetDownloadQueue = function () {
            Assets.assetBlobDownloadIndex += 1;
            if (Assets.assetBlobDownloadIndex == Assets.assets.length) {
                Assets.downloadingAssets = false;
            }
            else {
                Assets.downloadNextAssetBlob();
            }
        };
        Assets.prepareImageAsset = function () {
            Assets.currentAsset.image = document.createElement("img");
            Assets.currentAsset.image.onload = function () {
                Assets.currentAsset.blob = null;
                Assets.stepAssetDownloadQueue();
            };
            Assets.currentAsset.image.onerror = function () {
                //console.log("ERROR");
                Assets.prepareImageAsset();
            };
            Assets.currentAsset.image.src = URL.createObjectURL(Assets.currentAsset.blob);
        };
        Assets.prepareSoundAsset = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                Assets.stepAssetDownloadQueue();
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                //@ts-ignore
                Engine.AudioManager.context.decodeAudioData(Assets.currentAsset.buffer, function (buffer) {
                    Assets.currentAsset.audio = buffer;
                    Assets.currentAsset.buffer = null;
                    Assets.stepAssetDownloadQueue();
                }, function () {
                    //console.log("ERROR");
                    Assets.prepareSoundAsset();
                });
            }
            else {
                Assets.stepAssetDownloadQueue();
            }
        };
        Assets.queue = function (path) {
            if (Assets.downloadingAssets) {
                console.log("ERROR");
            }
            else {
                if (path.indexOf(".ogg") > 0 || path.indexOf(".m4a") > 0 || path.indexOf(".wav") > 0) {
                    console.log("ERROR");
                }
                else if (path.indexOf(".omw") > 0 || path.indexOf(".owm") > 0 || path.indexOf(".mow") > 0 || path.indexOf(".mwo") > 0 || path.indexOf(".wom") > 0 || path.indexOf(".wmo") > 0) {
                    path = Assets.findAudioExtension(path);
                    if (path == "") {
                        console.log("ERROR");
                        return;
                    }
                }
                Assets.assets.push(new Asset(path));
            }
        };
        Assets.download = function () {
            if (Assets.downloadingAssets) {
                console.log("ERROR");
            }
            else if (Assets.assetHeaderDownloadIndex >= Assets.assets.length) {
                console.log("ERROR");
            }
            else {
                Assets.assetQueueStart = Assets.assetHeaderDownloadIndex;
                Assets.downloadingAssets = true;
                Assets.downloadNextAssetHeader();
            }
        };
        Object.defineProperty(Assets, "downloadSize", {
            get: function () {
                var retSize = 0;
                for (var assetIndex = Assets.assetQueueStart; assetIndex < Assets.assets.length; assetIndex += 1) {
                    if (!Assets.assets[assetIndex].headerReceived) {
                        return 0;
                    }
                    retSize += Assets.assets[assetIndex].size;
                }
                return retSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Assets, "downloadedSize", {
            get: function () {
                var retSize = 0;
                for (var assetIndex = Assets.assetQueueStart; assetIndex < Assets.assets.length; assetIndex += 1) {
                    retSize += Assets.assets[assetIndex].downloadedSize;
                }
                return retSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Assets, "downloadedRatio", {
            get: function () {
                var size = Assets.downloadSize;
                if (size == 0) {
                    return 0;
                }
                return Assets.downloadedSize / size;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Assets, "downloadComplete", {
            get: function () {
                var size = Assets.downloadSize;
                if (size == 0) {
                    return false;
                }
                return Assets.downloadedSize == size && !Assets.downloadingAssets;
            },
            enumerable: true,
            configurable: true
        });
        Assets.findAsset = function (path) {
            for (var assetIndex = 0; assetIndex < Assets.assets.length; assetIndex += 1) {
                if (Assets.assets[assetIndex].path == path) {
                    return Assets.assets[assetIndex];
                }
            }
            console.log("error");
            return null;
        };
        Assets.loadImage = function (path) {
            var asset = Assets.findAsset(path);
            if (asset == null || asset.image == null) {
                console.log("ERROR");
                return null;
            }
            else {
                var canvas = document.createElement("canvas");
                canvas.width = asset.image.width;
                canvas.height = asset.image.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(asset.image, 0, 0);
                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                return new ImageAssetData(canvas.width, canvas.height, imageData, imageData.data);
            }
        };
        Assets.loadText = function (path) {
            var asset = Assets.findAsset(path);
            if (asset == null || asset.text == null) {
                console.log("ERROR");
                return null;
            }
            else {
                return asset.text;
            }
        };
        ;
        Assets.loadAudio = function (path) {
            var asset = Assets.findAsset(Assets.findAudioExtension(path));
            if (asset == null || asset.audio == null) {
                console.log("ERROR");
                return null;
            }
            else {
                return asset.audio;
            }
        };
        Assets.assets = new Array();
        Assets.assetQueueStart = 0;
        Assets.assetHeaderDownloadIndex = 0;
        Assets.assetBlobDownloadIndex = 0;
        Assets.downloadingAssets = false;
        Assets.findAudioExtension = function (path) {
            var extFind = "";
            var extReplace = "";
            if (path.indexOf(".omw") > 0) {
                extFind = ".omw";
                if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".owm") > 0) {
                extFind = ".owm";
                if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".mow") > 0) {
                extFind = ".mow";
                if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".mwo") > 0) {
                extFind = ".mwo";
                if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".wom") > 0) {
                extFind = ".wom";
                if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".wmo") > 0) {
                extFind = ".wmo";
                if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else {
                    return "";
                }
            }
            else {
                return "";
            }
            return path.substr(0, path.indexOf(extFind)) + extReplace;
        };
        return Assets;
    }());
    Engine.Assets = Assets;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var AudioPlayer = /** @class */ (function () {
        function AudioPlayer(path) {
            this.loopStart = 0;
            this.loopEnd = 0;
            this._volume = 1;
            this._muted = false;
            if (!Engine.System.canCreateScene) {
                console.log("error");
            }
            //@ts-ignore
            Engine.AudioManager.players.push(this);
            this.path = path;
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                this.buffer = Engine.Assets.loadAudio(path);
                //@ts-ignore
                this.volumeGain = Engine.AudioManager.context.createGain();
                //@ts-ignore
                this.volumeGain.connect(Engine.AudioManager.context.destination);
                //@ts-ignore
                this.muteGain = Engine.AudioManager.context.createGain();
                this.muteGain.connect(this.volumeGain);
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                this.path = path;
                this.lockTime = -1;
                //@ts-ignore
                this.htmlAudio = new Audio(Engine.Assets.findAudioExtension(path));
                var that = this;
                this.htmlAudio.addEventListener('timeupdate', function () {
                    if (Engine.System.pauseCount > 0 && that.lockTime >= 0) {
                        this.currentTime = that.lockTime;
                    }
                    else {
                        if (that.loopEnd > 0 && this.currentTime > that.loopEnd) {
                            this.currentTime = that.loopStart;
                            this.play();
                        }
                    }
                }, false);
            }
            this.muted = false;
        }
        Object.defineProperty(AudioPlayer.prototype, "volume", {
            get: function () {
                return this._volume;
            },
            set: function (value) {
                if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                    this._volume = value;
                    this.volumeGain.gain.value = value;
                }
                else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                    this._volume = value;
                    this.htmlAudio.volume = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AudioPlayer.prototype, "muted", {
            get: function () {
                return this._muted;
            },
            set: function (value) {
                if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                    this._muted = value;
                    //@ts-ignore
                    this.muteGain.gain.value = (this._muted || Engine.AudioManager._muted || Engine.System.pauseCount > 0) ? 0 : 1;
                }
                else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                    this._muted = value;
                    //@ts-ignore
                    this.htmlAudio.muted = this._muted || Engine.AudioManager._muted || Engine.System.pauseCount > 0;
                }
            },
            enumerable: true,
            configurable: true
        });
        //@ts-ignore
        AudioPlayer.recycleAll = function () {
            var newPlayers = new Array();
            //@ts-ignore
            for (var _i = 0, _a = Engine.AudioManager.players; _i < _a.length; _i++) {
                var player = _a[_i];
                var owner = player;
                while (owner.owner != null) {
                    owner = owner.owner;
                }
                if (owner.preserved) {
                    newPlayers.push(player);
                }
                else {
                    player.destroy();
                }
            }
            //@ts-ignore
            Engine.AudioManager.players = newPlayers;
        };
        //@ts-ignore
        AudioPlayer.prototype.verify = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                if (this.autoplay) {
                    this.autoplay = undefined;
                    this.play();
                    if (Engine.System.pauseCount > 0) {
                        this.lockTime = this.htmlAudio.currentTime;
                        this.muted = this._muted;
                    }
                }
            }
        };
        //@ts-ignore
        AudioPlayer.prototype.pause = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                if (this.played) {
                    this.lockTime = this.htmlAudio.currentTime;
                    this.muted = this._muted;
                }
            }
        };
        //@ts-ignore
        AudioPlayer.prototype.resume = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                if (this.played) {
                    this.htmlAudio.currentTime = this.lockTime;
                    this.lockTime = -1;
                    this.muted = this._muted;
                }
            }
        };
        AudioPlayer.prototype.destroy = function () {
            this.muted = true;
            this.stop();
        };
        AudioPlayer.prototype.play = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                if (Engine.AudioManager.verified) {
                    this.autoplay();
                }
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                if (Engine.AudioManager.verified) {
                    //@ts-ignore
                    this.played = true;
                    this.htmlAudio.currentTime = 0;
                    this.htmlAudio.play();
                }
            }
        };
        AudioPlayer.prototype.autoplay = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                if (this.played) {
                    this.source.stop();
                }
                //@ts-ignore
                this.played = true;
                //@ts-ignore
                this.source = Engine.AudioManager.context.createBufferSource();
                this.source.buffer = this.buffer;
                this.source.loop = this.loopEnd > 0;
                if (this.source.loop) {
                    this.source.loopStart = this.loopStart;
                    this.source.loopEnd = this.loopEnd;
                }
                this.source.connect(this.muteGain);
                //@ts-ignore
                this.source[this.source.start ? 'start' : 'noteOn'](0);
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                if (Engine.AudioManager.verified) {
                    this.play();
                }
                else {
                    //@ts-ignore
                    this.autoplayed = true;
                }
            }
        };
        AudioPlayer.prototype.stop = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                if (this.played) {
                    this.source.stop();
                }
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                if (Engine.AudioManager.verified && this.played) {
                    this.htmlAudio.currentTime = 0;
                    this.htmlAudio.pause();
                }
                else if (this.autoplay) {
                    //@ts-ignore
                    this.autoplayed = false;
                }
            }
        };
        return AudioPlayer;
    }());
    Engine.AudioPlayer = AudioPlayer;
})(Engine || (Engine = {}));
///<reference path="AudioPlayer.ts"/>
var Engine;
(function (Engine) {
    var AudioManagerMode;
    (function (AudioManagerMode) {
        AudioManagerMode[AudioManagerMode["NONE"] = 0] = "NONE";
        AudioManagerMode[AudioManagerMode["HTML"] = 1] = "HTML";
        AudioManagerMode[AudioManagerMode["WEB"] = 2] = "WEB";
    })(AudioManagerMode = Engine.AudioManagerMode || (Engine.AudioManagerMode = {}));
    var AudioManager = /** @class */ (function () {
        function AudioManager() {
        }
        Object.defineProperty(AudioManager, "muted", {
            get: function () {
                return AudioManager._muted;
            },
            set: function (value) {
                AudioManager._muted = value;
                for (var _i = 0, _a = AudioManager.players; _i < _a.length; _i++) {
                    var player = _a[_i];
                    //@ts-ignore
                    player.muted = player._muted;
                }
            },
            enumerable: true,
            configurable: true
        });
        //@ts-ignore
        AudioManager.init = function () {
            //@ts-ignore
            AudioManager.supported = typeof window.Audio !== undefined;
            //@ts-ignore
            AudioManager.webSupported = typeof window.AudioContext !== undefined || window.webkitAudioContext !== undefined;
            if (AudioManager.supported) {
                var audio = new Audio();
                //@ts-ignore
                AudioManager.wavSupported = audio.canPlayType("audio/wav; codecs=2").length > 0 || audio.canPlayType("audio/wav; codecs=1").length > 0 || audio.canPlayType("audio/wav; codecs=0").length > 0 || audio.canPlayType("audio/wav").length > 0;
                //@ts-ignore
                AudioManager.oggSupported = audio.canPlayType("audio/ogg; codecs=vorbis").length > 0 || audio.canPlayType("audio/ogg").length > 0;
                //@ts-ignore
                AudioManager.aacSupported = /*audio.canPlayType("audio/m4a").length > 0 ||*/ audio.canPlayType("audio/aac").length > 0 /*|| audio.canPlayType("audio/mp4").length > 0*/;
            }
            //@ts-ignore
            AudioManager.supported = AudioManager.wavSupported || AudioManager.oggSupported || AudioManager.aacSupported;
            if (!AudioManager.supported || AudioManager.preferredMode == AudioManagerMode.NONE) {
                if (AudioManager.preferredMode == AudioManagerMode.NONE) {
                    console.warn("Set \"AudioManager.preferredMode = AudioManagerMode.NONE\" only for testing proposes.");
                }
                //@ts-ignore
                AudioManager.mode = AudioManagerMode.NONE;
            }
            else if (AudioManager.webSupported && AudioManager.preferredMode == AudioManagerMode.WEB) {
                //@ts-ignore
                AudioManager.mode = AudioManagerMode.WEB;
                //@ts-ignore
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                //@ts-ignore
                AudioManager.context = new window.AudioContext();
                AudioManager.context.suspend();
                //@ts-ignore
                AudioManager.context.createGain = AudioManager.context.createGain || AudioManager.context.createGainNode;
            }
            else {
                if (AudioManager.preferredMode == AudioManagerMode.HTML) {
                    console.warn("Set \"AudioManager.preferredMode = AudioManagerMode.HTML\" only for testing proposes.");
                }
                //@ts-ignore
                AudioManager.mode = AudioManagerMode.HTML;
            }
            //@ts-ignore
            AudioManager.inited = true;
        };
        //@ts-ignore
        AudioManager.verify = function () {
            if (Engine.System.pauseCount == 0 && AudioManager.inited && !AudioManager.verified) {
                if (AudioManager.mode == AudioManagerMode.WEB) {
                    AudioManager.context.resume();
                    if (Engine.System.pauseCount > 0) {
                        AudioManager.context.suspend();
                    }
                }
                for (var _i = 0, _a = AudioManager.players; _i < _a.length; _i++) {
                    var player = _a[_i];
                    //@ts-ignore
                    player.verify();
                }
                //@ts-ignore
                AudioManager.verified = true;
            }
        };
        //@ts-ignore
        AudioManager.pause = function () {
            if (AudioManager.mode == AudioManagerMode.WEB) {
                if (AudioManager.verified) {
                    AudioManager.context.suspend();
                }
            }
            for (var _i = 0, _a = AudioManager.players; _i < _a.length; _i++) {
                var player = _a[_i];
                //@ts-ignore
                player.pause();
            }
        };
        //@ts-ignore
        AudioManager.resume = function () {
            if (AudioManager.mode == AudioManagerMode.WEB) {
                if (AudioManager.verified) {
                    AudioManager.context.resume();
                }
            }
            for (var _i = 0, _a = AudioManager.players; _i < _a.length; _i++) {
                var player = _a[_i];
                //@ts-ignore
                player.resume();
            }
        };
        //@ts-ignore
        AudioManager.checkSuspended = function () {
            if (Engine.System.pauseCount == 0 && AudioManager.inited && AudioManager.mode == AudioManagerMode.WEB && AudioManager.context.state == "suspended") {
                AudioManager.context.resume();
            }
        };
        AudioManager.preferredMode = AudioManagerMode.WEB;
        AudioManager.wavSupported = false;
        AudioManager.oggSupported = false;
        AudioManager.aacSupported = false;
        AudioManager.verified = false;
        AudioManager.supported = false;
        AudioManager.webSupported = false;
        AudioManager.players = new Array();
        AudioManager._muted = false;
        return AudioManager;
    }());
    Engine.AudioManager = AudioManager;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var CanvasTexture = /** @class */ (function () {
        function CanvasTexture(sprite) {
            this.canvas = document.createElement("canvas");
            this.context = this.canvas.getContext("2d");
            //@ts-ignore
            this.context.drawImage(sprite.texture.canvas, sprite.xTexture, sprite.yTexture, sprite.xSizeTexture, sprite.ySizeTexture, 0, 0, sprite.xSizeTexture, sprite.ySizeTexture);
            //@ts-ignore
            var imageData = this.context.getImageData(0, 0, sprite.xSizeTexture, sprite.ySizeTexture);
            var data = imageData.data;
            //@ts-ignore
            for (var indexPixel = 0; indexPixel < sprite.xSizeTexture * sprite.ySizeTexture * 4; indexPixel += 4) {
                //@ts-ignore
                data[indexPixel + 0] = data[indexPixel + 0] * sprite.red;
                //@ts-ignore
                data[indexPixel + 1] = data[indexPixel + 1] * sprite.green;
                //@ts-ignore
                data[indexPixel + 2] = data[indexPixel + 2] * sprite.blue;
                //@ts-ignore
                data[indexPixel + 3] = data[indexPixel + 3] * sprite.alpha;
            }
            //@ts-ignore
            this.context.clearRect(0, 0, sprite.xSizeTexture, sprite.ySizeTexture);
            this.context.putImageData(imageData, 0, 0);
        }
        return CanvasTexture;
    }());
    var Sprite = /** @class */ (function () {
        function Sprite() {
            this.enabled = false;
            this.pinned = false;
            this.x = 0;
            this.y = 0;
            this.xSize = 8;
            this.ySize = 8;
            this.xOffset = 0;
            this.yOffset = 0;
            this.xScale = 1;
            this.yScale = 1;
            this.xMirror = false;
            this.yMirror = false;
            this.angle = 0;
            this.red = 1;
            this.green = 1;
            this.blue = 1;
            this.alpha = 1;
            this.texture = null;
            //Canvas
            this.xTexture = 0;
            this.yTexture = 0;
            this.xSizeTexture = 0;
            this.ySizeTexture = 0;
            this.dirty = false;
            //GL
            //@ts-ignore
            this.u0 = 0;
            //@ts-ignore
            this.v0 = 0;
            //@ts-ignore
            this.u1 = 0;
            //@ts-ignore
            this.v1 = 0;
            //@ts-ignore
            this.setHSVA = function (hue, saturation, value, alpha) {
                console.log("error");
            };
        }
        Object.defineProperty(Sprite.prototype, "selected", {
            get: function () {
                var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale);
                var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale);
                var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale);
                var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale);
                return Engine.Mouse.in(x0, y0, x1, y1);
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(Sprite.prototype, "clicked", {
            get: function () {
                var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale);
                var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale);
                var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale);
                var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale);
                return Engine.Mouse.clickedIn(0, x0, y0, x1, y1);
            },
            enumerable: true,
            configurable: true
        });
        Sprite.prototype.setFull = function (enabled, pinned, texture, xSize, ySize, xOffset, yOffset, xTexture, yTexture, xSizeTexture, ySizeTexture) {
            if (texture == null) {
                console.log("error");
            }
            else {
                this.enabled = enabled;
                this.pinned = pinned;
                this.xSize = xSize;
                this.ySize = ySize;
                this.xOffset = xOffset;
                this.yOffset = yOffset;
                this.texture = texture;
                if (Engine.Renderer.mode == Engine.RendererMode.WEB_GL) {
                    //@ts-ignore
                    this.u0 = xTexture / texture.assetData.xSize;
                    //@ts-ignore
                    this.v0 = yTexture / texture.assetData.ySize;
                    //@ts-ignore
                    this.u1 = (xTexture + xSizeTexture) / texture.assetData.xSize;
                    //@ts-ignore
                    this.v1 = (yTexture + ySizeTexture) / texture.assetData.ySize;
                }
                else {
                    this.xTexture = xTexture;
                    this.yTexture = yTexture;
                    this.xSizeTexture = xSizeTexture;
                    this.ySizeTexture = ySizeTexture;
                    this.dirty = true;
                }
            }
        };
        Sprite.prototype.setRGBA = function (red, green, blue, alpha) {
            if (Engine.Renderer.mode == Engine.RendererMode.CANVAS_2D && this.red != red && this.green != green && this.blue != blue && this.alpha != alpha) {
                this.dirty = true;
            }
            //@ts-ignore
            this.red = red;
            //@ts-ignore
            this.green = green;
            //@ts-ignore
            this.blue = blue;
            //@ts-ignore
            this.alpha = alpha;
        };
        Sprite.prototype.render = function () {
            if (Engine.Renderer.mode == Engine.RendererMode.CANVAS_2D && this.dirty && this.texture != null) {
                if (this.red != 1 || this.green != 1 || this.blue != 1 || this.alpha != 1) {
                    this.canvasTexture = new CanvasTexture(this);
                }
                else {
                    this.canvasTexture = null;
                }
                this.dirty = false;
            }
            //@ts-ignore
            Engine.Renderer.renderSprite(this);
        };
        return Sprite;
    }());
    Engine.Sprite = Sprite;
})(Engine || (Engine = {}));
///<reference path="Sprite.ts"/>
var Engine;
(function (Engine) {
    var Contact = /** @class */ (function () {
        function Contact(box, other, distance) {
            this.box = box;
            this.other = other;
            this.distance = distance;
        }
        return Contact;
    }());
    Engine.Contact = Contact;
    var Overlap = /** @class */ (function () {
        function Overlap(box, other) {
            this.box = box;
            this.other = other;
        }
        return Overlap;
    }());
    Engine.Overlap = Overlap;
    var Point = /** @class */ (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    }());
    Engine.Point = Point;
    var Box = /** @class */ (function () {
        function Box() {
            this.position = new Int32Array(2);
            this.offset = new Int32Array(2);
            this.size = new Int32Array([8000, 8000]);
            this.enabled = false;
            this.layer = Box.LAYER_NONE;
            this.xMirror = false;
            this.yMirror = false;
            this.data = null;
            this.renderable = false;
            this.red = 0;
            this.green = 1;
            this.blue = 0;
            this.alpha = 0.5;
        }
        Object.defineProperty(Box.prototype, "x", {
            get: function () {
                return this.position[0] / Box.UNIT;
            },
            set: function (value) {
                this.position[0] = value * Box.UNIT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "y", {
            get: function () {
                return this.position[1] / Box.UNIT;
            },
            set: function (value) {
                this.position[1] = value * Box.UNIT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "xOffset", {
            get: function () {
                return this.offset[0] / Box.UNIT;
            },
            set: function (value) {
                this.offset[0] = value * Box.UNIT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "yOffset", {
            get: function () {
                return this.offset[1] / Box.UNIT;
            },
            set: function (value) {
                this.offset[1] = value * Box.UNIT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "xSize", {
            get: function () {
                return this.size[0] / Box.UNIT;
            },
            set: function (value) {
                this.size[0] = value * Box.UNIT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "ySize", {
            get: function () {
                return this.size[1] / Box.UNIT;
            },
            set: function (value) {
                this.size[1] = value * Box.UNIT;
            },
            enumerable: true,
            configurable: true
        });
        Box.setInterval = function (box, interval, xAxis) {
            if (xAxis) {
                if (box.xMirror) {
                    interval[0] = box.position[0] - box.offset[0] - box.size[0];
                    interval[1] = box.position[0] - box.offset[0];
                }
                else {
                    interval[0] = box.position[0] + box.offset[0];
                    interval[1] = box.position[0] + box.offset[0] + box.size[0];
                }
                if (box.yMirror) {
                    interval[2] = box.position[1] - box.offset[1] - box.size[1];
                    interval[3] = box.position[1] - box.offset[1];
                }
                else {
                    interval[2] = box.position[1] + box.offset[1];
                    interval[3] = box.position[1] + box.offset[1] + box.size[1];
                }
            }
            else {
                if (box.xMirror) {
                    interval[0] = box.position[1] - box.offset[1] - box.size[1];
                    interval[1] = box.position[1] - box.offset[1];
                }
                else {
                    interval[0] = box.position[1] + box.offset[1];
                    interval[1] = box.position[1] + box.offset[1] + box.size[1];
                }
                if (box.yMirror) {
                    interval[2] = box.position[0] - box.offset[0] - box.size[0];
                    interval[3] = box.position[0] - box.offset[0];
                }
                else {
                    interval[2] = box.position[0] + box.offset[0];
                    interval[3] = box.position[0] + box.offset[0] + box.size[0];
                }
            }
        };
        Box.intervalExclusiveCollides = function (startA, endA, startB, endB) {
            return (startA <= startB && startB < endA) || (startB <= startA && startA < endB);
        };
        Box.intervalDifference = function (startA, endA, startB, endB) {
            if (startA < startB) {
                return endA - startB;
            }
            return startA - endB;
        };
        Box.prototype.castAgainst = function (other, contacts, xAxis, distance, scaleDistance, mask) {
            if (distance != 0) {
                distance *= scaleDistance ? Box.UNIT : 1;
                Box.setInterval(this, Box.intervalA, xAxis);
                if (this == other || !other.enabled || (mask != Box.LAYER_ALL && !(mask & other.layer))) {
                    return contacts;
                }
                Box.setInterval(other, Box.intervalB, xAxis);
                if (Box.intervalExclusiveCollides(Box.intervalB[0], Box.intervalB[1], Box.intervalA[0], Box.intervalA[1])) {
                    return contacts;
                }
                if (!Box.intervalExclusiveCollides(Box.intervalB[2], Box.intervalB[3], Box.intervalA[2], Box.intervalA[3])) {
                    return contacts;
                }
                if (Box.intervalExclusiveCollides(Box.intervalB[0] - (distance > 0 ? distance : 0), Box.intervalB[1] - (distance < 0 ? distance : 0), Box.intervalA[0], Box.intervalA[1])) {
                    var intervalDist = Box.intervalDifference(Box.intervalB[0], Box.intervalB[1], Box.intervalA[0], Box.intervalA[1]);
                    if (Math.abs(distance) < Math.abs(intervalDist)) {
                        return contacts;
                    }
                    if (contacts == null || contacts.length == 0 || Math.abs(intervalDist) < Math.abs(contacts[0].distance)) {
                        contacts = [];
                        contacts[0] = new Contact(this, other, intervalDist);
                    }
                    else if (Math.abs(intervalDist) == Math.abs(contacts[0].distance)) {
                        contacts = contacts || [];
                        contacts.push(new Contact(this, other, intervalDist));
                    }
                }
            }
            return contacts;
        };
        Box.prototype.cast = function (boxes, contacts, xAxis, distance, scaleDistance, mask) {
            for (var _i = 0, boxes_1 = boxes; _i < boxes_1.length; _i++) {
                var other = boxes_1[_i];
                contacts = this.castAgainst(other, contacts, xAxis, distance, scaleDistance, mask);
            }
            return contacts;
        };
        Box.prototype.collideAgainst = function (other, overlaps, xAxis, distance, scaleDistance, mask) {
            distance *= scaleDistance ? Box.UNIT : 1;
            if (this == other || !other.enabled || (mask != Box.LAYER_ALL && !(mask & other.layer))) {
                return overlaps;
            }
            Box.setInterval(this, Box.intervalA, xAxis);
            Box.setInterval(other, Box.intervalB, xAxis);
            if (!Box.intervalExclusiveCollides(Box.intervalB[2], Box.intervalB[3], Box.intervalA[2], Box.intervalA[3])) {
                return overlaps;
            }
            if (Box.intervalExclusiveCollides(Box.intervalB[0] - (distance > 0 ? distance : 0), Box.intervalB[1] - (distance < 0 ? distance : 0), Box.intervalA[0], Box.intervalA[1])) {
                overlaps = overlaps || [];
                overlaps.push(new Overlap(this, other));
            }
            return overlaps;
        };
        Box.prototype.collide = function (boxes, overlaps, xAxis, distance, scaleDistance, mask) {
            for (var _i = 0, boxes_2 = boxes; _i < boxes_2.length; _i++) {
                var other = boxes_2[_i];
                overlaps = this.collideAgainst(other, overlaps, xAxis, distance, scaleDistance, mask);
            }
            return overlaps;
        };
        Box.prototype.translate = function (contacts, xAxis, distance, scaleDistance) {
            distance *= scaleDistance ? Box.UNIT : 1;
            if (contacts == null || contacts.length == 0) {
                this.position[0] += xAxis ? distance : 0;
                this.position[1] += xAxis ? 0 : distance;
            }
            else {
                this.position[0] += xAxis ? contacts[0].distance : 0;
                this.position[1] += xAxis ? 0 : contacts[0].distance;
            }
        };
        Box.prototype.getExtrapolation = function (boxes, xDistance, yDistance, scaleDistance, mask) {
            var oldX = this.position[0];
            var oldY = this.position[1];
            xDistance = xDistance * Engine.System.stepExtrapolation;
            yDistance = yDistance * Engine.System.stepExtrapolation;
            if (boxes == null) {
                this.position[0] += xDistance * (scaleDistance ? Box.UNIT : 1);
                this.position[1] += yDistance * (scaleDistance ? Box.UNIT : 1);
            }
            else {
                var contacts = this.cast(boxes, null, true, xDistance, scaleDistance, mask);
                this.translate(contacts, true, xDistance, scaleDistance);
                contacts = this.cast(boxes, null, false, yDistance, scaleDistance, mask);
                this.translate(contacts, false, yDistance, scaleDistance);
            }
            var point = new Point(this.position[0] / Box.UNIT, this.position[1] / Box.UNIT);
            this.position[0] = oldX;
            this.position[1] = oldY;
            return point;
        };
        Box.renderBoxAt = function (box, x, y) {
            if (Box.debugRender && box.enabled && box.renderable) {
                if (Box.sprite == null) {
                    Box.sprite = new Engine.Sprite();
                    Box.sprite.enabled = true;
                }
                Box.sprite.x = x;
                Box.sprite.y = y;
                Box.sprite.xOffset = box.offset[0] / Box.UNIT;
                Box.sprite.yOffset = box.offset[1] / Box.UNIT;
                Box.sprite.xSize = box.size[0] / Box.UNIT;
                Box.sprite.ySize = box.size[1] / Box.UNIT;
                Box.sprite.xMirror = box.xMirror;
                Box.sprite.yMirror = box.yMirror;
                Box.sprite.setRGBA(box.red, box.green, box.blue, box.alpha);
                Box.sprite.render();
            }
        };
        Box.prototype.render = function () {
            Box.renderBoxAt(this, this.x, this.y);
        };
        Box.prototype.renderExtrapolated = function (boxes, xDistance, yDistance, scaleDistance, mask) {
            var point = this.getExtrapolation(boxes, xDistance, yDistance, scaleDistance, mask);
            Box.renderBoxAt(this, point.x, point.y);
        };
        Box.UNIT = 1000.0;
        Box.LAYER_NONE = 0;
        Box.LAYER_ALL = 1;
        Box.debugRender = true;
        Box.intervalA = new Int32Array(4);
        Box.intervalB = new Int32Array(4);
        return Box;
    }());
    Engine.Box = Box;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Data = /** @class */ (function () {
        function Data() {
        }
        Data.save = function (name, value, days) {
            try {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                var expires = "expires=" + date.toUTCString();
                document.cookie = name + "=" + value + ";" + expires + ";path=/";
            }
            catch (error) {
                console.log(error);
            }
        };
        ;
        Data.load = function (name) {
            try {
                name = name + "=";
                var arrayCookies = document.cookie.split(';');
                for (var indexCoockie = 0; indexCoockie < arrayCookies.length; indexCoockie += 1) {
                    var cookie = arrayCookies[indexCoockie];
                    while (cookie.charAt(0) == ' ') {
                        cookie = cookie.substring(1);
                    }
                    if (cookie.indexOf(name) == 0) {
                        return cookie.substring(name.length, cookie.length);
                    }
                }
                return "";
            }
            catch (error) {
                console.log(error);
                return "";
            }
        };
        ;
        return Data;
    }());
    Engine.Data = Data;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Entity = /** @class */ (function () {
        function Entity() {
            this.preserved = false;
            Engine.System.addListenersFrom(this);
        }
        return Entity;
    }());
    Engine.Entity = Entity;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Keyboard = /** @class */ (function () {
        function Keyboard() {
        }
        Keyboard.hasDown = function (keyCode, old) {
            for (var indexCode = 0; indexCode < (old ? Keyboard.oldKeyPressEvents.length : Keyboard.keyPressEvents.length); indexCode += 1) {
                if (keyCode == (old ? Keyboard.oldKeyPressEvents[indexCode] : Keyboard.keyPressEvents[indexCode])) {
                    return true;
                }
            }
            return false;
        };
        Keyboard.down = function (keyCode) {
            return Keyboard.hasDown(keyCode, false);
        };
        Keyboard.onDown = function (event) {
            var code = event.key.toLowerCase();
            var indexCode = Keyboard.readedKeyPressEvents.length;
            for (var indexEvent = 0; indexEvent < Keyboard.readedKeyPressEvents.length; indexEvent += 1) {
                if (Keyboard.readedKeyPressEvents[indexEvent] == "") {
                    indexCode = indexEvent;
                }
                else if (Keyboard.readedKeyPressEvents[indexEvent] == code) {
                    indexCode = -1;
                    break;
                }
            }
            if (indexCode >= 0) {
                Keyboard.readedKeyPressEvents[indexCode] = code;
            }
            switch (code) {
                case Keyboard.UP:
                case Keyboard.DOWN:
                case Keyboard.LEFT:
                case Keyboard.RIGHT:
                case Keyboard.SPACE:
                case Keyboard.ESC:
                    event.preventDefault();
                    if (typeof event.stopPropagation != "undefined") {
                        event.stopPropagation();
                    }
                    else {
                        event.cancelBubble = true;
                    }
                    return true;
            }
            return false;
        };
        Keyboard.onUp = function (event) {
            var code = event.key.toLowerCase();
            for (var indexEvent = 0; indexEvent < Keyboard.readedKeyPressEvents.length; indexEvent += 1) {
                if (Keyboard.readedKeyPressEvents[indexEvent] == code) {
                    Keyboard.readedKeyPressEvents[indexEvent] = "";
                    break;
                }
            }
            return false;
        };
        //@ts-ignore
        Keyboard.update = function () {
            for (var indexEvent = 0; indexEvent < Keyboard.keyPressEvents.length; indexEvent += 1) {
                Keyboard.oldKeyPressEvents[indexEvent] = Keyboard.keyPressEvents[indexEvent];
            }
            for (var indexEvent = 0; indexEvent < Keyboard.readedKeyPressEvents.length; indexEvent += 1) {
                Keyboard.keyPressEvents[indexEvent] = Keyboard.readedKeyPressEvents[indexEvent];
            }
        };
        Keyboard.A = "a";
        Keyboard.B = "b";
        Keyboard.C = "c";
        Keyboard.D = "d";
        Keyboard.E = "e";
        Keyboard.F = "f";
        Keyboard.G = "g";
        Keyboard.H = "h";
        Keyboard.I = "i";
        Keyboard.J = "j";
        Keyboard.K = "k";
        Keyboard.L = "l";
        Keyboard.M = "m";
        Keyboard.N = "n";
        Keyboard.O = "o";
        Keyboard.P = "p";
        Keyboard.Q = "q";
        Keyboard.R = "r";
        Keyboard.S = "s";
        Keyboard.T = "t";
        Keyboard.U = "u";
        Keyboard.V = "v";
        Keyboard.W = "w";
        Keyboard.X = "x";
        Keyboard.Y = "y";
        Keyboard.Z = "z";
        Keyboard.UP = "arrowup";
        Keyboard.DOWN = "arrowdown";
        Keyboard.LEFT = "arrowleft";
        Keyboard.RIGHT = "arrowright";
        Keyboard.SPACE = " ";
        Keyboard.ESC = "escape";
        Keyboard.readedKeyPressEvents = [];
        Keyboard.oldKeyPressEvents = [];
        Keyboard.keyPressEvents = [];
        Keyboard.up = function (keyCode) {
            return !Keyboard.hasDown(keyCode, false);
        };
        Keyboard.pressed = function (keyCode) {
            return Keyboard.hasDown(keyCode, false) && !Keyboard.hasDown(keyCode, true);
        };
        Keyboard.released = function (keyCode) {
            return !Keyboard.hasDown(keyCode, false) && Keyboard.hasDown(keyCode, true);
        };
        return Keyboard;
    }());
    Engine.Keyboard = Keyboard;
    //@ts-ignore
    window.addEventListener("keydown", Keyboard.onDown, false);
    //@ts-ignore
    window.addEventListener("keyup", Keyboard.onUp, false);
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Link = /** @class */ (function () {
        function Link(owner, url) {
            this.owner = owner;
            this.url = url;
        }
        return Link;
    }());
    var LinkManager = /** @class */ (function () {
        function LinkManager() {
        }
        LinkManager.add = function (owner, url) {
            var link = null;
            for (var _i = 0, _a = LinkManager.links; _i < _a.length; _i++) {
                var arrayLink = _a[_i];
                if (arrayLink.owner == owner && arrayLink.url == url) {
                    link = arrayLink;
                }
            }
            if (link == null) {
                LinkManager.links.push(new Link(owner, url));
            }
        };
        LinkManager.remove = function (owner, url) {
            var newLinks = new Array();
            for (var _i = 0, _a = LinkManager.links; _i < _a.length; _i++) {
                var link = _a[_i];
                if (link.owner != owner || link.url != url) {
                    newLinks.push(link);
                }
            }
            LinkManager.links = newLinks;
        };
        //@ts-ignore
        LinkManager.trigger = function () {
            for (var _i = 0, _a = LinkManager.links; _i < _a.length; _i++) {
                var link = _a[_i];
                window.open(link.url, '_blank');
            }
        };
        LinkManager.links = new Array();
        return LinkManager;
    }());
    Engine.LinkManager = LinkManager;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Mouse = /** @class */ (function () {
        function Mouse() {
        }
        Object.defineProperty(Mouse, "x", {
            get: function () {
                return Mouse._x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mouse, "y", {
            get: function () {
                return Mouse._y;
            },
            enumerable: true,
            configurable: true
        });
        Mouse.hasDown = function (indexButton, old) {
            if (indexButton < (old ? Mouse.oldButtonPressEvents.length : Mouse.buttonPressEvents.length)) {
                return old ? Mouse.oldButtonPressEvents[indexButton] : Mouse.buttonPressEvents[indexButton];
            }
            return false;
        };
        ;
        Mouse.down = function (indexButton) {
            return Mouse.hasDown(indexButton, false);
        };
        Mouse.up = function (indexButton) {
            return !Mouse.hasDown(indexButton, false);
        };
        Mouse.pressed = function (indexButton) {
            return Mouse.hasDown(indexButton, false) && !Mouse.hasDown(indexButton, true);
        };
        Mouse.released = function (indexButton) {
            return !Mouse.hasDown(indexButton, false) && Mouse.hasDown(indexButton, true);
        };
        Mouse.in = function (x0, y0, x1, y1) {
            return x0 <= Mouse._x && x1 >= Mouse._x && y0 <= Mouse._y && y1 >= Mouse._y;
        };
        Mouse.clickedIn = function (indexButton, x0, y0, x1, y1) {
            if (Mouse.released(indexButton)) {
                var downX = Mouse.pressPositionsX[indexButton];
                var downY = Mouse.pressPositionsY[indexButton];
                var downIn = x0 <= downX && x1 >= downX && y0 <= downY && y1 >= downY;
                var upIn = Mouse.in(x0, y0, x1, y1);
                return downIn && upIn;
            }
            return false;
        };
        Mouse.onDown = function (event) {
            Mouse._x = event.clientX;
            Mouse._y = event.clientY;
            Mouse.readedButtonPressEvents[event.button] = true;
            Mouse.pressPositionsX[event.button] = Mouse._x;
            Mouse.pressPositionsY[event.button] = Mouse._y;
            return false;
        };
        Mouse.onUp = function (event) {
            Mouse._x = event.clientX;
            Mouse._y = event.clientY;
            Mouse.readedButtonPressEvents[event.button] = false;
            return false;
        };
        Mouse.onMove = function (event) {
            Mouse._x = event.clientX;
            Mouse._y = event.clientY;
            return false;
        };
        //@ts-ignore
        Mouse.update = function () {
            for (var indexEvent = 0; indexEvent < Mouse.buttonPressEvents.length; indexEvent += 1) {
                Mouse.oldButtonPressEvents[indexEvent] = Mouse.buttonPressEvents[indexEvent];
            }
            for (var indexEvent = 0; indexEvent < Mouse.readedButtonPressEvents.length; indexEvent += 1) {
                Mouse.buttonPressEvents[indexEvent] = Mouse.readedButtonPressEvents[indexEvent];
            }
        };
        Mouse._x = 0;
        Mouse._y = 0;
        Mouse.readedButtonPressEvents = new Array();
        Mouse.oldButtonPressEvents = new Array();
        Mouse.buttonPressEvents = new Array();
        Mouse.pressPositionsX = new Array();
        Mouse.pressPositionsY = new Array();
        return Mouse;
    }());
    Engine.Mouse = Mouse;
    //@ts-ignore
    window.addEventListener("mousedown", Mouse.onDown, false);
    //@ts-ignore
    window.addEventListener("mouseup", Mouse.onUp, false);
    //@ts-ignore
    window.addEventListener("mousemove", Mouse.onMove, false);
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var RendererMode;
    (function (RendererMode) {
        RendererMode[RendererMode["CANVAS_2D"] = 0] = "CANVAS_2D";
        RendererMode[RendererMode["WEB_GL"] = 1] = "WEB_GL";
    })(RendererMode = Engine.RendererMode || (Engine.RendererMode = {}));
    var Renderer = /** @class */ (function () {
        function Renderer() {
        }
        Renderer.xViewToWindow = function (x) {
            return (x + Renderer.xSizeView * 0.5) * (Renderer.xSizeWindow) / Renderer.xSizeView;
        };
        Renderer.yViewToWindow = function (y) {
            return (y + Renderer.ySizeView * 0.5) * (Renderer.ySizeWindow) / Renderer.ySizeView;
        };
        /*
        public static xViewToWindow(x : number){
            return (x + Renderer.xSizeView * 0.5) * (Renderer.xSizeWindow) / Renderer.xSizeView - (Renderer.topLeftCamera ? (Renderer.xSizeWindow) * 0.5 : 0);
        }
    
        public static yViewToWindow(y : number){
            return (y + Renderer.ySizeView * 0.5) * (SysRenderertem.ySizeWindow) / Renderer.ySizeView - (Renderer.topLeftCamera ? (Renderer.ySizeWindow) * 0.5 : 0);
        }

        Engine.topLeftCamera = function(enabled){
            System.topLeftCamera = enabled;
            if(System.usingGLRenderer){
                System.Renderer.gl.uniform1i(System.glTopLeftCamera, enabled ? 1 : 0);
            }
        }
        */
        Renderer.camera = function (x, y) {
            Renderer.xCamera = x;
            Renderer.yCamera = y;
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.uniform2f(Renderer.glCameraPosition, x, y);
            }
        };
        Renderer.sizeView = function (x, y) {
            Renderer.xSizeViewIdeal = x;
            Renderer.ySizeViewIdeal = y;
            Renderer.fixViewValues();
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.uniform2f(Renderer.glSizeView, Renderer.xSizeView, Renderer.xSizeView);
            }
        };
        Renderer.scaleView = function (x, y) {
            Renderer.xScaleView = x;
            Renderer.yScaleView = y;
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.uniform2f(Renderer.glScaleView, x, y);
            }
        };
        ;
        Renderer.clearColor = function (red, green, blue) {
            Renderer.clearRed = red;
            Renderer.clearGreen = green;
            Renderer.clearBlue = blue;
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.clearColor(red, green, blue, 1);
            }
        };
        Renderer.fixViewValues = function () {
            if (Renderer.xFitView) {
                //@ts-ignore
                Renderer.xSizeView = Renderer.xSizeViewIdeal;
                //@ts-ignore
                Renderer.ySizeView = Renderer.ySizeWindow * Renderer.xSizeViewIdeal / Renderer.xSizeWindow;
            }
            else {
                //@ts-ignore
                Renderer.xSizeView = Renderer.xSizeWindow * Renderer.ySizeViewIdeal / Renderer.ySizeWindow;
                //@ts-ignore
                Renderer.ySizeView = Renderer.ySizeViewIdeal;
            }
        };
        //@ts-ignore
        Renderer.fixCanvasSize = function () {
            Renderer.canvas.style.width = window.innerWidth + "px";
            Renderer.canvas.style.height = window.innerHeight + "px";
            Renderer.canvas.width = window.innerWidth;
            Renderer.canvas.height = window.innerHeight;
            //@ts-ignore
            Renderer.xSizeWindow = window.innerWidth;
            //@ts-ignore
            Renderer.ySizeWindow = window.innerHeight;
            Renderer.fixViewValues();
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.viewport(0, 0, Renderer.canvas.width, Renderer.canvas.height);
                Renderer.gl.uniform2f(Renderer.glSizeView, Renderer.xSizeView, Renderer.ySizeView);
            }
            else {
                Renderer.context.imageSmoothingEnabled = false;
            }
        };
        //@ts-ignore
        Renderer.clear = function () {
            if (Renderer.mode == RendererMode.CANVAS_2D) {
                Renderer.context.fillStyle = "rgba(" + Renderer.clearRed * 255 + ", " + Renderer.clearGreen * 255 + ", " + Renderer.clearBlue * 255 + ", 1.0)";
                Renderer.context.fillRect(0, 0, Renderer.canvas.width, Renderer.canvas.height);
            }
            else {
                Renderer.gl.clear(Renderer.gl.COLOR_BUFFER_BIT);
            }
            //@ts-ignore
            Renderer.drawCalls = 0;
        };
        //@ts-ignore
        Renderer.renderSprite = function (sprite) {
            if (sprite.enabled) {
                if (Renderer.mode == RendererMode.CANVAS_2D) {
                    //if(!Renderer.topLeftCamera){
                    //    Renderer.context.translate(Renderer.canvas.width * 0.5, Renderer.canvas.height * 0.5);
                    //}
                    if (Renderer.xFitView) {
                        Renderer.context.scale(Renderer.canvas.width / Renderer.xSizeView, Renderer.canvas.width / Renderer.xSizeView);
                    }
                    else {
                        Renderer.context.scale(Renderer.canvas.height / Renderer.ySizeView, Renderer.canvas.height / Renderer.ySizeView);
                    }
                    if (Renderer.xScaleView != 1 && Renderer.yScaleView != 1) {
                        Renderer.context.scale(Renderer.xScaleView, Renderer.yScaleView);
                    }
                    if (!sprite.pinned) {
                        Renderer.context.translate(-Renderer.xCamera, -Renderer.yCamera);
                    }
                    Renderer.context.translate(sprite.x, sprite.y);
                    if (sprite.xScale != 1 || sprite.yScale != 1 || sprite.xMirror || sprite.yMirror) {
                        Renderer.context.scale(sprite.xScale * (sprite.xMirror ? -1 : 1), sprite.yScale * (sprite.yMirror ? -1 : 1));
                    }
                    Renderer.context.translate(sprite.xOffset, sprite.yOffset);
                    //if(sprite.xSize != sprite.xSizeTexture || sprite.ySize != sprite.ySizeTexture){
                    //    System.context.scale(sprite.xSize / sprite.xSizeTexture, sprite.ySize / sprite.ySizeTexture);
                    //}
                    if (sprite.angle != 0) {
                        Renderer.context.rotate(sprite.angle * Engine.System.PI_OVER_180);
                    }
                    //@ts-ignore
                    if (sprite.texture == null) {
                        Renderer.context.fillStyle = "rgba(" + sprite.red * 255 + ", " + sprite.green * 255 + ", " + sprite.blue * 255 + ", " + sprite.alpha + ")";
                        Renderer.context.fillRect(0, 0, sprite.xSize, sprite.ySize);
                    }
                    //@ts-ignore
                    else if (sprite.canvasTexture == null) {
                        //@ts-ignore
                        Renderer.context.drawImage(sprite.texture.canvas, sprite.xTexture, sprite.yTexture, sprite.xSizeTexture, sprite.ySizeTexture, 0, 0, sprite.xSize, sprite.ySize);
                    }
                    else {
                        //@ts-ignore
                        Renderer.context.drawImage(sprite.canvasTexture.canvas, 0, 0, sprite.xSizeTexture, sprite.ySizeTexture, 0, 0, sprite.xSize, sprite.ySize);
                    }
                    Renderer.context.resetTransform();
                }
                else {
                    if (Renderer.drawableCount == Renderer.maxElementsDrawCall) {
                        Renderer.update();
                    }
                    Renderer.vertexArray.push(sprite.pinned ? 1 : 0);
                    Renderer.vertexArray.push(sprite.x);
                    Renderer.vertexArray.push(sprite.y);
                    Renderer.vertexArray.push(sprite.xOffset);
                    Renderer.vertexArray.push(sprite.yOffset);
                    Renderer.vertexArray.push(sprite.xScale);
                    Renderer.vertexArray.push(sprite.yScale);
                    Renderer.vertexArray.push(sprite.xMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.yMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.angle);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.u0);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.v0);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.texture == null ? -1 : sprite.texture.slot);
                    Renderer.vertexArray.push(sprite.red);
                    Renderer.vertexArray.push(sprite.green);
                    Renderer.vertexArray.push(sprite.blue);
                    Renderer.vertexArray.push(sprite.alpha);
                    Renderer.vertexArray.push(sprite.pinned ? 1 : 0);
                    Renderer.vertexArray.push(sprite.x);
                    Renderer.vertexArray.push(sprite.y);
                    Renderer.vertexArray.push(sprite.xOffset + sprite.xSize);
                    Renderer.vertexArray.push(sprite.yOffset);
                    Renderer.vertexArray.push(sprite.xScale);
                    Renderer.vertexArray.push(sprite.yScale);
                    Renderer.vertexArray.push(sprite.xMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.yMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.angle);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.u1);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.v0);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.texture == null ? -1 : sprite.texture.slot);
                    Renderer.vertexArray.push(sprite.red);
                    Renderer.vertexArray.push(sprite.green);
                    Renderer.vertexArray.push(sprite.blue);
                    Renderer.vertexArray.push(sprite.alpha);
                    Renderer.vertexArray.push(sprite.pinned ? 1 : 0);
                    Renderer.vertexArray.push(sprite.x);
                    Renderer.vertexArray.push(sprite.y);
                    Renderer.vertexArray.push(sprite.xOffset);
                    Renderer.vertexArray.push(sprite.yOffset + sprite.ySize);
                    Renderer.vertexArray.push(sprite.xScale);
                    Renderer.vertexArray.push(sprite.yScale);
                    Renderer.vertexArray.push(sprite.xMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.yMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.angle);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.u0);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.v1);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.texture == null ? -1 : sprite.texture.slot);
                    Renderer.vertexArray.push(sprite.red);
                    Renderer.vertexArray.push(sprite.green);
                    Renderer.vertexArray.push(sprite.blue);
                    Renderer.vertexArray.push(sprite.alpha);
                    Renderer.vertexArray.push(sprite.pinned ? 1 : 0);
                    Renderer.vertexArray.push(sprite.x);
                    Renderer.vertexArray.push(sprite.y);
                    Renderer.vertexArray.push(sprite.xOffset + sprite.xSize);
                    Renderer.vertexArray.push(sprite.yOffset + sprite.ySize);
                    Renderer.vertexArray.push(sprite.xScale);
                    Renderer.vertexArray.push(sprite.yScale);
                    Renderer.vertexArray.push(sprite.xMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.yMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.angle);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.u1);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.v1);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.texture == null ? -1 : sprite.texture.slot);
                    Renderer.vertexArray.push(sprite.red);
                    Renderer.vertexArray.push(sprite.green);
                    Renderer.vertexArray.push(sprite.blue);
                    Renderer.vertexArray.push(sprite.alpha);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 0);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 1);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 2);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 1);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 3);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 2);
                    Renderer.drawableCount += 1;
                }
            }
        };
        Renderer.update = function () {
            if (Renderer.mode == RendererMode.CANVAS_2D) {
                //@ts-ignore
                Renderer.drawCalls += 1;
            }
            else {
                if (Renderer.drawableCount > 0) {
                    Renderer.gl.bindBuffer(Renderer.gl.ARRAY_BUFFER, Renderer.vertexBuffer);
                    Renderer.gl.bufferData(Renderer.gl.ARRAY_BUFFER, new Float32Array(Renderer.vertexArray), Renderer.gl.DYNAMIC_DRAW);
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexPinned, 1, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (0));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexAnchor, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexPosition, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexScale, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexMirror, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexAngle, 1, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexUV, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2 + 2 + 1));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexTexture, 1, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexColor, 4, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1));
                    Renderer.gl.bindBuffer(Renderer.gl.ELEMENT_ARRAY_BUFFER, Renderer.faceBuffer);
                    Renderer.gl.bufferData(Renderer.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Renderer.faceArray), Renderer.gl.DYNAMIC_DRAW);
                    Renderer.gl.drawElements(Renderer.gl.TRIANGLES, Renderer.drawableCount * (3 + 3), Renderer.gl.UNSIGNED_SHORT, 0);
                    Renderer.gl.flush();
                    //@ts-ignore
                    Renderer.drawCalls += 1;
                    Renderer.vertexArray = [];
                    Renderer.faceArray = [];
                    Renderer.drawableCount = 0;
                }
            }
        };
        //@ts-ignore
        Renderer.updateHandCursor = function () {
            if (Renderer.useHandPointer) {
                Renderer.canvas.style.cursor = "pointer";
                Renderer.useHandPointer = false;
            }
            else {
                Renderer.canvas.style.cursor = "default";
            }
        };
        //@ts-ignore
        Renderer.init = function () {
            Renderer.canvas = document.getElementById('gameCanvas');
            Renderer.canvas.style.display = "block";
            Renderer.canvas.style.position = "absolute";
            Renderer.canvas.style.top = "0px";
            ;
            Renderer.canvas.style.left = "0px";
            ;
            Renderer.canvas.style.width = window.innerWidth + "px";
            Renderer.canvas.style.height = window.innerHeight + "px";
            Renderer.canvas.width = window.innerWidth;
            Renderer.canvas.height = window.innerHeight;
            //@ts-ignore
            Renderer.xSizeWindow = window.innerWidth;
            //@ts-ignore
            Renderer.ySizeWindow = window.innerHeight;
            //@ts-ignore
            Renderer.xSizeView = Renderer.xSizeWindow * Renderer.ySizeViewIdeal / Renderer.ySizeWindow;
            //@ts-ignore
            Renderer.ySizeView = Renderer.ySizeViewIdeal;
            if (Renderer.preferredMode == RendererMode.WEB_GL) {
                try {
                    Renderer.gl = Renderer.canvas.getContext("webgl") || Renderer.canvas.getContext("experimental-webgl");
                    //@ts-ignore
                    Renderer.glSupported = Renderer.gl && Renderer.gl instanceof WebGLRenderingContext;
                }
                catch (e) {
                    //@ts-ignore
                    Renderer.glSupported = false;
                }
            }
            if (Renderer.glSupported && Renderer.preferredMode == RendererMode.WEB_GL) {
                //@ts-ignore
                Renderer.mode = RendererMode.WEB_GL;
                Engine.Assets.queue(Renderer.PATH_SHADER_VERTEX);
                Engine.Assets.queue(Renderer.PATH_SHADER_FRAGMENT);
                Engine.Assets.download();
                Renderer.initGL();
            }
            else {
                if (Renderer.preferredMode == RendererMode.CANVAS_2D) {
                    console.warn("Set \"Renderer.preferredMode = RendererMode.CANVAS_2D\" only for testing proposes.");
                }
                //@ts-ignore
                Renderer.mode = RendererMode.CANVAS_2D;
                Renderer.context = Renderer.canvas.getContext("2d");
                Renderer.context.imageSmoothingEnabled = false;
                //@ts-ignore
                Renderer.inited = true;
            }
        };
        Renderer.getGLTextureUnitIndex = function (index) {
            switch (index) {
                case 0: return Renderer.gl.TEXTURE0;
                case 1: return Renderer.gl.TEXTURE1;
                case 2: return Renderer.gl.TEXTURE2;
                case 3: return Renderer.gl.TEXTURE3;
                case 4: return Renderer.gl.TEXTURE4;
                case 5: return Renderer.gl.TEXTURE5;
                case 6: return Renderer.gl.TEXTURE6;
                case 7: return Renderer.gl.TEXTURE7;
                case 8: return Renderer.gl.TEXTURE8;
                case 9: return Renderer.gl.TEXTURE9;
                case 10: return Renderer.gl.TEXTURE10;
                case 11: return Renderer.gl.TEXTURE11;
                case 12: return Renderer.gl.TEXTURE12;
                case 13: return Renderer.gl.TEXTURE13;
                case 14: return Renderer.gl.TEXTURE14;
                case 15: return Renderer.gl.TEXTURE15;
                case 16: return Renderer.gl.TEXTURE16;
                case 17: return Renderer.gl.TEXTURE17;
                case 18: return Renderer.gl.TEXTURE18;
                case 19: return Renderer.gl.TEXTURE19;
                case 20: return Renderer.gl.TEXTURE20;
                case 21: return Renderer.gl.TEXTURE21;
                case 22: return Renderer.gl.TEXTURE22;
                case 23: return Renderer.gl.TEXTURE23;
                case 24: return Renderer.gl.TEXTURE24;
                case 25: return Renderer.gl.TEXTURE25;
                case 26: return Renderer.gl.TEXTURE26;
                case 27: return Renderer.gl.TEXTURE27;
                case 28: return Renderer.gl.TEXTURE28;
                case 29: return Renderer.gl.TEXTURE29;
                case 30: return Renderer.gl.TEXTURE30;
                case 31: return Renderer.gl.TEXTURE31;
                default: return Renderer.gl.NONE;
            }
        };
        Renderer.createShader = function (source, type) {
            var shader = Renderer.gl.createShader(type);
            if (shader == null || shader == Renderer.gl.NONE) {
                console.log("Error");
            }
            else {
                Renderer.gl.shaderSource(shader, source);
                Renderer.gl.compileShader(shader);
                var shaderCompileStatus = Renderer.gl.getShaderParameter(shader, Renderer.gl.COMPILE_STATUS);
                if (shaderCompileStatus <= 0) {
                    console.log("Error");
                }
                else {
                    return shader;
                }
            }
            return Renderer.gl.NONE;
        };
        //@ts-ignore
        Renderer.renderTexture = function (texture) {
            Renderer.textureSamplerIndices[texture.slot] = texture.slot;
            Renderer.gl.uniform1iv(Renderer.glTextureSamplers, new Int32Array(Renderer.textureSamplerIndices));
            Renderer.gl.activeTexture(Renderer.getGLTextureUnitIndex(texture.slot));
            Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, Renderer.textureSlots[texture.slot]);
            //@ts-ignore
            Renderer.gl.texImage2D(Renderer.gl.TEXTURE_2D, 0, Renderer.gl.RGBA, texture.assetData.xSize, texture.assetData.ySize, 0, Renderer.gl.RGBA, Renderer.gl.UNSIGNED_BYTE, new Uint8Array(texture.assetData.bytes));
        };
        Renderer.initGL = function () {
            if (Engine.Assets.downloadComplete) {
                for (var indexSlot = 0; indexSlot < Renderer.MAX_TEXTURE_SLOTS; indexSlot += 1) {
                    Renderer.textureSamplerIndices[indexSlot] = 0;
                }
                //TODO: USE Renderer.gl.MAX_TEXTURE_IMAGE_UNITS
                Renderer.vertexShader = Renderer.createShader(Engine.Assets.loadText(Renderer.PATH_SHADER_VERTEX), Renderer.gl.VERTEX_SHADER);
                var fragmentSource = "#define MAX_TEXTURE_SLOTS " + Renderer.MAX_TEXTURE_SLOTS + "\n" + "precision mediump float;\n" + Engine.Assets.loadText(Renderer.PATH_SHADER_FRAGMENT);
                Renderer.fragmentShader = Renderer.createShader(fragmentSource, Renderer.gl.FRAGMENT_SHADER);
                Renderer.shaderProgram = Renderer.gl.createProgram();
                if (Renderer.shaderProgram == null || Renderer.shaderProgram == 0) {
                    console.log("Error");
                }
                else {
                    Renderer.gl.attachShader(Renderer.shaderProgram, Renderer.vertexShader);
                    Renderer.gl.attachShader(Renderer.shaderProgram, Renderer.fragmentShader);
                    Renderer.gl.linkProgram(Renderer.shaderProgram);
                    Renderer.glTextureSamplers = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "textures");
                    Renderer.glSizeView = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "view_size");
                    Renderer.glScaleView = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "view_scale");
                    Renderer.glCameraPosition = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "camera_position");
                    //Renderer.glTopLeftCamera = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "top_left_camera");
                    //glPixelPerfect = Renderer.gl.getUniformLocation(shaderProgram, "pixel_perfect");
                    Renderer.glVertexPinned = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_pinned");
                    Renderer.glVertexAnchor = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_anchor");
                    Renderer.glVertexPosition = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_position");
                    Renderer.glVertexScale = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_scale");
                    Renderer.glVertexMirror = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_mirror");
                    Renderer.glVertexAngle = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_angle");
                    Renderer.glVertexUV = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_uv");
                    Renderer.glVertexTexture = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_texture");
                    Renderer.glVertexColor = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_color");
                    Renderer.gl.useProgram(Renderer.shaderProgram);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexPinned);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexAnchor);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexPosition);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexScale);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexMirror);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexAngle);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexUV);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexTexture);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexColor);
                    Renderer.gl.uniform1iv(Renderer.glTextureSamplers, new Int32Array(Renderer.textureSamplerIndices));
                    Renderer.gl.viewport(0, 0, Renderer.canvas.width, Renderer.canvas.height);
                    Renderer.gl.uniform2f(Renderer.glSizeView, Renderer.xSizeView, Renderer.ySizeView);
                    Renderer.gl.uniform2f(Renderer.glScaleView, Renderer.xScaleView, Renderer.yScaleView);
                    //TODO: Android
                    //Renderer.gl.uniform2f(rly_cursor_location, rly_cursorX, rly_cursorY);
                    //Renderer.gl.uniform1iv(rly_top_left_cursor_location, rly_top_left_cursor);
                    //Renderer.gl.uniform1iv(rly_pixel_perfect_location, rly_pixel_perfect);
                    Renderer.vertexBuffer = Renderer.gl.createBuffer();
                    Renderer.faceBuffer = Renderer.gl.createBuffer();
                    Renderer.gl.enable(Renderer.gl.BLEND);
                    Renderer.gl.blendFuncSeparate(Renderer.gl.SRC_ALPHA, Renderer.gl.ONE_MINUS_SRC_ALPHA, Renderer.gl.ZERO, Renderer.gl.ONE);
                    //glBlendFunc(Renderer.gl.ONE, Renderer.gl.ONE_MINUS_SRC_ALPHA);
                    Renderer.gl.clearColor(Renderer.clearRed, Renderer.clearGreen, Renderer.clearBlue, 1);
                    //Renderer.gl.clear(Renderer.gl.COLOR_BUFFER_BIT);
                    for (var indexSlot = 0; indexSlot < Renderer.MAX_TEXTURE_SLOTS; indexSlot += 1) {
                        Renderer.textureSlots[indexSlot] = Renderer.gl.createTexture();
                        Renderer.gl.activeTexture(Renderer.getGLTextureUnitIndex(indexSlot));
                        Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, Renderer.textureSlots[indexSlot]);
                        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MAG_FILTER, Renderer.gl.NEAREST);
                        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MIN_FILTER, Renderer.gl.NEAREST);
                        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_T, Renderer.gl.CLAMP_TO_EDGE);
                        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_S, Renderer.gl.CLAMP_TO_EDGE);
                        //Renderer.gl.generateMipmap(Renderer.gl.TEXTURE_2D);
                    }
                    Renderer.gl.activeTexture(Renderer.getGLTextureUnitIndex(0));
                    Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, Renderer.textureSlots[0]);
                    Renderer.gl.texImage2D(Renderer.gl.TEXTURE_2D, 0, Renderer.gl.RGBA, 2, 2, 0, Renderer.gl.RGBA, Renderer.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]));
                }
                Renderer.gl.clearColor(1, 1, 1, 1);
                //@ts-ignore
                Renderer.inited = true;
            }
            else {
                setTimeout(Renderer.initGL, 1.0 / 60.0);
            }
        };
        //GL
        Renderer.MAX_TEXTURE_SLOTS = 8;
        Renderer.SPRITE_RENDERER_VERTICES = 4;
        //private static readonly  SPRITE_RENDERER_VERTEX_ATTRIBUTES = 17;
        //private static readonly  SPRITE_RENDERER_FACE_INDICES = 6;
        Renderer.PATH_SHADER_VERTEX = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/System/Vertex.glsl";
        Renderer.PATH_SHADER_FRAGMENT = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/System/Fragment.glsl";
        Renderer.inited = false;
        Renderer.preferredMode = RendererMode.WEB_GL;
        Renderer.glSupported = false;
        Renderer.useHandPointer = false;
        //private static topLeftCamera = false;
        Renderer.xCamera = 0;
        Renderer.yCamera = 0;
        Renderer.xSizeViewIdeal = 160 * 2;
        Renderer.ySizeViewIdeal = 120 * 2;
        Renderer.clearRed = 0;
        Renderer.clearGreen = 0;
        Renderer.clearBlue = 0;
        Renderer.xFitView = false;
        Renderer.xScaleView = 1;
        Renderer.yScaleView = 1;
        Renderer.drawCalls = 0;
        Renderer.maxElementsDrawCall = 8192;
        Renderer.textureSlots = new Array();
        Renderer.drawableCount = 0;
        Renderer.vertexArray = new Array();
        Renderer.faceArray = new Array();
        Renderer.textureSamplerIndices = new Array();
        return Renderer;
    }());
    Engine.Renderer = Renderer;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Scene = /** @class */ (function () {
        function Scene() {
            //@ts-ignore
            if (!Engine.System.canCreateScene || Engine.System.creatingScene) {
                console.log("error");
            }
            //@ts-ignore
            Engine.System.creatingScene = true;
        }
        Object.defineProperty(Scene.prototype, "preserved", {
            get: function () {
                return false;
            },
            //@ts-ignore
            set: function (value) {
                console.log("ERROR");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "owner", {
            get: function () {
                return null;
            },
            //@ts-ignore
            set: function (value) {
                console.log("ERROR");
            },
            enumerable: true,
            configurable: true
        });
        return Scene;
    }());
    Engine.Scene = Scene;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Texture = /** @class */ (function () {
        function Texture(path) {
            this.path = "";
            this.slot = 0;
            this.preserved = false;
            //@ts-ignore
            if (!Engine.System.creatingScene) {
                console.error("error");
            }
            this.path = path;
            //@ts-ignore
            this.slot = Texture.textures.length;
            this.assetData = Engine.Assets.loadImage(path);
            if (Engine.Renderer.mode == Engine.RendererMode.CANVAS_2D) {
                this.canvas = document.createElement("canvas");
                this.canvas.width = this.assetData.xSize;
                this.canvas.width = this.assetData.ySize;
                this.context = this.canvas.getContext("2d");
                this.context.putImageData(this.assetData.imageData, 0, 0);
            }
            else {
                //@ts-ignore
                Engine.Renderer.renderTexture(this);
            }
            Texture.textures.push(this);
        }
        Texture.load = function (path) {
            for (var _i = 0, _a = Texture.textures; _i < _a.length; _i++) {
                var texture = _a[_i];
                if (texture.path == path) {
                    return texture;
                }
            }
            return new Engine.Texture(path);
        };
        //@ts-ignore
        Texture.recycleAll = function () {
            var newTextures = new Array();
            for (var _i = 0, _a = Texture.textures; _i < _a.length; _i++) {
                var texture = _a[_i];
                var owner = texture;
                while (owner.owner != null) {
                    owner = owner.owner;
                }
                if (owner.preserved) {
                    var oldSlot = texture.slot;
                    //@ts-ignore
                    texture.slot = newTextures.length;
                    if (Engine.Renderer.mode == Engine.RendererMode.WEB_GL && oldSlot != texture.slot) {
                        //@ts-ignore
                        Engine.Renderer.renderTexture(texture);
                    }
                    newTextures.push(texture);
                }
            }
            Texture.textures = newTextures;
        };
        Texture.textures = new Array();
        return Texture;
    }());
    Engine.Texture = Texture;
})(Engine || (Engine = {}));
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Entity = /** @class */ (function (_super) {
            __extends(Entity, _super);
            function Entity(def) {
                var _this = _super.call(this) || this;
                _this.def = def;
                return _this;
            }
            //@ts-ignore
            Entity.create = function (def) {
                //@ts-ignore
                new Entities[def.type.type](def);
            };
            Entity.getDefProperty = function (def, name) {
                var prop = null;
                if (def.instance.properties != undefined) {
                    prop = def.instance.properties.find(function (prop) {
                        return prop.name == name;
                    });
                }
                if (prop == null && def.type.properties != undefined) {
                    prop = def.type.properties.find(function (prop) {
                        return prop.name == name;
                    });
                }
                if (prop != null) {
                    return prop.value;
                }
                return null;
            };
            Entity.prototype.getProperty = function (name) {
                return Entity.getDefProperty(this.def, name);
            };
            return Entity;
        }(Engine.Entity));
        Entities.Entity = Entity;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var VARIANTS = 5;
        var frames = new Array();
        var animationsStand = new Array();
        var animationsMove = new Array();
        var animationsJump = new Array();
        var animationsFall = new Array();
        var animationsFallGround = new Array();
        var animationsLanding = new Array();
        function createFrames(xTexture, yTexture, xSize, ySize, xOffset, yOffset) {
            for (var index = 0; index < VARIANTS; index += 1) {
                var frame = new Utils.AnimationFrame();
                frame.texture = Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0);
                frame.xTexture = xTexture;
                frame.yTexture = yTexture + 14 * index;
                frame.xSize = frame.xSizeTexture = xSize;
                frame.ySize = frame.ySizeTexture = ySize;
                frame.xOffset = xOffset;
                frame.yOffset = yOffset;
                frames.push(frame);
            }
        }
        function createAllFrames() {
            createFrames(30, 141, 16, 11, -8, -11);
            createFrames(47, 142, 18, 10, -9, -10);
            createFrames(66, 143, 20, 9, -10, -9);
            createFrames(87, 140, 14, 12, -7, -12);
            createFrames(102, 139, 12, 13, -6, -12);
            createFrames(115, 140, 14, 12, -7, -12);
            createFrames(130, 141, 16, 11, -8, -11);
            createFrames(147, 140, 14, 12, -7, -12);
            createFrames(162, 139, 12, 13, -6, -12);
        }
        function getFrame(index, variant) {
            return frames[index * VARIANTS + variant];
        }
        function createAnims(array, name, steps, loop, frameIndices) {
            for (var indexVariant = 0; indexVariant < VARIANTS; indexVariant += 1) {
                var animation = new Utils.Animation();
                animation.name = name;
                animation.steps = steps;
                animation.loop = loop;
                animation.frames = new Array();
                for (var _i = 0, frameIndices_1 = frameIndices; _i < frameIndices_1.length; _i++) {
                    var indexFrame = frameIndices_1[_i];
                    animation.frames.push(getFrame(indexFrame, indexVariant));
                }
                array.push(animation);
            }
        }
        function createAllAnims() {
            createAnims(animationsStand, "stand", 1, false, [0]);
            createAnims(animationsMove, "move", 5, true, [1, 2, 1, 0]);
            createAnims(animationsJump, "jump", 3, false, [3, 4]);
            createAnims(animationsFall, "fall", 3, false, [5, 6, 7, 8]);
            createAnims(animationsFallGround, "fall ground", 3, false, [6, 7, 8]);
            createAnims(animationsLanding, "landing", 3, false, [1, 2, 1, 0]);
        }
        Game.addAction("init", function () {
            createAllFrames();
            createAllAnims();
        });
        var Blob = /** @class */ (function (_super) {
            __extends(Blob, _super);
            function Blob(def, onFire, variant) {
                var _this = _super.call(this, def) || this;
                _this.variant = 0;
                _this.velMove = 0;
                _this.winning = false;
                _this.losing = false;
                _this.win = false;
                _this.lose = false;
                _this.countWinLose = 0;
                _this.xHit = 0;
                _this.def = def;
                _this.variant = variant;
                _this.sprite = new Engine.Sprite();
                _this.sprite.enabled = true;
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.xSize = Entities.Player.X_SIZE_BOX;
                _this.box.ySize = Entities.Player.Y_SIZE_BOX;
                _this.box.xOffset = -_this.box.xSize * 0.5;
                _this.box.yOffset = -_this.box.ySize;
                _this.onFire = onFire;
                _this.box.data = _this;
                Game.Scene.boxesBlobs.push(_this.box);
                if (onFire) {
                    Game.Scene.boxesFireEntities.push(_this.box);
                    _this.sprite.setRGBA(1, 1, 1, 0.7);
                }
                _this.animator = new Utils.Animator();
                _this.animator.listener = _this;
                _this.animator.sprite = _this.sprite;
                _this.initEmitters();
                _this.death = new Entities.BlobDeath();
                return _this;
            }
            Blob.prototype.initEmitters = function () {
                this.emitter0 = new Utils.Emitter();
                this.emitter0.enabled = this.onFire;
                this.emitter0.active = this.onFire;
                this.emitter0.emissionSteps = 0;
                this.emitter0.xMin = -9;
                this.emitter0.xMax = 9;
                this.emitter0.yMin = -6;
                this.emitter0.yMax = 1;
                this.emitter0.yVelMin = -0.4;
                this.emitter0.yVelMax = -0.8;
                this.emitter0.yAccelMin = 0.004;
                this.emitter0.yAccelMax = 0.008;
                this.emitter0.lifeParticleMin = 30;
                this.emitter0.lifeParticleMax = 60;
                for (var index = 0; index < 60; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(196, 139 + this.variant * 14, 4, 4, 4, 4, 3, 4);
                    this.emitter0.addParticle(particle);
                }
                this.emitter1 = new Utils.Emitter();
                this.emitter1.enabled = this.onFire;
                this.emitter1.active = this.onFire;
                this.emitter1.emissionSteps = 0;
                this.emitter1.xMin = -5;
                this.emitter1.xMax = 5;
                this.emitter1.yMin = -4;
                this.emitter1.yMax = -0;
                this.emitter1.yVelMin = -0.2;
                this.emitter1.yVelMax = -0.6;
                this.emitter1.yAccelMin = 0.002;
                this.emitter1.yAccelMax = 0.006;
                this.emitter1.lifeParticleMin = 30;
                this.emitter1.lifeParticleMax = 40;
                for (var index = 0; index < 40; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(196, 144 + this.variant * 14, 4, 4, 4, 4, 3, 4);
                    this.emitter1.addParticle(particle);
                }
            };
            //@ts-ignore
            Blob.prototype.onSetFrame = function (animator, animation, frame) {
            };
            Blob.prototype.onReset = function () {
                this.box.x = this.def.instance.x + Game.Scene.xSizeTile * 0.5;
                this.box.y = this.def.instance.y;
                this.xVel = 0;
                this.yVel = 0;
                this.sprite.xMirror = false;
                this.onGround = true;
                this.winning = false;
                this.losing = false;
                this.countWinLose = 0;
                this.win = false;
                this.lose = false;
                this.emitter0.active = this.onFire;
                this.emitter1.active = this.onFire;
                this.sprite.enabled = true;
                this.box.enabled = true;
                this.sprite.xMirror = this.def.flip.x;
                this.setState(Blob.STATE_STAND);
            };
            Blob.prototype.setState = function (nextState) {
                this.state = Blob.STATE_NONE;
                this.linkToState(nextState);
            };
            Blob.prototype.linkToState = function (nextState) {
                this.onStateExit(nextState);
                var oldState = this.state;
                this.state = nextState;
                this.onStateEnter(oldState);
            };
            Blob.prototype.checkStateLink = function (state, condition) {
                if (condition) {
                    this.linkToState(state);
                    return true;
                }
                return false;
            };
            Blob.prototype.checkStateLinks = function () {
                switch (this.state) {
                    case Blob.STATE_STAND:
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_FALL, !this.onGround))
                            break;
                        if (this.checkStateLink(Blob.STATE_ASCEND, this.canJump()))
                            break;
                        if (this.checkStateLink(Blob.STATE_WALK, this.xVel != 0))
                            break;
                        break;
                    case Blob.STATE_WALK:
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_FALL, !this.onGround))
                            break;
                        if (this.checkStateLink(Blob.STATE_ASCEND, this.canJump()))
                            break;
                        if (this.checkStateLink(Blob.STATE_STAND, this.xVel == 0))
                            break;
                        break;
                    case Blob.STATE_ASCEND:
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_FALL, this.yVel >= 0))
                            break;
                        break;
                    case Blob.STATE_FALL:
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_LANDING, this.onGround))
                            break;
                        break;
                    case Blob.STATE_LANDING: {
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_FALL, !this.onGround))
                            break;
                        if (this.checkStateLink(Blob.STATE_ASCEND, this.canJump()))
                            break;
                        if (this.checkStateLink(Blob.STATE_WALK, this.xVel != 0))
                            break;
                        if (this.checkStateLink(Blob.STATE_STAND, this.animator.ended))
                            break;
                    }
                }
            };
            //@ts-ignore
            Blob.prototype.onStateExit = function (nextState) {
                switch (this.state) {
                    case Blob.STATE_STAND:
                        break;
                    case Blob.STATE_WALK:
                        break;
                    case Blob.STATE_ASCEND:
                        break;
                    case Blob.STATE_FALL:
                        break;
                }
            };
            Blob.prototype.onStateEnter = function (oldState) {
                switch (this.state) {
                    case Blob.STATE_STAND:
                        this.animator.setAnimation(animationsStand[this.variant], false);
                        break;
                    case Blob.STATE_WALK:
                        this.animator.setAnimation(animationsMove[this.variant], false);
                        break;
                    case Blob.STATE_ASCEND:
                        this.animator.setAnimation(animationsJump[this.variant], false);
                        if (this.canJump() && oldState != Blob.STATE_ASCEND && oldState != Blob.STATE_FALL) {
                            this.yVel = -Entities.Player.VEL_JUMP;
                            Game.Resources.audioPlayerJump.play();
                        }
                        break;
                    case Blob.STATE_FALL:
                        if (oldState == Entities.Player.STATE_ASCEND) {
                            this.animator.setAnimation(animationsFall[this.variant], false);
                        }
                        else {
                            this.animator.setAnimation(animationsFallGround[this.variant], false);
                        }
                        break;
                    case Blob.STATE_LANDING:
                        this.animator.setAnimation(animationsLanding[this.variant], false);
                        break;
                    case Blob.STATE_DEAD:
                        Game.Resources.audioPlayerDead.play();
                        this.emitter0.active = false;
                        this.emitter1.active = false;
                        this.xVel = 0;
                        this.yVel = 0;
                        this.sprite.enabled = false;
                        this.box.enabled = false;
                        this.death.trigger(this.box.x, this.box.y - this.box.ySize * 0.5, this.variant);
                        //console.log("shake");
                        break;
                }
            };
            Blob.prototype.onMoveUpdate = function () {
                var contacts = this.box.cast(Game.Scene.boxesTiles, null, true, this.xVel, true, Engine.Box.LAYER_ALL);
                this.box.translate(contacts, true, this.xVel, true);
                this.xHit = contacts == null ? 0 : (this.xVel > 0 ? 1 : -1);
                this.yVel += Game.Level.GRAVITY;
                contacts = this.box.cast(Game.Scene.boxesTiles, null, false, this.yVel, true, Engine.Box.LAYER_ALL);
                this.box.translate(contacts, false, this.yVel, true);
                this.onGround = false;
                if (contacts != null) {
                    this.onGround = this.yVel > 0;
                    this.yVel = 0;
                }
                this.emitter0.x = this.box.x;
                this.emitter0.y = this.box.y;
                this.emitter1.x = this.box.x;
                this.emitter1.y = this.box.y;
            };
            Blob.prototype.onOverlapUpdate = function () {
                if (this.onFire && this.burnGoal) {
                }
                if (!this.winning && !this.losing) {
                    this.winning = this.getWinCondition();
                }
                if (!this.winning && !this.losing) {
                    this.losing = this.box.y > Game.Scene.ySizeLevel || this.box.collide(Game.Scene.boxesSpikes, null, true, 0, true, Engine.Box.LAYER_ALL) != null || this.getLossCondition();
                }
                if (this.winning) {
                    this.countWinLose += 1;
                    if (this.countWinLose >= Blob.STEPS_WAIT_WIN_LOSE) {
                        this.win = true;
                    }
                }
                if (this.losing) {
                    this.countWinLose += 1;
                    if (this.countWinLose >= Blob.STEPS_WAIT_WIN_LOSE) {
                        this.lose = true;
                    }
                }
            };
            Blob.prototype.onStepUpdate = function () {
                if (Game.Scene.nextSceneClass != null) {
                    this.xVel = 0;
                    this.box.y -= this.yVel;
                    this.yVel = 0;
                    this.emitter0.stop();
                    this.emitter1.stop();
                    return;
                }
                switch (this.state) {
                    case Blob.STATE_STAND:
                        this.move();
                        break;
                    case Blob.STATE_WALK:
                        this.move();
                        break;
                    case Blob.STATE_ASCEND:
                        this.move();
                        break;
                    case Blob.STATE_FALL:
                        this.move();
                        break;
                    case Blob.STATE_LANDING:
                        this.move();
                        break;
                }
                this.checkStateLinks();
            };
            Blob.prototype.canJump = function () {
                return false;
            };
            Blob.prototype.move = function () {
                if (this.getMoveDirection() < 0) {
                    this.sprite.xMirror = true;
                    this.xVel = -this.velMove;
                }
                else if (this.getMoveDirection() > 0) {
                    this.sprite.xMirror = false;
                    this.xVel = this.velMove;
                }
                else {
                    this.xVel = 0;
                }
            };
            Blob.prototype.onTimeUpdate = function () {
                var point = this.box.getExtrapolation(Game.Scene.boxesTiles, this.xVel, this.yVel, true, Engine.Box.LAYER_ALL);
                this.sprite.x = point.x;
                this.sprite.y = point.y;
            };
            Blob.prototype.getMoveDirection = function () {
                return 0;
            };
            Blob.prototype.getWinCondition = function () {
                return false;
            };
            Blob.prototype.getLossCondition = function () {
                return false;
            };
            Blob.STEPS_WAIT_WIN_LOSE = 30;
            Blob.VEL_JUMP = 5.0;
            Blob.X_SIZE_BOX = 14;
            Blob.Y_SIZE_BOX = 10;
            Blob.STATE_NONE = 0;
            Blob.STATE_STAND = 1;
            Blob.STATE_WALK = 2;
            Blob.STATE_ASCEND = 3;
            Blob.STATE_FALL = 4;
            Blob.STATE_LANDING = 5;
            Blob.STATE_DEAD = 6;
            return Blob;
        }(Entities.Entity));
        Entities.Blob = Blob;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var BlobDeath = /** @class */ (function (_super) {
            __extends(BlobDeath, _super);
            function BlobDeath() {
                var _this = _super.call(this) || this;
                _this.enabled = false;
                _this.count = 0;
                _this.sprites = new Array();
                for (var index = 0; index < 8; index += 1) {
                    _this.sprites.push(new Engine.Sprite());
                }
                return _this;
            }
            BlobDeath.prototype.trigger = function (x, y, variant) {
                this.enabled = true;
                this.variant = variant;
                for (var index = 0; index < 8; index += 1) {
                    var sprite = this.sprites[index];
                    sprite.x = x;
                    sprite.y = y;
                    sprite.setFull(true, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 7, 7, -3.5, -3.5, 22 + 153, 122 + 17 + 14 * variant, 7, 7);
                }
            };
            BlobDeath.prototype.onReset = function () {
                this.enabled = false;
                this.count = 0;
            };
            BlobDeath.prototype.onStepUpdate = function () {
                if (this.enabled) {
                    this.sprites[0].y -= BlobDeath.VEL;
                    this.sprites[1].x += BlobDeath.VEL * 0.85090352453;
                    this.sprites[1].y -= BlobDeath.VEL * 0.85090352453;
                    this.sprites[2].x += BlobDeath.VEL;
                    this.sprites[3].x += BlobDeath.VEL * 0.85090352453;
                    this.sprites[3].y += BlobDeath.VEL * 0.85090352453;
                    this.sprites[4].y += BlobDeath.VEL;
                    this.sprites[5].x -= BlobDeath.VEL * 0.85090352453;
                    this.sprites[5].y += BlobDeath.VEL * 0.85090352453;
                    this.sprites[6].x -= BlobDeath.VEL;
                    this.sprites[7].x -= BlobDeath.VEL * 0.85090352453;
                    this.sprites[7].y -= BlobDeath.VEL * 0.85090352453;
                    this.count += 1;
                    var ccc = 2;
                    if (this.count == 1 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 6, 6, -3.0, -3.0, 30 + 153, 122 + 17 + 14 * this.variant, 6, 6);
                        }
                    }
                    else if (this.count == 2 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 5, 5, -2.5, -2.5, 37 + 153, 122 + 17 + 14 * this.variant, 5, 5);
                        }
                    }
                    else if (this.count == 3 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 4, 4, -2.0, -2.0, 43 + 153, 122 + 17 + 14 * this.variant, 4, 4);
                        }
                    }
                    else if (this.count == 4 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 3, 3, -1.5, -1.5, 48 + 153, 122 + 17 + 14 * this.variant, 3, 3);
                        }
                    }
                    else if (this.count == 5 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 1, 1, -0.5, -0.5, 52 + 153, 122 + 17 + 14 * this.variant, 1, 1);
                        }
                    }
                    else if (this.count == 6 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].enabled = false;
                        }
                    }
                }
            };
            BlobDeath.prototype.onDrawPlayer = function () {
                if (this.enabled) {
                    for (var index = 0; index < 8; index += 1) {
                        this.sprites[index].render();
                    }
                }
            };
            BlobDeath.VEL = 2.5;
            return BlobDeath;
        }(Engine.Entity));
        Entities.BlobDeath = BlobDeath;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Block = /** @class */ (function (_super) {
            __extends(Block, _super);
            function Block(def) {
                var _this = _super.call(this, def) || this;
                _this.texture = Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0);
                _this.sprite = new Engine.Sprite();
                _this.sprite.x = def.instance.x;
                _this.sprite.y = def.instance.y - Game.Scene.xSizeTile;
                _this.box = new Engine.Box();
                _this.box.x = _this.sprite.x;
                _this.box.y = _this.sprite.y;
                _this.box.xSize = Game.Scene.xSizeTile;
                _this.ySize = _this.getProperty("ySize");
                Game.Scene.boxesTiles.push(_this.box);
                _this.emitter = new Utils.Emitter();
                _this.emitter.enabled = true;
                _this.emitter.emissionSteps = 2;
                _this.emitter.x = _this.sprite.x + Game.Scene.xSizeTile * 0.5;
                _this.emitter.y = _this.sprite.y;
                _this.emitter.xMin = -6;
                _this.emitter.xMax = 6;
                _this.emitter.yMin = 2;
                _this.emitter.yMax = 3;
                _this.emitter.yVelMin = 0.8;
                _this.emitter.yVelMax = 1.4;
                _this.emitter.yAccelMin = 0.004;
                _this.emitter.yAccelMax = 0.008;
                _this.emitter.lifeParticleMin = 30;
                _this.emitter.lifeParticleMax = 40;
                for (var index = 0; index < 60; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(53, 117, 4, 4, 2, 2, 2, 2);
                    _this.emitter.addParticle(particle);
                }
                return _this;
            }
            Block.prototype.onReset = function () {
                this.sprite.enabled = true;
                this.box.enabled = true;
                this.box.renderable = true;
                this.countYSize = this.ySize;
                this.disappearing = false;
                this.emitter.active = false;
                this.setForm();
            };
            Block.prototype.setForm = function () {
                var ySize = Math.ceil(this.countYSize);
                var yTexture = 3 + (this.disappearing ? 19 : 0);
                this.sprite.setFull(this.sprite.enabled, false, this.texture, Game.Scene.xSizeTile, ySize, 0, 0, 79 + (16 - ySize) * 19, yTexture, Game.Scene.xSizeTile, ySize);
                this.box.ySize = ySize;
            };
            Block.prototype.onOverlapUpdate = function () {
                if (!this.disappearing) {
                    var overlaps = this.box.collide(Game.Scene.boxesFireEntities, null, false, -1, false, Engine.Box.LAYER_ALL);
                    overlaps = this.box.collide(Game.Scene.boxesFireEntities, overlaps, false, 1, false, Engine.Box.LAYER_ALL);
                    //overlaps = this.box.collide(Scene.boxesEntities, overlaps, true, -1, false, Engine.Box.LAYER_ALL);
                    //overlaps = this.box.collide(Scene.boxesEntities, overlaps, true, 1, false, Engine.Box.LAYER_ALL);
                    if (overlaps != null) {
                        if (overlaps[0].other.data.variant == 0) {
                            Game.Resources.audioPlayerIce.play();
                        }
                        this.disappearing = true;
                        this.emitter.active = true;
                    }
                }
            };
            Block.prototype.onStepUpdate = function () {
                if (Game.Scene.nextSceneClass != null) {
                    this.emitter.stop();
                    return;
                }
                if (this.box.enabled && this.disappearing) {
                    this.countYSize -= Block.VEL_DISAPPEAR;
                    if (this.countYSize < 0) {
                        this.countYSize = 0;
                    }
                    this.setForm();
                    if (this.countYSize == 0) {
                        this.sprite.enabled = false;
                        this.box.enabled = false;
                        this.box.renderable = false;
                        this.emitter.active = false;
                    }
                }
            };
            Block.prototype.onTimeUpdate = function () {
                if (Game.Scene.nextSceneClass != null) {
                    return;
                }
                if (this.sprite.enabled) {
                    this.sprite.setRGBA(1, 1, 1, (this.countYSize + (this.disappearing ? Engine.System.stepExtrapolation : 0)) / this.ySize);
                }
            };
            Block.prototype.onDrawObjects = function () {
                this.sprite.render();
            };
            Block.VEL_DISAPPEAR = 0.23;
            return Block;
        }(Entities.Entity));
        Entities.Block = Block;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
var Utils;
(function (Utils) {
    var Particle = /** @class */ (function (_super) {
        __extends(Particle, _super);
        function Particle() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.index = 0;
            _this.life = 0;
            _this.xOrigin = 0;
            _this.yOrigin = 0;
            _this.x = 0;
            _this.y = 0;
            _this.xVel = 0;
            _this.yVel = 0;
            _this.xAccel = 0;
            _this.yAccel = 0;
            _this.countSteps = 0;
            return _this;
        }
        Particle.prototype.reset = function () {
            this.enabled = false;
            this.sprite.enabled = false;
        };
        Particle.prototype.emit = function (index, life, xOrigin, yOrigin, x, y, xVel, yVel, xAccel, yAccel) {
            this.enabled = true;
            this.sprite.enabled = true;
            this.sprite.setRGBA(this.sprite.red, this.sprite.green, this.sprite.blue, 1);
            this.index = index;
            this.life = life;
            this.xOrigin = xOrigin;
            this.yOrigin = yOrigin;
            this.x = x;
            this.y = y;
            this.xVel = xVel;
            this.yVel = yVel;
            this.xAccel = xAccel;
            this.yAccel = yAccel;
            this.countSteps = 0;
        };
        Particle.prototype.onReset = function () {
            this.reset();
        };
        Particle.prototype.onStepUpdate = function () {
            if (this.enabled && this.countSteps < this.life) {
                this.x += this.xVel;
                this.y += this.yVel;
                this.xVel += this.xAccel;
                this.yVel += this.yAccel;
                this.countSteps += 1;
                if (this.countSteps >= this.life) {
                    this.enabled = false;
                }
            }
        };
        Particle.prototype.onDrawParticlesBack = function () {
            if (!this.front) {
                this.drawParticles();
            }
        };
        Particle.prototype.onDrawParticlesFront = function () {
            if (this.front) {
                this.drawParticles();
            }
        };
        Particle.prototype.drawParticles = function () {
            if (this.enabled) {
                this.sprite.x = this.xOrigin + this.x + this.xVel * Engine.System.stepExtrapolation;
                this.sprite.y = this.yOrigin + this.y + this.yVel * Engine.System.stepExtrapolation;
                this.sprite.setRGBA(this.sprite.red, this.sprite.green, this.sprite.blue, 1 - (this.countSteps + Engine.System.stepExtrapolation) / this.life);
                this.sprite.render();
            }
        };
        return Particle;
    }(Engine.Entity));
    Utils.Particle = Particle;
})(Utils || (Utils = {}));
///<reference path="Entity.ts"/>
///<reference path="../Utils/Particle.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var BoxParticle = /** @class */ (function (_super) {
            __extends(BoxParticle, _super);
            function BoxParticle(xTexture, yTexture, xSizeTexture, ySizeTexture, xSizeMin, xSizeMax, ySizeMin, ySizeMax) {
                var _this = _super.call(this) || this;
                _this.changed = false;
                _this.xTextureNext = 0;
                _this.yTextureNext = 0;
                _this.sprite = new Engine.Sprite();
                _this.xSizeMin = xSizeMin;
                _this.xSizeMax = xSizeMax;
                _this.ySizeMin = ySizeMin;
                _this.ySizeMax = ySizeMax;
                _this.xSizeTexture = xSizeTexture;
                _this.ySizeTexture = ySizeTexture;
                _this.setGraph(xTexture, yTexture);
                return _this;
            }
            BoxParticle.prototype.change = function (xTexture, yTexture) {
                this.changed = true;
                this.xTextureNext = xTexture;
                this.yTextureNext = yTexture;
            };
            BoxParticle.prototype.setGraph = function (xTexture, yTexture) {
                this.sprite.setFull(false, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 0, 0, 0, 0, xTexture, yTexture, this.xSizeTexture, this.ySizeTexture);
            };
            BoxParticle.prototype.emit = function (index, life, xOrigin, yOrigin, x, y, xVel, yVel, xAccel, yAccel) {
                _super.prototype.emit.call(this, index, life, xOrigin, yOrigin, x, y, xVel, yVel, xAccel, yAccel);
                if (this.changed) {
                    this.setGraph(this.xTextureNext, this.yTextureNext);
                    this.changed = false;
                }
                //this.sprite.
                this.sprite.xSize = this.xSize = this.xSizeMin + (this.xSizeMax - this.xSizeMin) * Math.random();
                this.sprite.ySize = this.ySize = this.xSize;
                //this.sprite.ySize = this.ySize = this.ySizeMin + (this.ySizeMax - this.ySizeMin) * Math.random();
                this.sprite.xOffset = -this.sprite.xSize * 0.5;
                this.sprite.yOffset = -this.sprite.ySize * 0.5;
            };
            BoxParticle.prototype.onStepUpdate = function () {
                _super.prototype.onStepUpdate.call(this);
                if (this.enabled && this.countSteps < this.life) {
                    this.sprite.xSize = Math.ceil(this.xSize * ((this.life - this.countSteps) / this.life));
                    this.sprite.ySize = Math.ceil(this.ySize * ((this.life - this.countSteps) / this.life));
                    //this.ySize += 0.05;
                    //this.sprite.ySize = Math.ceil(this.ySize);
                    this.sprite.xOffset = -this.sprite.xSize * 0.5;
                    this.sprite.yOffset = -this.sprite.ySize * 0.5;
                }
            };
            BoxParticle.prototype.drawParticles = function () {
                if (!this.enabled && this.changed) {
                    this.setGraph(this.xTextureNext, this.yTextureNext);
                    this.changed = false;
                }
                _super.prototype.drawParticles.call(this);
            };
            return BoxParticle;
        }(Utils.Particle));
        Entities.BoxParticle = BoxParticle;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Blob.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var EnemyBlob = /** @class */ (function (_super) {
            __extends(EnemyBlob, _super);
            function EnemyBlob(def, onFire, variant, patrol) {
                var _this = _super.call(this, def, onFire, variant) || this;
                _this.burnGoal = onFire;
                _this.patrol = patrol;
                _this.velMove = _this.getProperty("vel");
                Game.Scene.boxesEnemies.push(_this.box);
                if (_this.patrol) {
                    _this.patrolBox = new Engine.Box();
                    _this.patrolBox.enabled = true;
                    _this.patrolBox.xSize = 1;
                    _this.patrolBox.ySize = 1;
                }
                return _this;
            }
            EnemyBlob.prototype.onReset = function () {
                _super.prototype.onReset.call(this);
                this.direction = this.sprite.xMirror ? -1 : 1;
            };
            EnemyBlob.prototype.onMoveUpdate = function () {
                _super.prototype.onMoveUpdate.call(this);
                if (this.xHit != 0) {
                    this.direction *= -1;
                }
                if (this.patrol && this.direction != 0 && this.state != EnemyBlob.STATE_ASCEND && this.state != EnemyBlob.STATE_FALL) {
                    this.patrolBox.x = this.box.x;
                    this.patrolBox.y = this.box.y;
                    if (this.direction > 0) {
                        this.patrolBox.x += this.box.xSize * 0.5;
                    }
                    else {
                        this.patrolBox.x -= (this.box.xSize * 0.5 + 1);
                    }
                    var overlaps = this.patrolBox.collide(Game.Scene.boxesTiles, null, true, 0, true, Engine.Box.LAYER_ALL);
                    if (overlaps == null) {
                        this.direction *= -1;
                    }
                }
            };
            EnemyBlob.prototype.onDrawObjects = function () {
                this.sprite.render();
            };
            EnemyBlob.prototype.getMoveDirection = function () {
                return this.direction;
            };
            return EnemyBlob;
        }(Entities.Blob));
        Entities.EnemyBlob = EnemyBlob;
        var FreeEnemyBlob = /** @class */ (function (_super) {
            __extends(FreeEnemyBlob, _super);
            function FreeEnemyBlob(def) {
                return _super.call(this, def, false, 1, false) || this;
            }
            return FreeEnemyBlob;
        }(EnemyBlob));
        Entities.FreeEnemyBlob = FreeEnemyBlob;
        var PatrolEnemyBlob = /** @class */ (function (_super) {
            __extends(PatrolEnemyBlob, _super);
            function PatrolEnemyBlob(def) {
                return _super.call(this, def, false, 2, true) || this;
            }
            return PatrolEnemyBlob;
        }(EnemyBlob));
        Entities.PatrolEnemyBlob = PatrolEnemyBlob;
        var FireFreeEnemyBlob = /** @class */ (function (_super) {
            __extends(FireFreeEnemyBlob, _super);
            function FireFreeEnemyBlob(def) {
                return _super.call(this, def, true, 1, false) || this;
            }
            return FireFreeEnemyBlob;
        }(EnemyBlob));
        Entities.FireFreeEnemyBlob = FireFreeEnemyBlob;
        var FirePatrolEnemyBlob = /** @class */ (function (_super) {
            __extends(FirePatrolEnemyBlob, _super);
            function FirePatrolEnemyBlob(def) {
                return _super.call(this, def, true, 2, true) || this;
            }
            return FirePatrolEnemyBlob;
        }(EnemyBlob));
        Entities.FirePatrolEnemyBlob = FirePatrolEnemyBlob;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
var Utils;
(function (Utils) {
    var Button = /** @class */ (function (_super) {
        __extends(Button, _super);
        function Button() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.bounds2 = null;
            _this.keys = new Array();
            _this._enabled = false;
            _this._selected = false;
            _this._used = false;
            _this._interactable = true;
            _this._url = null;
            return _this;
        }
        Button.prototype.setEnabled = function (value) {
            this._enabled = value;
            if (value) {
                this.onEnable();
            }
            else {
                if (this._selected) {
                    this._selected = false;
                    if (this._url != null) {
                        Engine.LinkManager.remove(this, this._url);
                    }
                    this.onPointerExit();
                }
                this.onDisable();
            }
        };
        Object.defineProperty(Button.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "selected", {
            get: function () {
                return this._selected;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "used", {
            get: function () {
                return this._used;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "interactable", {
            get: function () {
                return this._interactable;
            },
            set: function (value) {
                this._interactable = value;
                if (!value && this._selected) {
                    this._selected = false;
                    if (this._url != null) {
                        Engine.LinkManager.remove(this, this._url);
                    }
                    this.onPointerExit();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "url", {
            get: function () {
                return this._url;
            },
            set: function (value) {
                if (this._url != null) {
                    Engine.LinkManager.remove(this, this._url);
                }
                this._url = value;
                if (this._selected && this._url != null) {
                    Engine.LinkManager.add(this, this._url);
                }
            },
            enumerable: true,
            configurable: true
        });
        Button.prototype.onEnable = function () {
            if (this.onEnableDelegate != null) {
                this.onEnableDelegate.call(this.listener);
            }
        };
        Button.prototype.onDisable = function () {
            if (this.onDisableDelegate != null) {
                this.onDisableDelegate.call(this.listener);
            }
        };
        Button.prototype.onPointerEnter = function () {
            if (this.onPointerEnterDelegate != null) {
                this.onPointerEnterDelegate.call(this.listener);
            }
        };
        Button.prototype.onPointerExit = function () {
            if (this.onPointerExitDelegate != null) {
                this.onPointerExitDelegate.call(this.listener);
            }
        };
        Button.prototype.onAction = function () {
            if (this.onActionDelegate != null) {
                this.onActionDelegate.call(this.listener);
            }
        };
        Button.prototype.onClearScene = function () {
            if (this.url != null) {
                Engine.LinkManager.remove(this, this._url);
            }
        };
        Button.prototype.theBounds = function () {
            if (this.bounds2 != null) {
                return this.bounds2;
            }
            return this.bounds;
        };
        Button.prototype.onStepUpdate = function () {
            this._used = false;
            if (this._enabled && this._interactable) {
                if (!this._selected && this.theBounds().selected) {
                    this._selected = true;
                    if (this.url != null) {
                        Engine.LinkManager.add(this, this._url);
                    }
                    this.onPointerEnter();
                }
                else if (this._selected && !this.theBounds().selected) {
                    this._selected = false;
                    if (this.url != null) {
                        Engine.LinkManager.remove(this, this._url);
                    }
                    this.onPointerExit();
                }
                if (this.theBounds().clicked) {
                    this._used = true;
                    this.onAction();
                }
                else {
                    for (var _i = 0, _a = this.keys; _i < _a.length; _i++) {
                        var key = _a[_i];
                        if (Engine.Keyboard.pressed(key)) {
                            this._used = true;
                            this.onAction();
                            break;
                        }
                    }
                }
            }
            if (this.selected && this.onPointerStayDelegate != null) {
                this.onPointerStayDelegate.call(this.listener);
            }
        };
        return Button;
    }(Engine.Entity));
    Utils.Button = Button;
})(Utils || (Utils = {}));
///<reference path="../Utils/Button.ts"/>
var Game;
(function (Game) {
    var ArrowButton = /** @class */ (function (_super) {
        __extends(ArrowButton, _super);
        function ArrowButton() {
            var _this = _super.call(this) || this;
            _this.arrowsEnabled = true;
            _this.xOffset = 0;
            _this.yOffset = 0;
            _this.arrowLeft = new Utils.Text();
            _this.arrowLeft.owner = _this;
            _this.arrowLeft.str = ">";
            _this.arrowLeft.font = Game.Font.instance;
            _this.arrowLeft.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.arrowLeft.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.arrowLeft.xAlignBounds = Utils.AnchorAlignment.END;
            _this.arrowLeft.yAlignBounds = Utils.AnchorAlignment.START;
            _this.arrowRight = new Utils.Text();
            _this.arrowRight.owner = _this;
            _this.arrowRight.str = "<";
            _this.arrowRight.font = Game.Font.instance;
            _this.arrowRight.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.arrowRight.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.arrowRight.xAlignBounds = Utils.AnchorAlignment.START;
            _this.arrowRight.yAlignBounds = Utils.AnchorAlignment.START;
            return _this;
        }
        ArrowButton.prototype.setEnabled = function (value) {
            _super.prototype.setEnabled.call(this, value);
        };
        ArrowButton.prototype.onEnable = function () {
            _super.prototype.onEnable.call(this);
            this.arrowLeft.enabled = false && this.arrowsEnabled;
            this.arrowRight.enabled = false && this.arrowsEnabled;
        };
        ArrowButton.prototype.onDisable = function () {
            _super.prototype.onDisable.call(this);
            this.arrowLeft.enabled = false && this.arrowsEnabled;
            this.arrowRight.enabled = false && this.arrowsEnabled;
        };
        ArrowButton.prototype.onPointerEnter = function () {
            _super.prototype.onPointerEnter.call(this);
            this.arrowLeft.enabled = true && this.arrowsEnabled;
            this.arrowRight.enabled = true && this.arrowsEnabled;
        };
        ArrowButton.prototype.onPointerExit = function () {
            _super.prototype.onPointerExit.call(this);
            this.arrowLeft.enabled = false && this.arrowsEnabled;
            this.arrowRight.enabled = false && this.arrowsEnabled;
        };
        ArrowButton.prototype.onTimeUpdate = function () {
            if (this.selected) {
                this.arrowLeft.pinned = this.bounds.pinned;
                this.arrowRight.pinned = this.bounds.pinned;
                this.arrowLeft.xAligned = this.bounds.x - Game.Font.instance.xSeparation - this.xOffset;
                this.arrowLeft.yAligned = this.bounds.y + this.yOffset;
                this.arrowRight.xAligned = this.bounds.x + this.bounds.xSize * this.bounds.xScale + Game.Font.instance.xSeparation + this.xOffset;
                this.arrowRight.yAligned = this.bounds.y + this.yOffset;
            }
        };
        return ArrowButton;
    }(Utils.Button));
    Game.ArrowButton = ArrowButton;
})(Game || (Game = {}));
///<reference path="ArrowButton.ts"/>
var Game;
(function (Game) {
    var BasicButton = /** @class */ (function (_super) {
        __extends(BasicButton, _super);
        function BasicButton(sprite) {
            var _this = _super.call(this) || this;
            _this.anchor = new Utils.Anchor();
            _this.anchor.owner = _this;
            _this.anchor.bounds = sprite;
            _this.sprite = sprite;
            _this.bounds = _this.sprite;
            return _this;
        }
        BasicButton.prototype.onDrawButtons = function () {
            this.sprite.render();
        };
        return BasicButton;
    }(Game.ArrowButton));
    Game.BasicButton = BasicButton;
})(Game || (Game = {}));
///<reference path="../System/BasicButton.ts"/>
var Game;
(function (Game) {
    var ExitButton = /** @class */ (function (_super) {
        __extends(ExitButton, _super);
        function ExitButton() {
            var _this = _super.call(this) || this;
            _this.sprite = new Engine.Sprite();
            _this.sprite.setFull(true, true, Game.Resources.texture, 34, 15, 0, 0, 318 + 22 * 3, 365, 34, 15);
            _this.bounds = _this.sprite;
            _this.anchor = new Utils.Anchor();
            _this.anchor.owner = _this;
            _this.anchor.bounds = _this.bounds;
            _this.anchor.xAlignBounds = Utils.AnchorAlignment.END;
            _this.anchor.xAlignView = Utils.AnchorAlignment.END;
            _this.anchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.yAlignView = Utils.AnchorAlignment.START;
            _this.anchor.xAligned = -Game.X_BUTTONS;
            _this.anchor.yAligned = Game.Y_BUTTONS;
            _this.yOffset = 4;
            _this.keys = [Engine.Keyboard.ESC];
            _this.enabled = true;
            return _this;
        }
        ExitButton.prototype.onDrawButtons = function () {
            this.sprite.render();
        };
        return ExitButton;
    }(Game.ArrowButton));
    Game.ExitButton = ExitButton;
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Goal = /** @class */ (function (_super) {
            __extends(Goal, _super);
            function Goal(def) {
                var _this = _super.call(this, def) || this;
                _this.variant = -1;
                _this.final = false;
                _this.finalCount = 0;
                Goal.instance = _this;
                Game.Level.goals += 1;
                _this.sprite = new Engine.Sprite;
                _this.sprite.setFull(true, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 26, 11, -13, -11, 48, 97, 26, 11);
                _this.sprite.x = def.instance.x + Game.Scene.xSizeTile * 0.5;
                _this.sprite.y = def.instance.y;
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.x = _this.sprite.x;
                _this.box.y = _this.sprite.y;
                _this.box.xSize = 24;
                _this.box.ySize = 8;
                _this.box.xOffset = -_this.box.xSize * 0.5;
                _this.box.yOffset = -_this.box.ySize;
                _this.initEmitters();
                _this.final = _this.getProperty("final");
                return _this;
            }
            Goal.prototype.initEmitters = function () {
                this.emitter0 = new Utils.Emitter();
                this.emitter0.enabled = true;
                this.emitter0.emissionSteps = 0;
                this.emitter0.x = this.sprite.x;
                this.emitter0.y = this.sprite.y - 2.5;
                this.emitter0.xMin = -8;
                this.emitter0.xMax = 8;
                this.emitter0.yMin = -5;
                this.emitter0.yMax = -3;
                this.emitter0.yVelMin = -0.6;
                this.emitter0.yVelMax = -1.0;
                this.emitter0.yAccelMin = -0.004;
                this.emitter0.yAccelMax = -0.008;
                this.emitter0.lifeParticleMin = 30;
                this.emitter0.lifeParticleMax = 70;
                for (var index = 0; index < 60; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(196, 139, 4, 4, 4, 4, 3, 4);
                    particle.front = true;
                    this.emitter0.addParticle(particle);
                }
                this.emitter1 = new Utils.Emitter();
                this.emitter1.enabled = true;
                this.emitter1.emissionSteps = 0;
                this.emitter1.x = this.sprite.x;
                this.emitter1.y = this.sprite.y - 2.5;
                this.emitter1.xMin = -4;
                this.emitter1.xMax = 4;
                this.emitter1.yMin = -5;
                this.emitter1.yMax = -3;
                this.emitter1.yVelMin = -0.4;
                this.emitter1.yVelMax = -0.8;
                this.emitter1.yAccelMin = -0.002;
                this.emitter1.yAccelMax = -0.006;
                this.emitter1.lifeParticleMin = 30;
                this.emitter1.lifeParticleMax = 60;
                for (var index = 0; index < 40; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(196, 144, 4, 4, 4, 4, 3, 4);
                    particle.front = true;
                    this.emitter1.addParticle(particle);
                }
            };
            Goal.prototype.onReset = function () {
                this.box.enabled = true;
                this.emitter0.active = false;
                this.emitter1.active = false;
                this.variant = -1;
                if (this.getProperty("on")) {
                    this.variant = 0;
                    this.emitter0.active = true;
                    this.emitter1.active = true;
                    for (var _i = 0, _a = this.emitter0.particles; _i < _a.length; _i++) {
                        var particle = _a[_i];
                        particle.change(196, 139 + 14 * this.variant);
                    }
                    for (var _b = 0, _c = this.emitter1.particles; _b < _c.length; _b++) {
                        var particle = _c[_b];
                        particle.change(196, 144 + 14 * this.variant);
                    }
                }
            };
            Goal.prototype.onOverlapUpdate = function () {
                if (this.final) {
                    if (this.emitter0.active) {
                        this.finalCount += 1;
                        if (this.finalCount == 120) {
                            this.finalCount = 0;
                            this.emitter0.active = false;
                            this.emitter1.active = false;
                        }
                    }
                    else if (this.box.collide(Game.Scene.boxesFireEntities, null, true, 0, true, Engine.Box.LAYER_ALL)) {
                        Game.Resources.audioPlayerFire.play();
                        this.emitter0.active = true;
                        this.emitter1.active = true;
                    }
                }
                else if (Game.Level.countGoals != Game.Level.goals) {
                    var overlaps = this.box.collide(Game.Scene.boxesFireEntities, null, true, 0, true, Engine.Box.LAYER_ALL);
                    if (overlaps != null) {
                        for (var _i = 0, overlaps_1 = overlaps; _i < overlaps_1.length; _i++) {
                            var overlap = overlaps_1[_i];
                            var blob = overlap.other.data;
                            if (this.variant != blob.variant) {
                                Game.Resources.audioPlayerFire.play();
                                if (this.variant == 0) {
                                    Game.Level.countGoals -= 1;
                                }
                                if (blob.variant == 0) {
                                    Game.Level.countGoals += 1;
                                }
                                this.variant = blob.variant;
                                this.emitter0.active = true;
                                this.emitter1.active = true;
                                for (var _a = 0, _b = this.emitter0.particles; _a < _b.length; _a++) {
                                    var particle = _b[_a];
                                    particle.change(196, 139 + 14 * this.variant);
                                }
                                for (var _c = 0, _d = this.emitter1.particles; _c < _d.length; _c++) {
                                    var particle = _d[_c];
                                    particle.change(196, 144 + 14 * this.variant);
                                }
                                if (Game.Level.countGoals == Game.Level.goals) {
                                    break;
                                }
                            }
                        }
                    }
                }
            };
            Goal.prototype.onStepUpdate = function () {
                if (Game.Scene.nextSceneClass != null) {
                    this.emitter0.stop();
                    this.emitter1.stop();
                }
            };
            Goal.prototype.onDrawGoal = function () {
                this.sprite.render();
                //this.box.render();
            };
            return Goal;
        }(Entities.Entity));
        Entities.Goal = Goal;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var JumpTutorial = /** @class */ (function () {
            //@ts-ignore
            function JumpTutorial(def) {
                var text0 = new Utils.Text();
                text0.font = Game.Font.instance;
                text0.scale = 1;
                text0.enabled = true;
                text0.pinned = true;
                text0.str = Game.IS_EDGE ? "H - UP ARROW OR SPACE" : "H - W - UP ARROW OR SPACE";
                text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.xAligned = 0;
                text0.yAligned = -Engine.Renderer.ySizeView * 0.25 - 14;
                var text1 = new Utils.Text();
                text1.font = Game.Font.instance;
                text1.scale = 1;
                text1.enabled = true;
                text1.pinned = true;
                text1.str = "TO JUMP";
                text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.xAligned = 0;
                text1.yAligned = text0.y + 13;
            }
            return JumpTutorial;
        }());
        Entities.JumpTutorial = JumpTutorial;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var LevelText = /** @class */ (function () {
        function LevelText() {
            var text0 = new Utils.Text();
            text0.font = Game.Font.instance;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = "LEVEL " + (Game.Level.index < 10 ? "0" : "") + Game.Level.index;
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.START;
            text0.yAlignView = Utils.AnchorAlignment.START;
            text0.xAligned = 0;
            text0.yAligned = Game.Y_BUTTONS + 4;
        }
        return LevelText;
    }());
    Game.LevelText = LevelText;
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var MoveTutorial = /** @class */ (function () {
            //@ts-ignore
            function MoveTutorial(def) {
                var text0 = new Utils.Text();
                text0.font = Game.Font.instance;
                text0.scale = 1;
                text0.enabled = true;
                text0.pinned = true;
                text0.str = Game.IS_EDGE ? "ARROW KEYS" : "A-D OR ARROW KEYS";
                text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.xAligned = 0;
                text0.yAligned = -Engine.Renderer.ySizeView * 0.25 + 24 + 8;
                var text1 = new Utils.Text();
                text1.font = Game.Font.instance;
                text1.scale = 1;
                text1.enabled = true;
                text1.pinned = true;
                text1.str = "TO MOVE";
                text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.xAligned = 0;
                text1.yAligned = text0.y + 13;
            }
            return MoveTutorial;
        }());
        Entities.MoveTutorial = MoveTutorial;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Blob.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Player = /** @class */ (function (_super) {
            __extends(Player, _super);
            function Player(def) {
                var _this = _super.call(this, def, true, 0) || this;
                Player.instance = _this;
                _this.velMove = Player.VEL_MOVE;
                _this.burnGoal = true;
                return _this;
            }
            Object.defineProperty(Player, "x", {
                get: function () {
                    return this.instance.sprite.x;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Player, "y", {
                get: function () {
                    return this.instance.sprite.y;
                },
                enumerable: true,
                configurable: true
            });
            Player.prototype.onDrawPlayer = function () {
                this.sprite.render();
                //this.box.render();
            };
            Player.prototype.canJump = function () {
                return Game.Control.jump;
            };
            Player.prototype.getMoveDirection = function () {
                return Game.Control.left ? -1 : (Game.Control.right ? 1 : 0);
            };
            Player.prototype.getWinCondition = function () {
                return Game.Level.countGoals == Game.Level.goals;
            };
            Player.prototype.getLossCondition = function () {
                return this.box.collide(Game.Scene.boxesEnemies, null, true, 0, true, Engine.Box.LAYER_ALL) != null;
            };
            Player.VEL_MOVE = 1.3;
            return Player;
        }(Entities.Blob));
        Entities.Player = Player;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../System/BasicButton.ts"/>
var Game;
(function (Game) {
    var ResetButton = /** @class */ (function (_super) {
        __extends(ResetButton, _super);
        function ResetButton() {
            var _this = _super.call(this) || this;
            _this.sprite = new Engine.Sprite();
            _this.sprite.setFull(true, true, Game.Resources.texture, 21, 15, 0, 0, 318 + 22 * 2, 365, 21, 15);
            _this.bounds = _this.sprite;
            _this.anchor = new Utils.Anchor();
            _this.anchor.owner = _this;
            _this.anchor.bounds = _this.bounds;
            _this.anchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.xAlignView = Utils.AnchorAlignment.START;
            _this.anchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.yAlignView = Utils.AnchorAlignment.START;
            _this.anchor.xAligned = Game.X_BUTTONS + 35;
            _this.anchor.yAligned = Game.Y_BUTTONS;
            _this.yOffset = 4;
            _this.keys = [Engine.Keyboard.R];
            _this.enabled = true;
            return _this;
        }
        ResetButton.prototype.onDrawButtons = function () {
            this.sprite.render();
        };
        return ResetButton;
    }(Game.ArrowButton));
    Game.ResetButton = ResetButton;
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var ResetTutorial = /** @class */ (function () {
            //@ts-ignore
            function ResetTutorial(def) {
                var text0 = new Utils.Text();
                text0.font = Game.Font.instance;
                text0.scale = 1;
                text0.enabled = true;
                text0.pinned = true;
                text0.str = "PRESS R TO RESET";
                text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.xAligned = 0;
                text0.yAligned = -Engine.Renderer.ySizeView * 0.25 - 18;
            }
            return ResetTutorial;
        }());
        Entities.ResetTutorial = ResetTutorial;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../System/BasicButton.ts"/>
var Game;
(function (Game) {
    var SoundButton = /** @class */ (function (_super) {
        __extends(SoundButton, _super);
        function SoundButton() {
            var _this = _super.call(this) || this;
            _this.preserved = true;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.fif();
            _this.bounds = _this.sprite;
            _this.anchor = new Utils.Anchor();
            _this.anchor.owner = _this;
            _this.anchor.bounds = _this.bounds;
            _this.anchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.xAlignView = Utils.AnchorAlignment.START;
            _this.anchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.yAlignView = Utils.AnchorAlignment.START;
            _this.anchor.xAligned = Game.X_BUTTONS;
            _this.anchor.yAligned = Game.Y_BUTTONS;
            _this.yOffset = 4;
            _this.keys = [Engine.Keyboard.M];
            _this.enabled = true;
            return _this;
        }
        SoundButton.prototype.fif = function () {
            this.sprite.setFull(this.sprite.enabled, true, Game.Resources.texture, 21, 15, 0, 0, 318 + 22 * (Engine.AudioManager.muted ? 0 : 1), 365, 21, 15);
        };
        SoundButton.prototype.onAction = function () {
            _super.prototype.onAction.call(this);
            Engine.AudioManager.muted = !Engine.AudioManager.muted;
            this.fif();
        };
        SoundButton.prototype.onDrawButtons = function () {
            this.sprite.render();
        };
        return SoundButton;
    }(Game.ArrowButton));
    Game.SoundButton = SoundButton;
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Spike = /** @class */ (function (_super) {
            __extends(Spike, _super);
            function Spike(def) {
                var _this = _super.call(this, def) || this;
                _this.sprite = new Engine.Sprite();
                _this.sprite.x = def.instance.x;
                _this.sprite.y = def.instance.y - 16;
                Game.Scene.spritesTiles.push(_this.sprite);
                _this.box0 = new Engine.Box();
                _this.box0.enabled = true;
                _this.box0.renderable = true;
                _this.box0.x = def.instance.x;
                _this.box0.y = def.instance.y - 16;
                Game.Scene.boxesSpikes.push(_this.box0);
                _this.box1 = new Engine.Box();
                _this.box1.enabled = true;
                _this.box1.renderable = true;
                _this.box1.x = def.instance.x;
                _this.box1.y = def.instance.y - 16;
                Game.Scene.boxesSpikes.push(_this.box1);
                switch (_this.getProperty("angle")) {
                    case 0:
                        _this.sprite.setFull(true, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 16, 16, 0, 0, 3, 136, 16, 16);
                        _this.box0.x += 3;
                        _this.box0.y += 9;
                        _this.box0.xSize = 11;
                        _this.box0.ySize = 7;
                        _this.box1.x += 6;
                        _this.box1.y += 3;
                        _this.box1.xSize = 5;
                        _this.box1.ySize = 8;
                        break;
                }
                return _this;
            }
            Spike.prototype.onDrawObjects = function () {
                //this.sprite.render();
                //this.box0.render();
                //this.box1.render();
            };
            return Spike;
        }(Entities.Entity));
        Entities.Spike = Spike;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Switch = /** @class */ (function (_super) {
            __extends(Switch, _super);
            function Switch(def) {
                var _this = _super.call(this, def) || this;
                _this.lastFrame = false;
                _this.sprite = new Engine.Sprite();
                _this.sprite.enabled = true;
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.xSize = 10;
                _this.box.ySize = 9;
                _this.variant = _this.getProperty("variant");
                Game.Scene.switches.push(_this);
                return _this;
            }
            Switch.prototype.onReset = function () {
                this.setPressed(this.getProperty("pressed"));
                this.yVel = 0;
                this.sprite.x = this.def.instance.x;
                this.sprite.y = this.def.instance.y - 16;
                this.box.x = this.sprite.x + 3;
                this.box.y = this.sprite.y + 7;
            };
            Switch.prototype.setPressed = function (pressed) {
                this.pressed = pressed;
                this.box.enabled = !pressed;
                this.sprite.setFull(true, false, Game.Resources.texture, 16, 16, 0, 0, 421 + 19 * 2 * (pressed ? 1 : 0), 3 + 19 * this.variant, 16, 16);
            };
            Switch.prototype.onMoveUpdate = function () {
                this.yVel += Game.Level.GRAVITY;
                var contacts = this.box.cast(Game.Scene.boxesTiles, null, false, this.yVel, true, Engine.Box.LAYER_ALL);
                this.box.translate(contacts, false, this.yVel, true);
                if (contacts != null) {
                    this.yVel = 0;
                }
            };
            Switch.prototype.onOverlapUpdate = function () {
                if (this.box.enabled && this.box.collide(Game.Scene.boxesBlobs, null, true, 0, true, Engine.Box.LAYER_ALL) != null) {
                    if (!this.lastFrame) {
                        this.lastFrame = true;
                        Game.Resources.audioPlayerSwitch.play();
                    }
                    for (var _i = 0, _a = Game.Scene.switches; _i < _a.length; _i++) {
                        var switchButton = _a[_i];
                        switchButton.change(this.variant);
                    }
                    for (var _b = 0, _c = Game.Scene.switchBlocks; _b < _c.length; _b++) {
                        var switchBlock = _c[_b];
                        switchBlock.change(this.variant);
                    }
                }
                else {
                    this.lastFrame = false;
                }
            };
            Switch.prototype.onTimeUpdate = function () {
                var point = this.box.getExtrapolation(Game.Scene.boxesTiles, 0, this.yVel, true, Engine.Box.LAYER_ALL);
                this.sprite.x = point.x - 3;
                this.sprite.y = point.y - 7;
            };
            Switch.prototype.change = function (variant) {
                if (variant == this.variant) {
                    this.setPressed(!this.pressed);
                }
            };
            Switch.prototype.onDrawSwitchs = function () {
                this.sprite.render();
                //this.box.render();
            };
            return Switch;
        }(Entities.Entity));
        Entities.Switch = Switch;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var SwitchBlock = /** @class */ (function (_super) {
            __extends(SwitchBlock, _super);
            function SwitchBlock(def) {
                var _this = _super.call(this, def) || this;
                _this.sprite = new Engine.Sprite();
                _this.sprite.enabled = true;
                _this.sprite.x = def.instance.x;
                _this.sprite.y = def.instance.y - 16;
                Game.Scene.spritesTiles.push(_this.sprite);
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.x = _this.sprite.x;
                _this.box.y = _this.sprite.y;
                _this.box.xSize = 16;
                _this.box.ySize = 16;
                _this.variant = _this.getProperty("variant");
                Game.Scene.boxesTiles.push(_this.box);
                Game.Scene.switchBlocks.push(_this);
                return _this;
            }
            SwitchBlock.prototype.onReset = function () {
                this.setActive(this.getProperty("active"));
            };
            SwitchBlock.prototype.setActive = function (active) {
                this.active = active;
                this.box.enabled = active;
                this.sprite.setFull(true, false, Game.Resources.texture, 16, 16, 0, 0, 421 + 19 + 19 * 2 * (active ? 0 : 1), 3 + 19 * this.variant, 16, 16);
            };
            SwitchBlock.prototype.change = function (variant) {
                if (variant == this.variant) {
                    this.setActive(!this.active);
                }
            };
            SwitchBlock.prototype.onDrawObjects = function () {
                //this.sprite.render();
                //this.box.render();
            };
            return SwitchBlock;
        }(Entities.Entity));
        Entities.SwitchBlock = SwitchBlock;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var TitleBlob = /** @class */ (function (_super) {
            __extends(TitleBlob, _super);
            function TitleBlob(def) {
                return _super.call(this, def, true, 0) || this;
            }
            TitleBlob.prototype.onDrawObjects = function () {
                this.sprite.render();
            };
            return TitleBlob;
        }(Entities.Blob));
        Entities.TitleBlob = TitleBlob;
        var LoadBlob = /** @class */ (function (_super) {
            __extends(LoadBlob, _super);
            function LoadBlob(def) {
                return _super.call(this, def, false, 0) || this;
            }
            LoadBlob.prototype.onDrawObjects = function () {
                this.sprite.render();
            };
            return LoadBlob;
        }(Entities.Blob));
        Entities.LoadBlob = LoadBlob;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Engine/Scene.ts"/>
///<reference path="../Main.ts"/>
var Game;
(function (Game) {
    var Scene = /** @class */ (function (_super) {
        __extends(Scene, _super);
        function Scene() {
            var _this = _super.call(this) || this;
            _this.createMap = function (mapName) {
                var levels = JSON.parse(Engine.Assets.loadText(Game.Resources.PATH_LEVELS));
                Scene.xCountTiles = levels.width;
                Scene.yCountTiles = levels.height;
                var level = levels.layers.find(function (layer) {
                    return layer.name == mapName;
                });
                Scene.spritesTiles = new Array();
                Scene.boxesTiles = new Array();
                Scene.xSizeLevel = 0;
                Scene.ySizeLevel = 0;
                for (var _i = 0, _a = level.layers; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    if (layer.name != "Entities") {
                        var indexTile = 0;
                        for (var yIndex = 0; yIndex < Scene.yCountTiles; yIndex += 1) {
                            for (var xIndex = 0; xIndex < Scene.xCountTiles; xIndex += 1) {
                                if (layer.data[indexTile] != 0) {
                                    var x = xIndex * Scene.xSizeTile;
                                    var y = yIndex * Scene.ySizeTile;
                                    Scene.spritesTiles.push(Scene.createSpriteTile(layer.data[indexTile], x, y));
                                    if (x > Scene.xSizeLevel) {
                                        Scene.xSizeLevel = x;
                                    }
                                    if (y > Scene.ySizeLevel) {
                                        Scene.ySizeLevel = y;
                                    }
                                }
                                indexTile += 1;
                            }
                        }
                        if (layer.name == "Terrain") {
                            indexTile = 0;
                            for (var yIndex = 0; yIndex < Scene.yCountTiles; yIndex += 1) {
                                for (var xIndex = 0; xIndex < Scene.xCountTiles; xIndex += 1) {
                                    if (layer.data[indexTile] != 0) {
                                        var x = xIndex * Scene.xSizeTile;
                                        var y = yIndex * Scene.ySizeTile;
                                        var box = new Engine.Box();
                                        box.enabled = true;
                                        box.renderable = true;
                                        box.layer = Engine.Box.LAYER_ALL;
                                        box.x = x;
                                        box.y = y;
                                        box.xSize = Scene.xSizeTile;
                                        box.ySize = Scene.ySizeTile;
                                        Scene.boxesTiles.push(box);
                                    }
                                    indexTile += 1;
                                }
                            }
                        }
                    }
                }
                Scene.boxesSpikes = new Array();
                Scene.boxesBlobs = new Array();
                Scene.boxesFireEntities = new Array();
                Scene.boxesEnemies = Array();
                Scene.switches = new Array();
                Scene.switchBlocks = new Array();
                Scene.xSizeLevel += Scene.xSizeTile;
                Scene.ySizeLevel += Scene.ySizeTile;
                var entities = level.layers.find(function (layer) { return layer.name == "Entities"; }).objects;
                for (var _b = 0, entities_1 = entities; _b < entities_1.length; _b++) {
                    var instancedef = entities_1[_b];
                    var entitydef = Scene.getEntitydef(instancedef);
                    Game.Entities.Entity.create(entitydef);
                }
            };
            if (Scene.fade == null) {
                Scene.fade = new Utils.Fade();
                Scene.fade.preserved = true;
            }
            Scene.instance = _this;
            Scene.fade.speed = 0.0166666666666667 * 3;
            Engine.Renderer.clearColor(104 / 255, 68 / 255, 252 / 255);
            Engine.Renderer.camera(0, 0);
            return _this;
        }
        Scene.createSpriteTile = function (indexTile, x, y) {
            var sprite = new Engine.Sprite();
            sprite.x = x;
            sprite.y = y;
            indexTile -= 1;
            var yIndexTile = new Int32Array([indexTile / Scene.tileColumns]);
            var xIndexTile = indexTile - yIndexTile[0] * Scene.tileColumns;
            var xTexture = Scene.offsetTiles + xIndexTile * (Scene.offsetTiles + Scene.xSizeTile);
            var yTexture = Scene.offsetTiles + yIndexTile[0] * (Scene.offsetTiles + Scene.ySizeTile);
            //console.log(yTexture);
            sprite.setFull(true, false, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), Scene.xSizeTile, Scene.ySizeTile, 0, 0, xTexture, yTexture, Scene.xSizeTile, Scene.ySizeTile);
            return sprite;
        };
        Scene.getEntitydef = function (instancedef) {
            var typedef = Scene.tiles.find(function (typedef) {
                var gid = instancedef.gid & ~(Scene.FLIPPED_HORIZONTALLY_FLAG | Scene.FLIPPED_VERTICALLY_FLAG | Scene.FLIPPED_DIAGONALLY_FLAG);
                return typedef.id == gid - 1;
            });
            var entitydef = {};
            entitydef.type = typedef;
            entitydef.instance = instancedef;
            entitydef.flip = {};
            entitydef.flip.x = (instancedef.gid & (instancedef.gid & Scene.FLIPPED_HORIZONTALLY_FLAG)) != 0;
            entitydef.flip.y = (instancedef.gid & (instancedef.gid & Scene.FLIPPED_VERTICALLY_FLAG)) != 0;
            return entitydef;
        };
        Scene.prototype.onReset = function () {
            Scene.fade.direction = -1;
            Scene.nextSceneClass = null;
            Scene.waiting = false;
            Scene.countStepsWait = 0;
        };
        Scene.prototype.onStepUpdate = function () {
            if (Scene.waiting) {
                Scene.countStepsWait += 1;
                if (Scene.countStepsWait >= Scene.stepsWait) {
                    if (Scene.nextSceneClass == "reset") {
                        Engine.System.requireReset();
                    }
                    else {
                        Engine.System.nextSceneClass = Scene.nextSceneClass;
                    }
                }
            }
            else {
                if (Scene.nextSceneClass != null && Scene.fade.direction != 1) {
                    Scene.fade.direction = 1;
                }
                if (Scene.fade.direction == 1 && Scene.fade.alpha == 1) {
                    Scene.waiting = true;
                }
            }
        };
        Scene.prototype.onTimeUpdate = function () {
        };
        Scene.prototype.onDrawScene = function () {
            for (var _i = 0, _a = Scene.spritesTiles; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.render();
            }
            //for(var box of Scene.boxesTiles){
            //    box.render();
            //}
        };
        Scene.FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
        Scene.FLIPPED_VERTICALLY_FLAG = 0x40000000;
        Scene.FLIPPED_DIAGONALLY_FLAG = 0x20000000;
        Scene.stepsWait = 0;
        Scene.countStepsWait = 0;
        Scene.spritesTiles = new Array();
        Scene.boxesTiles = new Array();
        Scene.boxesBlobs = new Array();
        Scene.boxesFireEntities = new Array();
        Scene.boxesEnemies = new Array();
        Scene.boxesSpikes = new Array();
        Scene.switches = new Array();
        Scene.switchBlocks = new Array();
        Scene.offsetTiles = 0;
        Scene.maxLevels = 0;
        Scene.xSizeLevel = 0;
        Scene.ySizeLevel = 0;
        Scene.xSizeTile = 0;
        Scene.ySizeTile = 0;
        return Scene;
    }(Engine.Scene));
    Game.Scene = Scene;
    Game.addAction("preinit", function () {
        var tileset = JSON.parse(Engine.Assets.loadText(Game.Resources.PATH_TILESET));
        //Engine.Texture.load(Resources.PATH_TEXTURE_GRAPHICS_0).preserved = true;
        Scene.tiles = tileset.tiles;
        Scene.xSizeTile = tileset.tilewidth;
        Scene.ySizeTile = tileset.tileheight;
        Scene.tileColumns = tileset.columns;
        Scene.offsetTiles = tileset.margin;
    });
})(Game || (Game = {}));
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    var Credits = /** @class */ (function (_super) {
        __extends(Credits, _super);
        function Credits() {
            var _this = _super.call(this) || this;
            _this.createMap("Credits");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            _this.buttonBackGraph = new Engine.Sprite();
            _this.buttonBackGraph.setFull(true, true, Game.Resources.texture, 53, 20, -53 * 0.5, -10, 290, 323, 53, 20);
            _this.buttonBackGraph.x = 0;
            _this.buttonBackGraph.y = Engine.Renderer.ySizeView * 0.25 + 23 + 12 + 3;
            _this.buttonBack = new Game.TextButton();
            _this.buttonBack.font = Game.Font.instance;
            _this.buttonBack.enabled = true;
            _this.buttonBack.pinned = true;
            _this.buttonBack.str = "BACK";
            _this.buttonBack.button.bounds2 = _this.buttonBackGraph;
            _this.buttonBack.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.xAligned = _this.buttonBackGraph.x;
            _this.buttonBack.yAligned = _this.buttonBackGraph.y;
            _this.buttonBack.button.yOffset = 0;
            _this.buttonBack.button.listener = {};
            _this.buttonBack.button.onActionDelegate = function () {
                if (Game.Scene.nextSceneClass == null) {
                    Game.Scene.nextSceneClass = Game.MainMenu;
                }
            };
            _this.dialog = new Engine.Sprite();
            _this.dialog.setFull(true, true, Game.Resources.texture, 240 + 8, 164 + 8, -120 - 4, -82 - 4, 30, 182, 240 + 8, 164 + 8);
            _this.dialog.y = -10;
            var createdBy = new Utils.Text();
            createdBy.font = Game.Font.instance;
            createdBy.scale = 1;
            createdBy.enabled = true;
            createdBy.pinned = true;
            createdBy.str = "CREATED BY";
            createdBy.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            createdBy.xAlignView = Utils.AnchorAlignment.MIDDLE;
            createdBy.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            createdBy.yAlignView = Utils.AnchorAlignment.MIDDLE;
            createdBy.xAligned = 0;
            createdBy.yAligned = _this.dialog.y - 20 - 53;
            var noadev = new Game.TextButton();
            noadev.button.arrowsEnabled = Game.HAS_LINKS;
            noadev.font = Game.Font.instance;
            noadev.enabled = true;
            noadev.pinned = true;
            noadev.str = Game.HAS_LINKS ? "ANDRES GONZALEZ - WWW.NOADEV.COM" : "NOADEV: ANDRES GONZALEZ";
            noadev.url = Game.HAS_LINKS ? "http://noadev.com/games" : null;
            noadev.underlined = Game.HAS_LINKS;
            noadev.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            noadev.xAlignView = Utils.AnchorAlignment.MIDDLE;
            noadev.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            noadev.yAlignView = Utils.AnchorAlignment.MIDDLE;
            noadev.yAligned = createdBy.y + 16;
            noadev.button.yOffset = 0;
            noadev.button.onPointerStayDelegate = function () {
                if (Game.HAS_LINKS) {
                    Engine.Renderer.useHandPointer = true;
                }
            };
            var musicBy = new Utils.Text();
            musicBy.font = Game.Font.instance;
            musicBy.scale = 1;
            musicBy.enabled = true;
            musicBy.pinned = true;
            musicBy.str = "MUSIC BY";
            musicBy.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            musicBy.xAlignView = Utils.AnchorAlignment.MIDDLE;
            musicBy.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            musicBy.yAlignView = Utils.AnchorAlignment.MIDDLE;
            musicBy.xAligned = 0;
            musicBy.yAligned = noadev.y + 20;
            var musicCreator = new Game.TextButton();
            musicCreator.button.arrowsEnabled = Game.HAS_LINKS;
            musicCreator.font = Game.Font.instance;
            musicCreator.enabled = true;
            musicCreator.pinned = true;
            musicCreator.str = Game.HAS_LINKS ? "EMMA_MA - OPENGAMEART.ORG" : "EMMA_MA > OPENGAMEART";
            musicCreator.url = Game.HAS_LINKS ? "https://opengameart.org/users/emmama" : null;
            musicCreator.underlined = Game.HAS_LINKS;
            musicCreator.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            musicCreator.xAlignView = Utils.AnchorAlignment.MIDDLE;
            musicCreator.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            musicCreator.yAlignView = Utils.AnchorAlignment.MIDDLE;
            musicCreator.yAligned = musicBy.y + 16;
            musicCreator.button.yOffset = 0;
            musicCreator.button.onPointerStayDelegate = function () {
                if (Game.HAS_LINKS) {
                    Engine.Renderer.useHandPointer = true;
                }
            };
            var thumb = new Utils.Text();
            thumb.font = Game.Font.instance;
            thumb.scale = 1;
            thumb.enabled = true;
            thumb.pinned = true;
            thumb.str = "THUMBNAIL";
            thumb.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thumb.xAlignView = Utils.AnchorAlignment.MIDDLE;
            thumb.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thumb.yAlignView = Utils.AnchorAlignment.MIDDLE;
            thumb.xAligned = 0;
            thumb.yAligned = musicCreator.y + 20;
            var behe = new Utils.Text();
            behe.font = Game.Font.instance;
            behe.scale = 1;
            behe.enabled = true;
            behe.pinned = true;
            behe.str = "DEUSBEHEMOTH";
            behe.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            behe.xAlignView = Utils.AnchorAlignment.MIDDLE;
            behe.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            behe.yAlignView = Utils.AnchorAlignment.MIDDLE;
            behe.xAligned = 0;
            behe.yAligned = thumb.y + 15;
            var thanks = new Utils.Text();
            thanks.font = Game.Font.instance;
            thanks.scale = 1;
            thanks.enabled = true;
            thanks.pinned = true;
            thanks.str = "SPECIAL THANKS";
            thanks.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thanks.xAlignView = Utils.AnchorAlignment.MIDDLE;
            thanks.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thanks.yAlignView = Utils.AnchorAlignment.MIDDLE;
            thanks.xAligned = 0;
            thanks.yAligned = behe.y + 20;
            var jairfredy = new Utils.Text();
            jairfredy.font = Game.Font.instance;
            jairfredy.scale = 1;
            jairfredy.enabled = true;
            jairfredy.pinned = true;
            jairfredy.str = "JAIR FRANCO     -  FREDY ESPINOSA";
            jairfredy.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            jairfredy.xAlignView = Utils.AnchorAlignment.MIDDLE;
            jairfredy.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            jairfredy.yAlignView = Utils.AnchorAlignment.MIDDLE;
            jairfredy.xAligned = 0;
            jairfredy.yAligned = thanks.y + 15;
            var ripergross = new Utils.Text();
            ripergross.font = Game.Font.instance;
            ripergross.scale = 1;
            ripergross.enabled = true;
            ripergross.pinned = true;
            ripergross.str = "RE4PERX6        - GROSS STANDARDS";
            ripergross.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            ripergross.xAlignView = Utils.AnchorAlignment.MIDDLE;
            ripergross.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            ripergross.yAlignView = Utils.AnchorAlignment.MIDDLE;
            ripergross.xAligned = 0;
            ripergross.yAligned = jairfredy.y + 13;
            var nielkaro = new Utils.Text();
            nielkaro.font = Game.Font.instance;
            nielkaro.scale = 1;
            nielkaro.enabled = true;
            nielkaro.pinned = true;
            nielkaro.str = "NIELDACAN       -         KARODEV";
            nielkaro.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            nielkaro.xAlignView = Utils.AnchorAlignment.MIDDLE;
            nielkaro.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            nielkaro.yAlignView = Utils.AnchorAlignment.MIDDLE;
            nielkaro.xAligned = 0;
            nielkaro.yAligned = ripergross.y + 13;
            var kalparlau = new Utils.Text();
            kalparlau.font = Game.Font.instance;
            kalparlau.scale = 1;
            kalparlau.enabled = true;
            kalparlau.pinned = true;
            kalparlau.str = "KALPAR          - LAUTARO LUCARAS";
            kalparlau.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            kalparlau.xAlignView = Utils.AnchorAlignment.MIDDLE;
            kalparlau.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            kalparlau.yAlignView = Utils.AnchorAlignment.MIDDLE;
            kalparlau.xAligned = 0;
            kalparlau.yAligned = nielkaro.y + 13;
            var rodrigomark = new Utils.Text();
            rodrigomark.font = Game.Font.instance;
            rodrigomark.scale = 1;
            rodrigomark.enabled = true;
            rodrigomark.pinned = true;
            rodrigomark.str = "RODRIGO PORRAS  -            MARK";
            rodrigomark.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            rodrigomark.xAlignView = Utils.AnchorAlignment.MIDDLE;
            rodrigomark.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            rodrigomark.yAlignView = Utils.AnchorAlignment.MIDDLE;
            rodrigomark.xAligned = 0;
            rodrigomark.yAligned = kalparlau.y + 13;
            var nytoariella = new Utils.Text();
            nytoariella.font = Game.Font.instance;
            nytoariella.scale = 1;
            nytoariella.enabled = true;
            nytoariella.pinned = true;
            nytoariella.str = "NYTO            - ARIELLA'S GHOST";
            nytoariella.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            nytoariella.xAlignView = Utils.AnchorAlignment.MIDDLE;
            nytoariella.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            nytoariella.yAlignView = Utils.AnchorAlignment.MIDDLE;
            nytoariella.xAligned = 0;
            nytoariella.yAligned = rodrigomark.y + 13;
            var flojo = new Utils.Text();
            flojo.font = Game.Font.instance;
            flojo.scale = 1;
            flojo.enabled = true;
            flojo.pinned = true;
            flojo.str = "CESAR CORTEX    -        EL FLOJO";
            flojo.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            flojo.xAlignView = Utils.AnchorAlignment.MIDDLE;
            flojo.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            flojo.yAlignView = Utils.AnchorAlignment.MIDDLE;
            flojo.xAligned = 0;
            flojo.yAligned = nytoariella.y + 13;
            Game.triggerActions("credits");
            return _this;
        }
        Credits.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            this.dialog.render();
            this.buttonBackGraph.render();
        };
        return Credits;
    }(Game.Scene));
    Game.Credits = Credits;
})(Game || (Game = {}));
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    var EndScreen = /** @class */ (function (_super) {
        __extends(EndScreen, _super);
        function EndScreen() {
            var _this = _super.call(this) || this;
            _this.createMap("End Screen");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            var thanksText = new Utils.Text();
            thanksText.font = Game.Font.instance;
            thanksText.scale = 2;
            thanksText.enabled = true;
            thanksText.pinned = true;
            thanksText.str = "THANKS FOR PLAYING!";
            thanksText.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thanksText.xAlignView = Utils.AnchorAlignment.MIDDLE;
            thanksText.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thanksText.yAlignView = Utils.AnchorAlignment.MIDDLE;
            thanksText.xAligned = 0;
            thanksText.yAligned = -Engine.Renderer.ySizeView * 0.25 - 23;
            var gameBy = new Utils.Text();
            gameBy.font = Game.Font.instance;
            gameBy.scale = 1;
            gameBy.enabled = true;
            gameBy.pinned = true;
            gameBy.str = Game.HAS_LINKS ? "A GAME BY NOADEV:" : "A GAME BY";
            gameBy.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            gameBy.xAlignView = Utils.AnchorAlignment.MIDDLE;
            gameBy.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            gameBy.yAlignView = Utils.AnchorAlignment.MIDDLE;
            gameBy.xAligned = 0;
            gameBy.yAligned = thanksText.y + 25 + 22 - 5 + 1;
            _this.buttonTwitter = new Game.TextButton();
            _this.buttonTwitter.button.arrowsEnabled = Game.HAS_LINKS;
            _this.buttonTwitter.font = Game.Font.instance;
            _this.buttonTwitter.enabled = true;
            _this.buttonTwitter.pinned = true;
            _this.buttonTwitter.str = Game.HAS_LINKS ? "@NOADEV_C" : "NOADEV";
            _this.buttonTwitter.url = Game.HAS_LINKS ? "https://twitter.com/NoaDev_C" : null;
            _this.buttonTwitter.underlined = Game.HAS_LINKS;
            _this.buttonTwitter.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonTwitter.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonTwitter.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonTwitter.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonTwitter.yAligned = gameBy.y + 16;
            _this.buttonTwitter.button.yOffset = 0;
            _this.buttonTwitter.button.onPointerStayDelegate = function () {
                if (Game.HAS_LINKS) {
                    Engine.Renderer.useHandPointer = true;
                }
            };
            var continueText0 = new Utils.Text();
            continueText0.font = Game.Font.instance;
            continueText0.scale = 1;
            continueText0.enabled = true;
            continueText0.pinned = true;
            continueText0.str = "PRESS ESC OR CLICK";
            continueText0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            continueText0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            continueText0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            continueText0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            continueText0.xAligned = 0;
            continueText0.yAligned = 93;
            var continueText1 = new Utils.Text();
            continueText1.font = Game.Font.instance;
            continueText1.scale = 1;
            continueText1.enabled = true;
            continueText1.pinned = true;
            continueText1.str = "TO CONTINUE";
            continueText1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            continueText1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            continueText1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            continueText1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            continueText1.xAligned = 0;
            continueText1.yAligned = continueText0.y + 13;
            Game.triggerActions("endscreen");
            return _this;
        }
        EndScreen.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (Game.Scene.nextSceneClass == null && (Game.Control.pointerPressed || Engine.Keyboard.pressed(Engine.Keyboard.ESC)) && (!this.buttonTwitter.selected || !Game.HAS_LINKS)) {
                Game.Scene.nextSceneClass = Game.MainMenu;
            }
        };
        return EndScreen;
    }(Game.Scene));
    Game.EndScreen = EndScreen;
})(Game || (Game = {}));
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    var Level = /** @class */ (function (_super) {
        __extends(Level, _super);
        function Level() {
            var _this = _super.call(this) || this;
            _this.winSaved = false;
            _this.exiting = false;
            _this.shaking = false;
            if (Game.Scene.soundButton == null) {
                Game.Scene.soundButton = new Game.SoundButton();
            }
            Level.goals = 0;
            Level.index = Level.nextIndex;
            Level.nextIndex = Level.index + 1;
            _this.shake = new Utils.Shake();
            _this.shake.velocity = 2;
            _this.shake.distance = 2;
            _this.shake.minDistance = 0.01;
            _this.shake.reduction = 0.8;
            _this.resetButton = new Game.ResetButton();
            _this.exitButton = new Game.ExitButton();
            new Game.LevelText();
            _this.createMap("Level " + Level.index);
            //this.createMap("Level 1");
            Game.triggerActions("level");
            return _this;
        }
        Level.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.winSaved = false;
            this.shake.stop();
            this.shaking = false;
            Level.countGoals = 0;
        };
        Level.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (!this.winSaved && Game.Entities.Player.instance.winning) {
                Game.levelStates[Level.index - 1] = "cleared";
                Engine.Data.save("Level " + (Level.index - 1), "cleared", 60);
                if (Game.levelStates[Level.nextIndex - 1] == "") {
                    Engine.Data.save("Level " + (Level.nextIndex - 1), "unlocked", 60);
                    Game.levelStates[Level.nextIndex - 1] = "unlocked";
                }
                Game.triggerActions("savegame");
                this.winSaved = true;
            }
            if (Game.Scene.nextSceneClass == null && Game.Entities.Player.instance.win) {
                if (Level.index == 28) {
                    Game.Scene.nextSceneClass = Game.EndScreen;
                }
                else {
                    Game.Scene.nextSceneClass = Level;
                    Game.triggerActions("playlevelbutton");
                }
            }
            if (Game.Scene.nextSceneClass == null && Game.Entities.Player.instance.lose) {
                Game.Scene.nextSceneClass = "reset";
            }
            if (this.resetButton.used && !this.exiting) {
                Game.Scene.nextSceneClass = "reset";
                Game.triggerActions("resetlevelbutton");
            }
            if (this.exitButton.used && !this.exiting) {
                Game.Scene.nextSceneClass = Game.LevelSelection;
                this.exiting = true;
            }
            if (!this.shaking && Game.Entities.Player.instance.losing) {
                this.shake.start(1);
                this.shaking = true;
            }
        };
        Level.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            var x = Game.Entities.Player.x;
            if (Game.Scene.xSizeLevel - Game.Scene.xSizeTile * 2 < Engine.Renderer.xSizeView) {
                x = Game.Scene.xSizeLevel * 0.5;
            }
            else if (x < Engine.Renderer.xSizeView * 0.5 + Game.Scene.xSizeTile) {
                x = Engine.Renderer.xSizeView * 0.5 + Game.Scene.xSizeTile;
            }
            else if (x > Game.Scene.xSizeLevel - Engine.Renderer.xSizeView * 0.5 - Game.Scene.xSizeTile) {
                x = Game.Scene.xSizeLevel - Engine.Renderer.xSizeView * 0.5 - Game.Scene.xSizeTile;
            }
            var y = Game.Entities.Player.y;
            if (Game.Scene.ySizeLevel < Engine.Renderer.ySizeView) {
                y = Game.Scene.ySizeLevel * 0.5;
            }
            else if (y < Engine.Renderer.ySizeView * 0.5) {
                y = Engine.Renderer.ySizeView * 0.5;
            }
            else if (y > Game.Scene.ySizeLevel - Engine.Renderer.ySizeView * 0.5) {
                y = Game.Scene.ySizeLevel - Engine.Renderer.ySizeView * 0.5;
            }
            Engine.Renderer.camera(x + this.shake.position, y);
        };
        ;
        Level.GRAVITY = 0.2;
        Level.STATE_PLAYING = 1;
        Level.STATE_RESETING = 2;
        Level.STATE_EXITING = 3;
        Level.STATE_WAIT_AFTER_EXITING = 4;
        Level.STATE_WINNING = 5;
        Level.STATE_TO_NEXT_LEVEL = 6;
        Level.STATE_LOSE = 7;
        Level.nextIndex = 1;
        return Level;
    }(Game.Scene));
    Game.Level = Level;
})(Game || (Game = {}));
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    var LevelSelection = /** @class */ (function (_super) {
        __extends(LevelSelection, _super);
        function LevelSelection() {
            var _this = _super.call(this) || this;
            if (Game.Scene.soundButton == null) {
                Game.Scene.soundButton = new Game.SoundButton();
            }
            _this.createMap("Level Selection");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            _this.buttonGraphs = new Array();
            _this.buttons = new Array();
            for (var j = 0; j < 4; j += 1) {
                for (var i = 0; i < 7; i += 1) {
                    var sprite = new Engine.Sprite();
                    sprite.setFull(true, true, Game.Resources.texture, 39, 20, -39 * 0.5, -10, 379, 344, 39, 20);
                    sprite.x = (sprite.xSize + 5) * i - (sprite.xSize + 5) * 3;
                    sprite.y = (sprite.ySize + 5) * j - (sprite.ySize + 5) * 1.5;
                    _this.buttonGraphs.push(sprite);
                    var button = new Game.TextButton();
                    button = new Game.TextButton();
                    button.font = Game.Font.instance;
                    button.enabled = true;
                    button.pinned = true;
                    button.str = (j * 7 + i + 1) + "";
                    button.button.bounds2 = sprite;
                    button.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                    button.xAlignView = Utils.AnchorAlignment.MIDDLE;
                    button.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                    button.yAlignView = Utils.AnchorAlignment.MIDDLE;
                    button.xAligned = sprite.x;
                    button.yAligned = sprite.y;
                    button.button.yOffset = 0;
                    button.button.listener = {};
                    button.button.listener.index = j * 7 + i + 1;
                    button.button.onActionDelegate = function () {
                        if (Game.Scene.nextSceneClass == null) {
                            var that = this;
                            Game.Level.nextIndex = that.index;
                            Game.Scene.nextSceneClass = Game.Level;
                            Game.triggerActions("playlevelbutton");
                        }
                    };
                    _this.buttons.push(button);
                }
            }
            _this.buttonBackGraph = new Engine.Sprite();
            _this.buttonBackGraph.setFull(true, true, Game.Resources.texture, 53, 20, -53 * 0.5, -10, 290, 323, 53, 20);
            _this.buttonBackGraph.x = 0;
            _this.buttonBackGraph.y = Engine.Renderer.ySizeView * 0.25 + 23;
            _this.buttonBack = new Game.TextButton();
            _this.buttonBack.font = Game.Font.instance;
            _this.buttonBack.enabled = true;
            _this.buttonBack.pinned = true;
            _this.buttonBack.str = "BACK";
            _this.buttonBack.button.bounds2 = _this.buttonBackGraph;
            _this.buttonBack.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.xAligned = _this.buttonBackGraph.x;
            _this.buttonBack.yAligned = _this.buttonBackGraph.y;
            _this.buttonBack.button.yOffset = 0;
            _this.buttonBack.button.onActionDelegate = function () {
                if (Game.Scene.nextSceneClass == null) {
                    Game.Scene.nextSceneClass = Game.MainMenu;
                }
            };
            _this.textSelect = new Utils.Text();
            _this.textSelect.font = Game.Font.instance;
            _this.textSelect.scale = 2;
            _this.textSelect.enabled = true;
            _this.textSelect.pinned = true;
            _this.textSelect.str = "SELECT LEVEL";
            _this.textSelect.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.textSelect.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.textSelect.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.textSelect.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.textSelect.xAligned = 0;
            _this.textSelect.yAligned = -Engine.Renderer.ySizeView * 0.25 - 23;
            _this.fix();
            Game.triggerActions("levelselection");
            return _this;
        }
        LevelSelection.prototype.fix = function () {
            for (var i = 0; i < this.buttonGraphs.length; i += 1) {
                if (Game.levelStates[i] == "") {
                    this.buttonGraphs[i].setFull(true, true, Game.Resources.texture, 39, 20, -39 * 0.5, -10, 379, 344, 39, 20);
                    this.buttonGraphs[i].setRGBA(1, 1, 1, 0.2);
                    for (var _i = 0, _a = this.buttons[i].sprites; _i < _a.length; _i++) {
                        var sprite = _a[_i];
                        sprite.setRGBA(1, 1, 1, 0.2);
                    }
                    this.buttons[i].interactable = false;
                }
                else if (Game.levelStates[i] == "unlocked") {
                    this.buttonGraphs[i].setFull(true, true, Game.Resources.texture, 39, 20, -39 * 0.5, -10, 379, 344, 39, 20);
                    this.buttonGraphs[i].setRGBA(1, 1, 1, 1);
                    for (var _b = 0, _c = this.buttons[i].sprites; _b < _c.length; _b++) {
                        var sprite = _c[_b];
                        sprite.setRGBA(1, 1, 1, 1);
                    }
                    this.buttons[i].interactable = true;
                }
                else {
                    this.buttonGraphs[i].setFull(true, true, Game.Resources.texture, 39, 20, -39 * 0.5, -10, 339, 344, 39, 20);
                    this.buttonGraphs[i].setRGBA(1, 1, 1, 1);
                    for (var _d = 0, _e = this.buttons[i].sprites; _d < _e.length; _d++) {
                        var sprite = _e[_d];
                        sprite.setRGBA(1, 1, 1, 1);
                    }
                    this.buttons[i].interactable = true;
                }
            }
        };
        LevelSelection.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (!LevelSelection.allLevelsUnlocked && Game.allLevelsUnlocked) {
                this.fix();
                LevelSelection.allLevelsUnlocked = true;
            }
        };
        LevelSelection.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            for (var i = 0; i < this.buttonGraphs.length; i += 1) {
                this.buttonGraphs[i].render();
            }
            this.buttonBackGraph.render();
        };
        LevelSelection.allLevelsUnlocked = false;
        return LevelSelection;
    }(Game.Scene));
    Game.LevelSelection = LevelSelection;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var MainMenu = /** @class */ (function (_super) {
        __extends(MainMenu, _super);
        function MainMenu() {
            var _this = _super.call(this) || this;
            if (Game.Scene.soundButton == null) {
                Game.Scene.soundButton = new Game.SoundButton();
            }
            if (!MainMenu.notFirst) {
                Game.Scene.fade.speed = 0.0166666666666667 * 1;
                MainMenu.notFirst = true;
            }
            _this.title = new Engine.Sprite();
            _this.title.setFull(true, true, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 152, 26, -152 * 0.5, -26 * 0.5, 80, 105, 152, 26);
            _this.title.y = -Engine.Renderer.ySizeView * 0.25 - 16 + 10 - 5;
            _this.title.setRGBA(1, 1, 1, 0.7);
            _this.spritesButton = new Array();
            for (var i = 0; i < (Game.HAS_LINKS ? 3 : 2); i += 1) {
                var sprite = new Engine.Sprite();
                sprite.enabled = true;
                sprite.pinned = true;
                sprite.setFull(true, true, Game.Resources.texture, 74, 20, -74 * 0.5, -10, 344, 323, 74, 20);
                //sprite.x = -94 + i * 94;
                if (Game.HAS_LINKS) {
                    sprite.y = -25 + 25 * i;
                }
                else {
                    sprite.y = 2.5 - 8 + 25 * i;
                }
                _this.spritesButton.push(sprite);
            }
            _this.createMap("Main Menu");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            _this.initEmitters();
            _this.buttonTwitter = new Game.TextButton();
            _this.buttonTwitter.button.arrowsEnabled = Game.HAS_LINKS;
            _this.buttonTwitter.font = Game.Font.instance;
            _this.buttonTwitter.enabled = true;
            _this.buttonTwitter.pinned = true;
            _this.buttonTwitter.str = Game.HAS_LINKS ? "@NOADEV_C" : "A NOADEV GAME";
            _this.buttonTwitter.url = Game.HAS_LINKS ? "https://twitter.com/NoaDev_C" : null;
            _this.buttonTwitter.underlined = Game.HAS_LINKS;
            _this.buttonTwitter.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonTwitter.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonTwitter.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonTwitter.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonTwitter.yAligned = 105;
            _this.buttonTwitter.button.yOffset = 0;
            _this.buttonTwitter.button.onPointerStayDelegate = function () {
                if (Game.HAS_LINKS) {
                    Engine.Renderer.useHandPointer = true;
                }
            };
            _this.buttonStart = new Game.TextButton();
            _this.buttonStart.font = Game.Font.instance;
            _this.buttonStart.enabled = true;
            _this.buttonStart.pinned = true;
            _this.buttonStart.str = "START";
            _this.buttonStart.button.bounds2 = _this.spritesButton[0];
            _this.buttonStart.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonStart.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonStart.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonStart.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonStart.yAligned = _this.spritesButton[0].y;
            _this.buttonStart.button.yOffset = 0;
            _this.buttonStart.button.onActionDelegate = function () {
                if (Game.Scene.nextSceneClass == null) {
                    Game.Scene.fade.red = 1;
                    Game.Scene.fade.green = 1;
                    Game.Scene.fade.blue = 1;
                    Game.Scene.fade.speed = 0.0166666666666667 * 3;
                    Game.Scene.nextSceneClass = Game.LevelSelection;
                    Game.triggerActions("playbutton");
                }
            };
            _this.buttonCredits = new Game.TextButton();
            _this.buttonCredits.font = Game.Font.instance;
            _this.buttonCredits.enabled = true;
            _this.buttonCredits.pinned = true;
            _this.buttonCredits.str = "CREDITS";
            _this.buttonCredits.button.bounds2 = _this.spritesButton[1];
            _this.buttonCredits.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonCredits.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonCredits.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonCredits.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonCredits.yAligned = _this.spritesButton[1].y;
            _this.buttonCredits.button.yOffset = 0;
            _this.buttonCredits.button.onActionDelegate = function () {
                if (Game.Scene.nextSceneClass == null) {
                    Game.Scene.fade.red = 1;
                    Game.Scene.fade.green = 1;
                    Game.Scene.fade.blue = 1;
                    Game.Scene.fade.speed = 0.0166666666666667 * 3;
                    Game.Scene.nextSceneClass = Game.Credits;
                }
            };
            if (Game.HAS_LINKS) {
                _this.buttonMoreGames = new Game.TextButton();
                _this.buttonMoreGames.font = Game.Font.instance;
                _this.buttonMoreGames.enabled = true;
                _this.buttonMoreGames.pinned = true;
                _this.buttonMoreGames.str = MainMenu.STR_MORE_GAMES;
                _this.buttonMoreGames.url = Game.URL_MORE_GAMES;
                //this.buttonMoreGames.underlined = true;
                _this.buttonMoreGames.button.bounds2 = _this.spritesButton[2];
                _this.buttonMoreGames.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                _this.buttonMoreGames.xAlignView = Utils.AnchorAlignment.MIDDLE;
                _this.buttonMoreGames.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                _this.buttonMoreGames.yAlignView = Utils.AnchorAlignment.MIDDLE;
                _this.buttonMoreGames.yAligned = _this.spritesButton[2].y;
                _this.buttonMoreGames.button.yOffset = 0;
                _this.buttonMoreGames.button.onPointerStayDelegate = function () {
                    Engine.Renderer.useHandPointer = true;
                };
            }
            Game.Resources.playBGM();
            Game.triggerActions("mainmenu");
            return _this;
        }
        MainMenu.prototype.initEmitters = function () {
            this.emitter0 = new Utils.Emitter();
            this.emitter0.enabled = true;
            this.emitter0.active = true;
            this.emitter0.emissionSteps = 0;
            this.emitter0.x = this.title.x;
            this.emitter0.y = this.title.y;
            this.emitter0.xMin = -160 * 0.5;
            this.emitter0.xMax = 160 * 0.5;
            this.emitter0.yMin = -17;
            this.emitter0.yMax = 17;
            this.emitter0.yVelMin = -0.6;
            this.emitter0.yVelMax = -1.0;
            this.emitter0.yAccelMin = -0.004;
            this.emitter0.yAccelMax = -0.008;
            this.emitter0.lifeParticleMin = 30;
            this.emitter0.lifeParticleMax = 70;
            for (var index = 0; index < 70; index += 1) {
                //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                var particle = new Game.Entities.BoxParticle(196, 139, 4, 4, 4, 4, 3, 4);
                particle.sprite.pinned = true;
                particle.front = true;
                this.emitter0.addParticle(particle);
            }
            this.emitter1 = new Utils.Emitter();
            this.emitter1.enabled = true;
            this.emitter1.active = true;
            this.emitter1.emissionSteps = 0;
            this.emitter1.x = this.title.x;
            this.emitter1.y = this.title.y;
            this.emitter1.xMin = -145 * 0.5;
            this.emitter1.xMax = 145 * 0.5;
            this.emitter1.yMin = -14;
            this.emitter1.yMax = 14;
            this.emitter1.yVelMin = -0.4;
            this.emitter1.yVelMax = -0.8;
            this.emitter1.yAccelMin = -0.002;
            this.emitter1.yAccelMax = -0.006;
            this.emitter1.lifeParticleMin = 30;
            this.emitter1.lifeParticleMax = 60;
            for (var index = 0; index < 70; index += 1) {
                //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                var particle = new Game.Entities.BoxParticle(196, 144, 4, 4, 4, 4, 3, 4);
                particle.sprite.pinned = true;
                particle.front = true;
                this.emitter1.addParticle(particle);
            }
        };
        MainMenu.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            this.title.render();
            for (var i = 0; i < (Game.HAS_LINKS ? 3 : 2); i += 1) {
                this.spritesButton[i].render();
            }
        };
        MainMenu.STR_MORE_GAMES = "+GAMES";
        MainMenu.notFirst = false;
        return MainMenu;
    }(Game.Scene));
    Game.MainMenu = MainMenu;
})(Game || (Game = {}));
/*
var Game = Game || {};
(function(Engine, System, Game){
    var MainMenu = function(){
        Game.SceneBase.call(this);
    };
    Engine.extends(MainMenu, Game.SceneBase);
    
    var proto = MainMenu.prototype;
    
    proto.onCreate = function(){
        Game.SceneBase.prototype.onCreate.call(this);
        Game.createMainMenuDialog();
        Game.createStartButton();
    };
    
    proto.onReset = function(){
        Game.SceneBase.prototype.onReset.call(this);
    };
    
    proto.onStepUpdate = function(){
        Game.SceneBase.prototype.onStepUpdate.call(this);
    };
    
    proto.onTimeUpdate = function(){
        //Game.SceneBase.prototype.onTimeUpdate.call(this);
    };
    
    Game.MainMenu = MainMenu;
})(Engine, System, Game);
*/ 
///<reference path="../Engine/Scene.ts"/>
var Game;
(function (Game) {
    var Preloader = /** @class */ (function (_super) {
        __extends(Preloader, _super);
        function Preloader() {
            var _this = _super.call(this) || this;
            _this.now = "loading";
            _this.count = 0;
            Game.triggerActions("preinit");
            Game.triggerActions("init");
            Game.forEachPath("load", function (path) {
                Engine.Assets.queue(path);
            });
            Engine.Assets.download();
            Game.Scene.fade.speed = 0.0166666666666667 * 1;
            if (Game.startingSceneClass != Game.MainMenu) {
                Preloader.LOAD_VELOCITY *= 60000;
            }
            _this.title = new Engine.Sprite();
            _this.title.setFull(true, true, Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 152, 26, -152 * 0.5, -26 * 0.5, 80, 105, 152, 26);
            _this.title.y = -Engine.Renderer.ySizeView * 0.25 - 16 + 10 - 5;
            _this.spriteBack = new Engine.Sprite();
            _this.spriteBack.setFull(true, true, Game.Resources.texture, 126, 15, 0, 0, 265, 381, 126, 15);
            _this.spriteBack.x = -_this.spriteBack.xSize * 0.5;
            _this.spriteBack.y = -8;
            _this.spriteBack.setRGBA(1, 1, 1, 0.7);
            _this.spriteBar = new Engine.Sprite();
            _this.spriteBar.setFull(true, true, Game.Resources.texture, 124, 13, 0, 0, 266, 398, 124, 13);
            _this.spriteBar.x = -_this.spriteBar.xSize * 0.5;
            _this.spriteBar.xScale = 0;
            _this.spriteBar.y = -7;
            _this.spriteBar.setRGBA(1, 1, 1, 0.7);
            _this.text = new Utils.Text();
            _this.text.font = Game.Font.instance;
            _this.text.scale = 1;
            _this.text.enabled = true;
            _this.text.pinned = true;
            _this.text.str = "LOADING   ";
            _this.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAligned = 2;
            _this.text.yAligned = -8 * 0;
            _this.text.front = true;
            _this.createMap("Preloader");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            _this.initEmitters();
            Game.triggerActions("preloader");
            return _this;
        }
        ;
        Preloader.prototype.initEmitters = function () {
            this.emitter0 = new Utils.Emitter();
            this.emitter0.enabled = true;
            this.emitter0.active = true;
            this.emitter0.emissionSteps = 0;
            this.emitter0.x = this.spriteBar.x;
            this.emitter0.y = this.spriteBar.y;
            this.emitter0.xMin = 0;
            this.emitter0.xMax = 0;
            this.emitter0.yMin = 0;
            this.emitter0.yMax = 17;
            this.emitter0.yVelMin = -0.6;
            this.emitter0.yVelMax = -1.0;
            this.emitter0.yAccelMin = -0.004;
            this.emitter0.yAccelMax = -0.008;
            this.emitter0.lifeParticleMin = 30;
            this.emitter0.lifeParticleMax = 70;
            for (var index = 0; index < 70; index += 1) {
                //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                var particle = new Game.Entities.BoxParticle(196, 139, 4, 4, 4, 4, 3, 4);
                particle.sprite.pinned = true;
                particle.front = true;
                this.emitter0.addParticle(particle);
            }
            this.emitter1 = new Utils.Emitter();
            this.emitter1.enabled = true;
            this.emitter1.active = true;
            this.emitter1.emissionSteps = 0;
            this.emitter1.x = this.spriteBar.x;
            this.emitter1.y = this.spriteBar.y;
            this.emitter1.xMin = 0;
            this.emitter1.xMax = 0;
            this.emitter1.yMin = 0;
            this.emitter1.yMax = 14;
            this.emitter1.yVelMin = -0.4;
            this.emitter1.yVelMax = -0.8;
            this.emitter1.yAccelMin = -0.002;
            this.emitter1.yAccelMax = -0.006;
            this.emitter1.lifeParticleMin = 30;
            this.emitter1.lifeParticleMax = 60;
            for (var index = 0; index < 70; index += 1) {
                //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                var particle = new Game.Entities.BoxParticle(196, 144, 4, 4, 4, 4, 3, 4);
                particle.sprite.pinned = true;
                particle.front = true;
                this.emitter1.addParticle(particle);
            }
        };
        Preloader.prototype.onStepUpdate = function () {
            var max = 0.3;
            if (max < Engine.Assets.downloadedRatio) {
                max = Engine.Assets.downloadedRatio;
            }
            this.spriteBar.xScale += Preloader.LOAD_VELOCITY;
            if (this.spriteBar.xScale > max) {
                this.spriteBar.xScale = max;
            }
            this.emitter0.xMax = this.spriteBar.xSize * this.spriteBar.xScale;
            this.emitter1.xMax = this.spriteBar.xSize * this.spriteBar.xScale;
            switch (this.now) {
                case "loading":
                    this.count += 1;
                    if (this.count == 20) {
                        this.count = 0;
                        if (this.text.str == "LOADING   ") {
                            this.text.str = "LOADING.  ";
                        }
                        else if (this.text.str == "LOADING.  ") {
                            this.text.str = "LOADING.. ";
                        }
                        else if (this.text.str == "LOADING.. ") {
                            this.text.str = "LOADING...";
                        }
                        else if (this.text.str == "LOADING...") {
                            this.text.str = "LOADING   ";
                        }
                    }
                    if (Engine.Assets.downloadComplete && this.spriteBar.xScale == 1) {
                        this.count = 0;
                        this.now = "click";
                        this.text.str = "CLICK TO CONTINUE";
                        this.text.xAligned = 0;
                    }
                    break;
                case "click":
                    this.count += 1;
                    if (this.count == 40) {
                        this.count = 0;
                        this.text.enabled = !this.text.enabled;
                    }
                    if (Game.Control.pointerReleased) {
                        this.now = "exit";
                        this.text.enabled = true;
                        Game.Scene.fade.direction = 1;
                        Game.triggerActions("postinit");
                    }
                    break;
                case "exit":
                    if (Game.Scene.fade.alpha == 1) {
                        this.now = "wait";
                        this.count = 0;
                    }
                    break;
                case "wait":
                    this.count += 1;
                    if (Game.startingSceneClass != Game.MainMenu) {
                        this.count = 60;
                    }
                    if (this.count == 60) {
                        this.now = "switch";
                        Engine.System.nextSceneClass = Game.PreloadEnd;
                    }
                    break;
            }
        };
        Preloader.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            this.spriteBar.render();
            this.spriteBack.render();
            this.title.render();
        };
        Preloader.LOAD_VELOCITY = 0.005;
        return Preloader;
    }(Game.Scene));
    Game.Preloader = Preloader;
})(Game || (Game = {}));
(function (Game) {
    var PreloadStart = /** @class */ (function (_super) {
        __extends(PreloadStart, _super);
        function PreloadStart() {
            var _this = _super.call(this) || this;
            Game.forEachPath("preload", function (path) {
                Engine.Assets.queue(path);
            });
            Engine.Assets.download();
            return _this;
        }
        PreloadStart.prototype.onTimeUpdate = function () {
            if (Engine.Assets.downloadComplete) {
                Engine.System.nextSceneClass = Game.Preloader;
            }
        };
        return PreloadStart;
    }(Engine.Scene));
    Game.PreloadStart = PreloadStart;
    var PreloadEnd = /** @class */ (function (_super) {
        __extends(PreloadEnd, _super);
        function PreloadEnd() {
            var _this = _super.call(this) || this;
            Game.triggerActions("configure");
            Game.triggerActions("prepare");
            Game.triggerActions("start");
            Engine.System.nextSceneClass = Game.startingSceneClass;
            return _this;
        }
        return PreloadEnd;
    }(Engine.Scene));
    Game.PreloadEnd = PreloadEnd;
    Engine.System.nextSceneClass = PreloadStart;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Control = /** @class */ (function (_super) {
        __extends(Control, _super);
        function Control() {
            return _super.call(this) || this;
        }
        Object.defineProperty(Control, "left", {
            get: function () {
                if (Game.IS_EDGE) {
                    return Engine.Keyboard.down(Engine.Keyboard.LEFT);
                }
                else {
                    return Engine.Keyboard.down(Engine.Keyboard.A) || Engine.Keyboard.down(Engine.Keyboard.LEFT);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control, "right", {
            get: function () {
                if (Game.IS_EDGE) {
                    return Engine.Keyboard.down(Engine.Keyboard.RIGHT);
                }
                else {
                    return Engine.Keyboard.down(Engine.Keyboard.D) || Engine.Keyboard.down(Engine.Keyboard.RIGHT);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control, "jump", {
            get: function () {
                return Control.stepsCountJump > 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control, "holdingJump", {
            get: function () {
                if (Game.IS_EDGE) {
                    return Engine.Keyboard.down(Engine.Keyboard.UP) || Engine.Keyboard.down(Engine.Keyboard.H) || Engine.Keyboard.down(Engine.Keyboard.SPACE);
                }
                else {
                    return Engine.Keyboard.down(Engine.Keyboard.W) || Engine.Keyboard.down(Engine.Keyboard.UP) || Engine.Keyboard.down(Engine.Keyboard.H) || Engine.Keyboard.down(Engine.Keyboard.SPACE);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control, "pointerPressed", {
            get: function () {
                return Engine.Mouse.pressed(0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control, "pointerReleased", {
            get: function () {
                return Engine.Mouse.released(0);
            },
            enumerable: true,
            configurable: true
        });
        Control.prototype.onStepUpdate = function () {
            Control.stepsCountJump -= (Control.stepsCountJump > 0 ? 1 : 0);
            if (Game.IS_EDGE) {
                if (Engine.Keyboard.pressed(Engine.Keyboard.UP) || Engine.Keyboard.pressed(Engine.Keyboard.H) || Engine.Keyboard.pressed(Engine.Keyboard.SPACE)) {
                    Control.stepsCountJump = Control.STEPS_JUMP;
                }
            }
            else {
                if (Engine.Keyboard.pressed(Engine.Keyboard.W) || Engine.Keyboard.pressed(Engine.Keyboard.UP) || Engine.Keyboard.pressed(Engine.Keyboard.H) || Engine.Keyboard.pressed(Engine.Keyboard.SPACE)) {
                    Control.stepsCountJump = Control.STEPS_JUMP;
                }
            }
        };
        Control.STEPS_JUMP = 7;
        Control.stepsCountJump = 0;
        return Control;
    }(Engine.Entity));
    Game.Control = Control;
    Game.addAction("start", function () {
        new Control().preserved = true;
    });
})(Game || (Game = {}));
var Utils;
(function (Utils) {
    var CharacterDef = /** @class */ (function () {
        function CharacterDef() {
        }
        return CharacterDef;
    }());
    var Font = /** @class */ (function () {
        function Font() {
            this.ySize = 0;
            this.xSeparation = 0;
            this.charDefs = new Array();
        }
        Font.prototype.setChar = function (character, xTexture, yTexture, xSize) {
            var indexChar = character.charCodeAt(0) - " ".charCodeAt(0);
            this.charDefs[indexChar] = new CharacterDef();
            this.charDefs[indexChar].xTexture = xTexture;
            this.charDefs[indexChar].yTexture = yTexture;
            this.charDefs[indexChar].xSize = xSize;
        };
        Font.prototype.resizeChar = function (character, xSize) {
            this.charDefs[character.charCodeAt(0) - " ".charCodeAt(0)].xSize = xSize;
        };
        Font.prototype.setFull = function (texture, ySize, xSeparation, xTexture, yTexture, xSize, columns, xSeparationTexture, ySeparationTexture) {
            this.texture = texture;
            this.ySize = ySize;
            this.xSeparation = xSeparation;
            this.charDefs = new Array();
            var indexColumn = 0;
            do {
                var charDef = new CharacterDef();
                charDef.xTexture = xTexture + indexColumn * (xSize + xSeparationTexture);
                charDef.yTexture = yTexture;
                charDef.xSize = xSize;
                this.charDefs.push(charDef);
                indexColumn += 1;
                if (indexColumn == columns) {
                    yTexture += this.ySize + ySeparationTexture;
                    indexColumn = 0;
                }
            } while (this.charDefs.length <= "~".charCodeAt(0) - " ".charCodeAt(0));
            return this;
        };
        return Font;
    }());
    Utils.Font = Font;
})(Utils || (Utils = {}));
///<reference path="../Utils/Font.ts"/>
var Game;
(function (Game) {
    var Font = /** @class */ (function (_super) {
        __extends(Font, _super);
        function Font() {
            var _this = _super.call(this) || this;
            _this.setFull(Engine.Texture.load(Game.Resources.PATH_TEXTURE_GRAPHICS_0), 8, 1, 314, 272, 6, 13, 2, 2);
            //@ts-ignore
            Font.instance = _this;
            return _this;
        }
        return Font;
    }(Utils.Font));
    Game.Font = Font;
    Game.addAction("init", function () {
        new Font();
    });
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Resources = /** @class */ (function () {
        function Resources() {
        }
        Resources.playBGM = function () {
            if (!Resources.bgmPlayed) {
                Resources.audioPlayerMusic.autoplay();
                Resources.bgmPlayed = true;
            }
        };
        Resources.PATH_LEVELS = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/Assets/Levels.json";
        Resources.PATH_TILESET = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/Assets/Tileset.json";
        Resources.PATH_JUMP = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/Assets/Jump.wmo";
        Resources.PATH_DEAD = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/Assets/Dead.wmo";
        Resources.PATH_FIRE = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/Assets/Fire.wmo";
        Resources.PATH_ICE = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/Assets/Ice.wmo";
        Resources.PATH_SWITCH = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/Assets/Switch.wmo";
        Resources.PATH_MUSIC = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/Assets/Music.omw";
        Resources.PATH_TEXTURE_GRAPHICS_0 = "https://122426624-686462056379860212.preview.editmysite.com/uploads/b/4181373-387973923660980743/files/Assets/Graphics-0.png";
        Resources.bgmPlayed = false;
        return Resources;
    }());
    Game.Resources = Resources;
    Game.addPath("preload", Resources.PATH_TEXTURE_GRAPHICS_0);
    Game.addPath("preload", Resources.PATH_LEVELS);
    Game.addPath("preload", Resources.PATH_TILESET);
    Game.addPath("load", Resources.PATH_JUMP);
    Game.addPath("load", Resources.PATH_DEAD);
    Game.addPath("load", Resources.PATH_FIRE);
    Game.addPath("load", Resources.PATH_ICE);
    Game.addPath("load", Resources.PATH_SWITCH);
    Game.addPath("load", Resources.PATH_MUSIC);
    Game.addAction("preinit", function () {
        Resources.texture = Engine.Texture.load(Resources.PATH_TEXTURE_GRAPHICS_0);
        Resources.texture.preserved = true;
    });
    Game.addAction("configure", function () {
        Resources.audioPlayerJump = new Engine.AudioPlayer(Resources.PATH_JUMP);
        Resources.audioPlayerJump.preserved = true;
        Resources.audioPlayerDead = new Engine.AudioPlayer(Resources.PATH_DEAD);
        Resources.audioPlayerDead.preserved = true;
        Resources.audioPlayerFire = new Engine.AudioPlayer(Resources.PATH_FIRE);
        Resources.audioPlayerFire.preserved = true;
        Resources.audioPlayerIce = new Engine.AudioPlayer(Resources.PATH_ICE);
        Resources.audioPlayerIce.preserved = true;
        Resources.audioPlayerSwitch = new Engine.AudioPlayer(Resources.PATH_SWITCH);
        Resources.audioPlayerSwitch.preserved = true;
        Resources.audioPlayerMusic = new Engine.AudioPlayer(Resources.PATH_MUSIC);
        Resources.audioPlayerMusic.preserved = true;
        Resources.audioPlayerMusic.loopEnd = 54.85;
    });
})(Game || (Game = {}));
var Utils;
(function (Utils) {
    var AnchorAlignment;
    (function (AnchorAlignment) {
        AnchorAlignment[AnchorAlignment["NONE"] = 0] = "NONE";
        AnchorAlignment[AnchorAlignment["START"] = 1] = "START";
        AnchorAlignment[AnchorAlignment["MIDDLE"] = 2] = "MIDDLE";
        AnchorAlignment[AnchorAlignment["END"] = 3] = "END";
    })(AnchorAlignment = Utils.AnchorAlignment || (Utils.AnchorAlignment = {}));
    var Anchor = /** @class */ (function (_super) {
        __extends(Anchor, _super);
        function Anchor() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._xAlignView = AnchorAlignment.NONE;
            _this._yAlignView = AnchorAlignment.NONE;
            _this._xAlignBounds = AnchorAlignment.NONE;
            _this._yAlignBounds = AnchorAlignment.NONE;
            _this._xAligned = 0;
            _this._yAligned = 0;
            return _this;
        }
        Object.defineProperty(Anchor.prototype, "bounds", {
            get: function () {
                return this._bounds;
            },
            set: function (value) {
                this._bounds = value;
                this.fix();
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "xAlignView", {
            get: function () {
                return this._xAlignView;
            },
            set: function (value) {
                this._xAlignView = value;
                this.fix();
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "yAlignView", {
            get: function () {
                return this._yAlignView;
            },
            set: function (value) {
                this._yAlignView = value;
                this.fix();
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "xAlignBounds", {
            get: function () {
                return this._xAlignBounds;
            },
            set: function (value) {
                this._xAlignBounds = value;
                this.fix();
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "yAlignBounds", {
            get: function () {
                return this._yAlignBounds;
            },
            set: function (value) {
                this._yAlignBounds = value;
                this.fix();
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "xAligned", {
            get: function () {
                return this._xAligned;
            },
            set: function (value) {
                this._xAligned = value;
                this.fix();
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "yAligned", {
            get: function () {
                return this._yAligned;
            },
            set: function (value) {
                this._yAligned = value;
                this.fix();
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "x", {
            get: function () {
                return this._bounds.x;
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(Anchor.prototype, "y", {
            get: function () {
                return this._bounds.y;
            },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(Anchor.prototype, "ready", {
            get: function () {
                return this._bounds != null && this._xAlignView != AnchorAlignment.NONE && this._xAlignBounds != AnchorAlignment.NONE && this._yAlignView != AnchorAlignment.NONE && this._yAlignBounds != AnchorAlignment.NONE;
            },
            enumerable: true,
            configurable: true
        });
        Anchor.prototype.fix = function () {
            this.xFix();
            this.yFix();
        };
        Anchor.prototype.xFix = function () {
            if (this._bounds != null && this._xAlignView != AnchorAlignment.NONE && this._xAlignBounds != AnchorAlignment.NONE) {
                var x = 0;
                switch (this._xAlignView) {
                    case AnchorAlignment.START:
                        x = -Engine.Renderer.xSizeView * 0.5 + this._xAligned;
                        switch (this._xAlignBounds) {
                            case AnchorAlignment.START:
                                break;
                            case AnchorAlignment.MIDDLE:
                                x -= this._bounds.xSize * this._bounds.xScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                x -= this._bounds.xSize * this._bounds.xScale;
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    case AnchorAlignment.MIDDLE:
                        x = this._xAligned;
                        switch (this._xAlignBounds) {
                            case AnchorAlignment.START:
                                break;
                            case AnchorAlignment.MIDDLE:
                                x -= this._bounds.xSize * this._bounds.xScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                x -= this._bounds.xSize * this._bounds.xScale;
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    case AnchorAlignment.END:
                        x = Engine.Renderer.xSizeView * 0.5 + this._xAligned - (this._bounds.xSize * this._bounds.xScale);
                        switch (this._xAlignBounds) {
                            case AnchorAlignment.START:
                                x += this._bounds.xSize * this._bounds.xScale;
                                break;
                            case AnchorAlignment.MIDDLE:
                                x += this._bounds.xSize * this._bounds.xScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    default:
                        console.log("ERROR");
                        break;
                }
                this._bounds.x = x;
            }
        };
        Anchor.prototype.yFix = function () {
            if (this._bounds != null && this._yAlignView != AnchorAlignment.NONE && this._yAlignBounds != AnchorAlignment.NONE) {
                var y = 0;
                switch (this._yAlignView) {
                    case AnchorAlignment.START:
                        y = -Engine.Renderer.ySizeView * 0.5 + this._yAligned;
                        switch (this._yAlignBounds) {
                            case AnchorAlignment.START:
                                break;
                            case AnchorAlignment.MIDDLE:
                                y -= this._bounds.ySize * this._bounds.yScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                y -= this._bounds.ySize * this._bounds.yScale;
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    case AnchorAlignment.MIDDLE:
                        y = this._yAligned;
                        switch (this._yAlignBounds) {
                            case AnchorAlignment.START:
                                break;
                            case AnchorAlignment.MIDDLE:
                                y -= this._bounds.ySize * this._bounds.yScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                y -= this._bounds.ySize * this._bounds.yScale;
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    case AnchorAlignment.END:
                        y = Engine.Renderer.ySizeView * 0.5 + this._yAligned - (this._bounds.ySize * this._bounds.yScale);
                        switch (this._yAlignBounds) {
                            case AnchorAlignment.START:
                                y += this._bounds.ySize * this._bounds.yScale;
                                break;
                            case AnchorAlignment.MIDDLE:
                                y += this._bounds.ySize * this._bounds.yScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    default:
                        console.log("ERROR");
                        break;
                }
                this._bounds.y = y;
            }
        };
        Anchor.prototype.setFullPosition = function (xAlignView, yAlignView, xAlignBounds, yAlignBounds, xAligned, yAligned) {
            this._xAlignView = xAlignView;
            this._yAlignView = yAlignView;
            this._xAlignBounds = xAlignBounds;
            this._yAlignBounds = yAlignBounds;
            this._xAligned = xAligned;
            this._yAligned = yAligned;
            this.fix();
            return this;
        };
        //@ts-ignore
        Anchor.prototype.onViewUpdateAnchor = function () {
            this.fix();
        };
        return Anchor;
    }(Engine.Entity));
    Utils.Anchor = Anchor;
})(Utils || (Utils = {}));
///<reference path="Anchor.ts"/>
var Utils;
(function (Utils) {
    var Text = /** @class */ (function (_super) {
        __extends(Text, _super);
        function Text() {
            var _this = _super.call(this) || this;
            _this.sprites = new Array();
            _this.front = false;
            _this._enabled = false;
            _this._pinned = false;
            _this._str = null;
            _this._font = null;
            _this._underlined = false;
            _this._scale = 1;
            _this._bounds = new Engine.Sprite();
            _this.underline = new Engine.Sprite();
            _this.underline2 = new Engine.Sprite();
            _this.underline2.setRGBA(0, 0, 0, 1);
            _this._bounds.setRGBA(1, 1, 1, 0.2);
            return _this;
        }
        Text.prototype.setEnabled = function (value) {
            this._enabled = value;
            this._bounds.enabled = value;
            for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.enabled = value;
            }
            if (this._underlined) {
                this.underline.enabled = value;
                this.underline2.enabled = value;
            }
        };
        Object.defineProperty(Text.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "pinned", {
            get: function () {
                return this._pinned;
            },
            set: function (value) {
                this._pinned = value;
                this._bounds.pinned = value;
                for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                    var sprite = _a[_i];
                    sprite.pinned = value;
                }
                if (this._underlined) {
                    this.underline.pinned = value;
                    this.underline2.pinned = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "str", {
            get: function () {
                return this._str;
            },
            set: function (value) {
                this._str = value;
                this.fixStr();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "font", {
            get: function () {
                return this._font;
            },
            set: function (value) {
                this._font = value;
                this.fixStr();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "underlined", {
            get: function () {
                return this._underlined;
            },
            set: function (value) {
                this._underlined = value;
                this.fixStr();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "scale", {
            get: function () {
                return this._scale;
            },
            set: function (value) {
                this._scale = value;
                this.fixStr();
            },
            enumerable: true,
            configurable: true
        });
        Text.prototype.fixStr = function () {
            if (this._str != null && this._font != null) {
                for (var indexSprite = this.sprites.length; indexSprite < this._str.length; indexSprite += 1) {
                    this.sprites.push(new Engine.Sprite());
                }
                var xSizeText = 0;
                for (var indexChar = 0; indexChar < this._str.length; indexChar += 1) {
                    var sprite = this.sprites[indexChar];
                    sprite.enabled = this._enabled;
                    sprite.pinned = this._pinned;
                    var charDef = this._font.charDefs[this._str.charCodeAt(indexChar) - " ".charCodeAt(0)];
                    sprite.setFull(this._enabled, this._pinned, this._font.texture, charDef.xSize * this._scale, this._font.ySize * this._scale, 0, 0, charDef.xTexture, charDef.yTexture, charDef.xSize, this._font.ySize);
                    xSizeText += sprite.xSize + this._font.xSeparation * this._scale;
                }
                this._bounds.enabled = this._enabled;
                this._bounds.pinned = this._pinned;
                this._bounds.xSize = xSizeText - this._font.xSeparation * this._scale;
                this._bounds.ySize = this._font.ySize * this._scale;
                if (this._underlined) {
                    this.underline.enabled = this._enabled;
                    this.underline.pinned = this._pinned;
                    this.underline.xSize = this._bounds.xSize;
                    this.underline.ySize = this._scale;
                    this.underline2.enabled = this._enabled;
                    this.underline2.pinned = this._pinned;
                    this.underline2.xSize = this._bounds.xSize;
                    this.underline2.ySize = this._scale;
                    this._bounds.ySize += this._scale * 2;
                }
                this.fix();
            }
        };
        Text.prototype.fix = function () {
            _super.prototype.fix.call(this);
            if (this._str != null && this._font != null && this.ready) {
                var x = this._bounds.x;
                for (var indexChar = 0; indexChar < this._str.length; indexChar += 1) {
                    var sprite = this.sprites[indexChar];
                    sprite.x = x;
                    sprite.y = this._bounds.y;
                    x += sprite.xSize + this._font.xSeparation * this._scale;
                }
                if (this._underlined) {
                    this.underline.x = this._bounds.x;
                    this.underline.y = this._bounds.y + this._bounds.ySize - this.scale;
                    this.underline2.x = this._bounds.x + this.scale;
                    this.underline2.y = this._bounds.y + this._bounds.ySize;
                }
            }
        };
        Text.prototype.onViewUpdateText = function () {
            this.fix();
        };
        Text.prototype.onDrawText = function () {
            if (!this.front) {
                //this._bounds.render();
                for (var indexSprite = 0; indexSprite < this.sprites.length; indexSprite += 1) {
                    this.sprites[indexSprite].render();
                }
                if (this._underlined) {
                    this.underline.render();
                    this.underline2.render();
                }
            }
        };
        Text.prototype.onDrawTextFront = function () {
            if (this.front) {
                //this._bounds.render();
                for (var indexSprite = 0; indexSprite < this.sprites.length; indexSprite += 1) {
                    this.sprites[indexSprite].render();
                }
                if (this._underlined) {
                    this.underline.render();
                    this.underline2.render();
                }
            }
        };
        return Text;
    }(Utils.Anchor));
    Utils.Text = Text;
})(Utils || (Utils = {}));
///<reference path="../Utils/Text.ts"/>
var Game;
(function (Game) {
    var TextButton = /** @class */ (function (_super) {
        __extends(TextButton, _super);
        function TextButton() {
            var _this = _super.call(this) || this;
            _this.font = Game.Font.instance;
            _this.button = new Game.ArrowButton();
            _this.button.owner = _this;
            _this.button.bounds = _this._bounds;
            return _this;
            /*
            this.button.listener = this;
            this.button.onEnableDelegate = this.onEnable;
            this.button.onDisableDelegate = this.onDisable;
            this.button.onPointerEnterDelegate = this.onPointerEnter;
            this.button.onPointerExitDelegate = this.onPointerExit;
            this.button.onActionDelegate = this.onAction;
            */
        }
        Object.defineProperty(TextButton.prototype, "keys", {
            get: function () {
                return this.button.keys;
            },
            set: function (value) {
                this.button.keys = value;
            },
            enumerable: true,
            configurable: true
        });
        TextButton.prototype.setEnabled = function (value) {
            _super.prototype.setEnabled.call(this, value);
            this.button.enabled = value;
        };
        Object.defineProperty(TextButton.prototype, "selected", {
            get: function () {
                return this.button.selected;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextButton.prototype, "used", {
            get: function () {
                return this.button.used;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextButton.prototype, "interactable", {
            get: function () {
                return this.button.interactable;
            },
            set: function (value) {
                this.button.interactable = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextButton.prototype, "url", {
            get: function () {
                return this.button.url;
            },
            set: function (value) {
                this.button.url = value;
            },
            enumerable: true,
            configurable: true
        });
        TextButton.prototype.onStepUpdate = function () {
        };
        return TextButton;
    }(Utils.Text));
    Game.TextButton = TextButton;
})(Game || (Game = {}));
var Utils;
(function (Utils) {
    var Animation = /** @class */ (function () {
        function Animation() {
            this.loop = false;
        }
        return Animation;
    }());
    Utils.Animation = Animation;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
    var AnimationFrame = /** @class */ (function () {
        function AnimationFrame() {
            this.xSize = 0;
            this.ySize = 0;
            this.xOffset = 0;
            this.yOffset = 0;
            this.xTexture = 0;
            this.yTexture = 0;
            this.xSizeTexture = 0;
            this.ySizeTexture = 0;
        }
        return AnimationFrame;
    }());
    Utils.AnimationFrame = AnimationFrame;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
    var Animator = /** @class */ (function (_super) {
        __extends(Animator, _super);
        function Animator() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.indexFrame = 0;
            _this.countSteps = 0;
            _this.cycles = 0;
            return _this;
        }
        Object.defineProperty(Animator.prototype, "ended", {
            get: function () {
                return this.cycles > 0;
            },
            enumerable: true,
            configurable: true
        });
        Animator.prototype.setFrame = function () {
            var frame = this.animation.frames[this.indexFrame];
            this.sprite.setFull(this.sprite.enabled, this.sprite.pinned, frame.texture, frame.xSize, frame.ySize, frame.xOffset, frame.yOffset, frame.xTexture, frame.yTexture, frame.xSizeTexture, frame.ySizeTexture);
            if (this.listener != null) {
                this.listener.onSetFrame(this, this.animation, frame);
            }
        };
        Animator.prototype.setAnimation = function (animation, preserveStatus) {
            this.animation = animation;
            if (!preserveStatus) {
                this.indexFrame = 0;
                this.countSteps = 0;
            }
            this.cycles = 0;
            this.setFrame();
        };
        Animator.prototype.onAnimationUpdate = function () {
            if (Game.Scene.nextSceneClass == null && this.animation != null && (this.animation.loop || this.cycles < 1)) {
                if (this.countSteps >= this.animation.steps) {
                    this.countSteps = 0;
                    this.indexFrame += 1;
                    if (this.indexFrame >= this.animation.frames.length) {
                        this.indexFrame = this.animation.loop ? 0 : this.animation.frames.length - 1;
                        this.cycles += 1;
                    }
                    this.setFrame();
                }
                this.countSteps += 1;
            }
        };
        return Animator;
    }(Engine.Entity));
    Utils.Animator = Animator;
})(Utils || (Utils = {}));
/*
var Game = Game || {};
(function(Engine, System, Game){
    Game.createBox = function(enabled, pinned, x, y, xSize, ySize, red, green, blue, alpha){
        var sprite = new Engine.Sprite();
        sprite.enabled = enabled;
        sprite.pinned = pinned;
        sprite.x = x;
        sprite.y = y;
        sprite.xSize = xSize;
        sprite.ySize = ySize;
        sprite.red = red;
        sprite.green = green;
        sprite.blue = blue;
        sprite.alpha = alpha;
        return sprite;
    };
})(Engine, System, Game);
*/ 
var Utils;
(function (Utils) {
    var Dialog = /** @class */ (function (_super) {
        __extends(Dialog, _super);
        function Dialog() {
            var _this = _super.call(this) || this;
            _this._enabled = false;
            _this._pinned = false;
            _this._bounds = new Engine.Sprite();
            _this.up = new Engine.Sprite();
            _this.down = new Engine.Sprite();
            _this.left = new Engine.Sprite();
            _this.right = new Engine.Sprite();
            _this.center = new Engine.Sprite();
            _this.center.setRGBA(0, 0, 0, 1);
            return _this;
        }
        Dialog.prototype.setEnabled = function (value) {
            this._enabled = value;
            this.up.enabled = value;
            this.down.enabled = value;
            this.left.enabled = value;
            this.right.enabled = value;
            this.center.enabled = value;
        };
        Object.defineProperty(Dialog.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: true,
            configurable: true
        });
        Dialog.prototype.setPinned = function (value) {
            this._pinned = value;
            this.up.pinned = value;
            this.down.pinned = value;
            this.left.pinned = value;
            this.right.pinned = value;
            this.center.pinned = value;
        };
        Object.defineProperty(Dialog.prototype, "pinned", {
            get: function () {
                return this._pinned;
            },
            set: function (value) {
                this.setPinned(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Dialog.prototype, "xSize", {
            set: function (value) {
                this._bounds.xSize = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Dialog.prototype, "ySize", {
            set: function (value) {
                this._bounds.ySize = value;
            },
            enumerable: true,
            configurable: true
        });
        Dialog.prototype.fix = function () {
            _super.prototype.fix.call(this);
            if (this.ready) {
                this.up.x = this._bounds.x + 1;
                this.up.y = this._bounds.y;
                this.up.xSize = this._bounds.xSize - 2;
                this.up.ySize = 1;
                //Down            
                this.down.x = this._bounds.x + 1;
                this.down.y = this._bounds.y + this._bounds.ySize - 1;
                this.down.xSize = this._bounds.xSize - 2;
                this.down.ySize = 1;
                //Left
                this.left.x = this._bounds.x;
                this.left.y = this._bounds.y + 1;
                this.left.xSize = 1;
                this.left.ySize = this._bounds.ySize - 2;
                //Right
                this.right.x = this._bounds.x + this._bounds.xSize - 1;
                this.right.y = this._bounds.y + 1;
                this.right.xSize = 1;
                this.right.ySize = this._bounds.ySize - 2;
                //Center
                this.center.x = this._bounds.x + 1;
                this.center.y = this._bounds.y + 1;
                this.center.xSize = this._bounds.xSize - 2;
                this.center.ySize = this._bounds.ySize - 2;
            }
        };
        Dialog.prototype.onDrawDialogs = function () {
            this.left.render();
            this.right.render();
            this.up.render();
            this.down.render();
            this.center.render();
        };
        return Dialog;
    }(Utils.Anchor));
    Utils.Dialog = Dialog;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
    var Emitter = /** @class */ (function (_super) {
        __extends(Emitter, _super);
        function Emitter() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.active = false;
            _this.particles = new Array();
            _this.countSteps = 0;
            _this.indexParticle = 0;
            _this.emissionSteps = 0;
            _this.x = 0;
            _this.y = 0;
            _this.xMin = 0;
            _this.xMax = 0;
            _this.yMin = 0;
            _this.yMax = 0;
            _this.xVelMin = 0;
            _this.xVelMax = 0;
            _this.yVelMin = 0;
            _this.yVelMax = 0;
            _this.xAccelMin = 0;
            _this.xAccelMax = 0;
            _this.yAccelMin = 0;
            _this.yAccelMax = 0;
            _this.lifeParticleMin = 0;
            _this.lifeParticleMax = 0;
            _this._enabled = false;
            return _this;
        }
        Object.defineProperty(Emitter.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                for (var _i = 0, _a = this.particles; _i < _a.length; _i++) {
                    var particle = _a[_i];
                    particle.enabled = value;
                    particle.sprite.enabled = value;
                }
                this._enabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Emitter.prototype.stop = function () {
            if (!this.active) {
                return;
            }
            this.active = false;
            for (var _i = 0, _a = this.particles; _i < _a.length; _i++) {
                var particle = _a[_i];
                particle.xVel = 0;
                particle.yVel = 0;
            }
        };
        Emitter.prototype.addParticle = function (particle) {
            this.particles.push(particle);
            particle.reset();
        };
        Emitter.prototype.addParticles = function (type, count) {
            for (var indexParticle = 0; indexParticle < count; indexParticle += 1) {
                this.addParticle(new type());
            }
        };
        Emitter.prototype.reset = function () {
            this.countSteps = 0;
            this.indexParticle = 0;
            for (var _i = 0, _a = this.particles; _i < _a.length; _i++) {
                var particle = _a[_i];
                particle.reset();
            }
        };
        Emitter.prototype.onReset = function () {
            this.countSteps = 0;
            this.indexParticle = 0;
        };
        Emitter.prototype.emitParticle = function () {
            var oldIndex = this.indexParticle;
            while (this.particles[this.indexParticle].enabled) {
                this.indexParticle += 1;
                if (this.indexParticle >= this.particles.length) {
                    this.indexParticle = 0;
                }
                if (this.indexParticle == oldIndex) {
                    return;
                }
            }
            this.particles[this.indexParticle].emit(this.indexParticle, this.lifeParticleMin + (this.lifeParticleMax - this.lifeParticleMin) * Math.random(), this.x, this.y, this.xMin + (this.xMax - this.xMin) * Math.random(), this.yMin + (this.yMax - this.yMin) * Math.random(), this.xVelMin + (this.xVelMax - this.xVelMin) * Math.random(), this.yVelMin + (this.yVelMax - this.yVelMin) * Math.random(), this.xAccelMin + (this.xAccelMax - this.xAccelMin) * Math.random(), this.yAccelMin + (this.yAccelMax - this.yAccelMin) * Math.random());
            this.indexParticle += 1;
            if (this.indexParticle >= this.particles.length) {
                this.indexParticle = 0;
            }
        };
        Emitter.prototype.onStepUpdate = function () {
            if (this.active && this._enabled /* && this.indexParticle < this.particles.length */) {
                if (this.countSteps >= this.emissionSteps) {
                    this.emitParticle();
                    this.countSteps = 0;
                }
                this.countSteps += 1;
            }
        };
        return Emitter;
    }(Engine.Entity));
    Utils.Emitter = Emitter;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
    var Fade = /** @class */ (function (_super) {
        __extends(Fade, _super);
        function Fade() {
            var _this = _super.call(this) || this;
            _this.speed = 0.0166666666666667 * 4;
            _this.direction = -1;
            _this.alpha = 1;
            _this.red = 1;
            _this.green = 1;
            _this.blue = 1;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.sprite.pinned = true;
            _this.sprite.setRGBA(_this.red, _this.green, _this.blue, 1);
            _this.onViewUpdate();
            return _this;
        }
        Fade.prototype.onViewUpdate = function () {
            this.sprite.xSize = Engine.Renderer.xSizeView;
            this.sprite.ySize = Engine.Renderer.ySizeView;
            this.sprite.x = -Engine.Renderer.xSizeView * 0.5;
            this.sprite.y = -Engine.Renderer.ySizeView * 0.5;
        };
        //@ts-ignore
        Fade.prototype.onStepUpdateFade = function () {
            if (this.direction != 0) {
                this.alpha += this.speed * this.direction;
                if (this.direction < 0 && this.alpha <= 0) {
                    this.direction = 0;
                    this.alpha = 0;
                    this.sprite.setRGBA(this.red, this.green, this.blue, 0);
                }
                else if (this.direction > 0 && this.alpha >= 1) {
                    this.direction = 0;
                    this.alpha = 1;
                    this.sprite.setRGBA(this.red, this.green, this.blue, 1);
                }
            }
        };
        //@ts-ignore
        Fade.prototype.onDrawFade = function () {
            if (this.direction != 0) {
                var extAlpha = this.alpha + this.speed * this.direction * Engine.System.stepExtrapolation;
                if (this.direction < 0 && extAlpha < 0) {
                    extAlpha = 0;
                }
                else if (this.direction > 0 && extAlpha > 1) {
                    extAlpha = 1;
                }
                this.sprite.setRGBA(this.red, this.green, this.blue, extAlpha);
            }
            this.sprite.render();
        };
        return Fade;
    }(Engine.Entity));
    Utils.Fade = Fade;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
    var FillBar = /** @class */ (function (_super) {
        __extends(FillBar, _super);
        function FillBar() {
            var _this = _super.call(this) || this;
            _this.fill = new Engine.Sprite();
            return _this;
        }
        FillBar.prototype.setEnabled = function (value) {
            _super.prototype.setEnabled.call(this, value);
            this.fill.enabled = value;
        };
        FillBar.prototype.setPinned = function (value) {
            _super.prototype.setPinned.call(this, value);
            this.fill.pinned = value;
        };
        FillBar.prototype.fix = function () {
            _super.prototype.fix.call(this);
            this.fill.x = this.center.x;
            this.fill.y = this.center.y;
            this.fill.xSize = this.center.xSize;
            this.fill.ySize = this.center.ySize;
        };
        FillBar.prototype.onDrawDialogs = function () {
            this.onDrawDialogs();
            this.fill.xScale = this.watchedObject[this.watchedProp];
            this.fill.render();
        };
        return FillBar;
    }(Utils.Dialog));
    Utils.FillBar = FillBar;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
    var Shake = /** @class */ (function (_super) {
        __extends(Shake, _super);
        function Shake() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Shake.prototype, "ended", {
            get: function () {
                return this.position == 0 && this.direction == 0;
            },
            enumerable: true,
            configurable: true
        });
        Shake.prototype.start = function (direction) {
            this.position = 0;
            this.countDistance = this.distance;
            this.direction = direction;
        };
        Shake.prototype.stop = function () {
            this.position = 0;
            this.direction = 0;
        };
        //@ts-ignore
        Shake.prototype.onReset = function () {
            this.position = 0;
            this.direction = 0;
        };
        //@ts-ignore
        Shake.prototype.onStepUpdate = function () {
            if (this.direction != 0) {
                this.position += this.velocity * this.direction;
                var change = false;
                if ((this.direction > 0 && this.position > this.countDistance) || (this.direction < 0 && this.position < -this.countDistance)) {
                    change = true;
                }
                if (change) {
                    this.position = this.countDistance * this.direction;
                    this.direction *= -1;
                    this.countDistance *= this.reduction;
                    if (this.countDistance <= this.minDistance) {
                        this.position = 0;
                        this.direction = 0;
                    }
                }
            }
        };
        return Shake;
    }(Engine.Entity));
    Utils.Shake = Shake;
})(Utils || (Utils = {}));
/*
var Game = Game || {};
(function(Engine, System, Game){
    Game.stepsToTimeText(steps){
        var textTime = "9999.999";
        if(steps != 0){
            var seconds = Math.trunc(timeSteps / 60);
            var textSeconds
        }
    };
})(Engine, System, Game);


void draw_time_text(struct game_engine_canvas * canvases, int time_steps, float x, float y){
    char text_time[] = "9999.999";
    if(time_steps != 0){
        int seconds = time_steps / 60;
        if(seconds <= 9999){
            int milliseconds = (time_steps - seconds * 60) * 1000.0 * (1.0 / 60.0);
            char text_seconds[] = "0000";
            char text_milliseconds[] = "000";
            sprintf(text_seconds, "%d", seconds);
            if(milliseconds < 10){
                sprintf(text_milliseconds, "00%d", milliseconds);
            }
            else if(milliseconds < 100){
                sprintf(text_milliseconds, "0%d", milliseconds);
            }
            else{
                sprintf(text_milliseconds, "%d", milliseconds);
            }
            strcpy(text_time, text_seconds);
            strcat(text_time, ".");
            strcat(text_time, text_milliseconds);
        }
    }
    prepare_text(canvases, text_time, x, y, 1, 1, 1);
    draw_canvases(canvases, strlen(text_time));
}
*/ 
/*
var Game = Game || {};
(function(Engine, System, Game){
    var Video = function(){
        
    };
    
    Game.Video = Video;
})(Engine, System, Game);
*/ 