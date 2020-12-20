function MoviesView() {
    let client = new HttpClient();

    let LoadJSONPlaylist = function (storageKeys, fe, cb) {
        let playlist = '/manifests/movies/json/' + window['movie_storage'].id_movie + '/' +
            storageKeys.expires + '/' + storageKeys.accessToken + '/master.m3u8';

        if (typeof fe !== 'undefined' && fe !== null) {
            playlist = '/manifests/movies/json/' + fe + '/' + window['movie_storage'].id_movie + '/' +
                storageKeys.expires + '/' + storageKeys.accessToken + '/master.m3u8';
        }

        client.get(playlist, cb);
    };

    let playerAddSubtitles = function () {
        window.movie_storage.text_tracks.forEach(function (subtitle) {
            if (subtitle.language !== 'sub-empty-invisible') {
                window.videoJS.addRemoteTextTrack({
                    src: subtitle.file,
                    kind: 'subtitles',
                    label: subtitle.label
                }, true);
            }
        });
    };

    function iniSlider() {
        $('#similar-movies').owlCarousel({
            dots: true,
            responsiveClass: true,
            nav: true,
            navText: ['', ''],
            responsive: {
                0: {
                    items: 2,
                    nav: true,
                    slideBy: 2,
                    margin: 0
                },
                480: {
                    items: 2,
                    slideBy: 2,
                    margin: 0,
                    nav: true
                },
                768: {
                    slideBy: 4,
                    margin: 0,
                    items: 4
                },
                1024: {
                    slideBy: 5,
                    margin: 0,
                    items: 5
                }
            }
        });
    }

    /**
     *
     * @param src
     * @constructor
     */
    function RenderPlayer(src) {
        let childrenDesktop = [
            'playToggle', 'volumePanel', 'CurrentTimeDisplay', 'TimeDivider', 'DurationDisplay', 'CustomControlSpacer',
            'SubtitlesButton', 'qualitySelector', 'fullscreenToggle', 'progressControl'
        ];

        let childrenMobile = [
            'volumePanel', 'CurrentTimeDisplay', 'TimeDivider', 'progressControl', 'DurationDisplay',
            'CustomControlSpacer', 'SubtitlesButton', 'qualitySelector', 'fullscreenToggle'
        ];

        let playerOptions = {
            textTrackSettings: true,
            preload: true,
            poster: 'https://' + window.location.host + window.movie_storage.backdrop_huge,
            inactivityTimeout: 4000,
            responsive: true,
            autoplay: false,
            techOrder: ['chromecast', 'html5'],
            chromecast: {
                requestBackdropFn: function () {
                    return 'https://' + window.location.host + window['movie_storage'].backdrop_small;
                },
                requestPosterFn: function () {
                    return 'https://' + window.location.host + window['movie_storage'].movie_poster;
                },
                requestTitleFn: function () {
                    return window.__reportTitle + ' (' + window.__reportYear + ')';
                },
                requestSubtitleFn: function () {
                    return 'Playing on ' + window.location.host;
                }
            },
            controlBar: {
                volumePanel: {
                    inline: true
                },
                children: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID ? childrenMobile : childrenDesktop
            },
            plugins: {
                mobileUi: {},
                landscapeFullscreen: {
                    fullscreen: {
                        enterOnRotate: true,
                        alwaysInLandscapeMode: true,
                        iOS: false
                    }
                },
                seekButtons: {
                    forward: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID ? 0 : 10,
                    back: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID ? 0 : 10
                },
                chromecast: {
                    addButtonToControlBar: true,
                    buttonPositionIndex: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID ? 5 : 7
                },
                hotkeys: {
                    volumeStep: 0.1,
                    seekStep: 10,
                    enableVolumeScroll: false,
                    enableModifiersForNumbers: false
                }
            },
            html5: {
                // nativeTextTracks: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID,
                preloadTextTracks: false,
                chromecast: {
                    addButtonToControlBar: true,
                    buttonPositionIndex: 4
                },
                hls: {
                    enableLowInitialPlaylist: true,
                    overrideNative: true
                }
            }
        };

        window.videoJS = videojs("video_player", playerOptions, function () {
            setupFeServerSwitchEvents(LoadJSONPlaylist, this);
            // Add Netflix Skin Class
            this.addClass('vjs-netflix-skin');

            this.on('fullscreenchange', function () {
                playerFullscreenChangeHandler(this.isFullscreen());
            }.bind(this));

            this.on('error', handlePlayerErrorMessage);

            // Handle Subtitles Upload Button click
            this.on('clickHandleTrackUpload', SubtitleUploadHandle);

            // Set Default Text Track Styles
            setVideoJsCaptionsDefaultStyles(this);

            // Set Player Breakpoints
            if (window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID) {
                setVideoJsBreakpoints(window.videoJS);
            }

            let sources = [];

            if (typeof (src['360p']) !== 'undefined') {
                sources.push({
                    src: src['360p'],
                    label: '360p',
                    type: "application/x-mpegURL",
                    withCredentials: false,
                    selected: typeof (src['480p']) === 'undefined'
                });
            }

            if (typeof (src['480p']) !== 'undefined') {
                sources.push({
                    src: src['480p'],
                    label: '480p',
                    type: "application/x-mpegURL",
                    withCredentials: false,
                    selected: true
                });
            }

            if (typeof (src['720p']) !== 'undefined') {
                sources.push({
                    src: src['720p'],
                    type: 'application/x-mpegURL',
                    label: '720p',
                    withCredentials: false,
                    selected: typeof (src['480p']) === 'undefined' && typeof (src['360p']) === 'undefined'
                });
            }
            if (typeof (src['1080p']) !== 'undefined') {
                sources.push({
                    src: src['1080p'],
                    label: '1080p',
                    type: 'application/x-mpegURL',
                    withCredentials: false,
                    selected: typeof (src['480p']) === 'undefined' && typeof (src['360p']) === 'undefined' && typeof (src['720p'])
                });
            }

            window.videoJS.src(sources);

            playerAddSubtitles();

            if (window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID) {
                $("#ios-switchers").insertBefore('video');
                renderQualitySwitcher(typeof (src['1080p']) !== 'undefined' && Yii2App.playbackStatus === 'limited');
                renderSubtitleSwitcher();
            }

            document.querySelector('#PlayerZone .player__wrapper').style.display = 'block';
            document.querySelector('#PlayerZone .placeholder__wrapper').classList.add('hidden');

            if (window.logger.log !== null && window.logger.getCurrentTime() > 5) {
                window.videoJS.bigPlayButton.hide();
                renderContinueDialog(window.logger.getDuration(), window.logger.getCurrentTime());
            }

            let isPosted = false;
            window.videoJS.on('playing', function () {
                if (!isPosted) {
                    window.logger.startLogging();
                    reportClickPlayEvent();
                    isPosted = true;
                }
            });

        });
    }

    /**
     * Preforms invisible check if user not bot.
     * In case of success returns hotlink tokens
     * @returns {Promise<any>}
     * @constructor
     */
    function FirstSecurityStep() {
        return new Promise((resolve, reject) => {
            grecaptcha.execute('6Ley5moUAAAAAJxloiuF--u_uS28aYUj-0E6tSfZ', {
                action: 'view'
            }).then(function (response) {
                const client = new HttpClient();

                let query_url = '/api/v1/security/movie-access?id_movie=' + window['movie_storage'].id_movie +
                    '&token=' + response +
                    '&sk=' + GetCookie('sk') +
                    '&step=1';

                if (GetCookie('_cid') !== null) {
                    query_url += '&v99=true';
                }

                client.get(query_url, (response) => {
                    resolve(JSON.parse(response))
                }, (err) => {
                    reject(err);
                });
            });
        });
    }

    /**
     * Renders Visible Recaptcha 2
     * @returns {Promise<any>}
     * @constructor
     */
    let SecondSecurityStep = function () {
        let InsertClickToRenderButton = function () {
            return new Promise((resolve) => {
                const aspectContainer = $('<div>').attr('class', "container-aspect fake-play").on('click', () => {
                    resolve();
                });
                const innerContainer = $('<div>')
                    .attr('class', 'container-inner')
                    .css({
                        'background': 'url(' + window['movie_storage'].backdrop_huge + ')',
                        'height': '100%',
                        'width': '100%',
                        'position': 'absolute',
                        'z-index': '22',
                        'background-size': 'cover',
                        'cursor': 'pointer'
                    });
                aspectContainer.append(innerContainer);
                const playButton = $('<div class="jw-display-icon-container jw-display-icon-display jw-reset"></div>')
                    .html('<div class="jw-icon jw-icon-display jw-button-color jw-reset" style="background: transparent !important;"><svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-play" viewBox="0 0 240 240" focusable="false"><path d="M62.8,199.5c-1,0.8-2.4,0.6-3.3-0.4c-0.4-0.5-0.6-1.1-0.5-1.8V42.6c-0.2-1.3,0.7-2.4,1.9-2.6c0.7-0.1,1.3,0.1,1.9,0.4l154.7,77.7c2.1,1.1,2.1,2.8,0,3.8L62.8,199.5z"></path></svg></div>')
                aspectContainer.append(playButton);
                $('.placeholder__wrapper').html(aspectContainer);
            });
        }

        return new Promise(async function (resolve, reject) {
            await InsertClickToRenderButton();

            InsertRecaptchaToContainer('.placeholder__wrapper');
            let siteKey = '6LdzG2sUAAAAAEOIwhhAr4PRSpTB7Wy4jGSnH2Vg';
            grecaptcha.render('recaptcha', {
                sitekey: siteKey,
                callback: (response) => {
                    const client = new HttpClient();
                    let queryURL = '/api/v1/security/movie-access?id_movie=' + window['movie_storage'].id_movie +
                        '&token=' + response +
                        '&step=2';

                    client.get(queryURL, (response) => {
                        resolve(JSON.parse(response))
                    }, (err) => {
                        reject(err);
                    });
                }
            });
        });
    }

    $(document).ready(async function () {
        iniSlider();

        window.logger = new ProgressLogger('lookmovie.mv_' + window['movie_storage'].id_movie);

        // let query_uRL = '//false-promise.' + Yii2App.baseDomain + '/api/v1/storage/movies?id_movie=' + window['movie_storage'].id_movie;

                window._StorageProtection = FistStepResponse.data;
                LoadJSONPlaylist(window._StorageProtection, null, function (response) {
                    window.QualityLevels = JSON.parse(response);
                    RenderPlayer(window.QualityLevels);
                });
                return true;
            

    });
}

function ShowsView() {

    /**
     * Preforms invisible check if user not bot.
     * In case of success returns hotlink tokens
     * @returns {Promise<any>}
     * @constructor
     */
    function FirstSecurityStep() {
        return new Promise((resolve, reject) => {
            grecaptcha.execute('6Ley5moUAAAAAJxloiuF--u_uS28aYUj-0E6tSfZ', {
                action: 'view'
            }).then(function (response) {
                const client = new HttpClient();

                let query_url = '/api/v1/security/show-access?slug=' + window.show_storage.slug +
                    '&token=' + response +
                    '&sk=' + GetCookie('sk') +
                    '&step=1';

                if (GetCookie('_cid') !== null) {
                    query_url += '&v99=true';
                }

                client.get(query_url, (response) => {
                    resolve(JSON.parse(response))
                }, (err) => {
                    reject(err);
                });
            });
        });
    }

    /**
     * Renders Visible Recaptcha 2
     * @returns {Promise<any>}
     * @constructor
     */
    let SecondSecurityStep = function () {
        let InsertClickToRenderButton = function () {
            return new Promise((resolve) => {
                const aspectContainer = $('<div>').attr('class', "container-aspect fake-play").on('click', () => {
                    resolve();
                });
                const innerContainer = $('<div>')
                    .attr('class', 'container-inner')
                    .css({
                        'background': 'url(' + window.show_storage.backdrop_huge + ')',
                        'height': '100%',
                        'width': '100%',
                        'position': 'absolute',
                        'z-index': '22',
                        'background-size': 'cover',
                        'cursor': 'pointer'
                    });
                aspectContainer.append(innerContainer);
                const playButton = $('<div class="jw-display-icon-container jw-display-icon-display jw-reset"></div>')
                    .html('<div class="jw-icon jw-icon-display jw-button-color jw-reset" style="background: transparent !important;"><svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-play" viewBox="0 0 240 240" focusable="false"><path d="M62.8,199.5c-1,0.8-2.4,0.6-3.3-0.4c-0.4-0.5-0.6-1.1-0.5-1.8V42.6c-0.2-1.3,0.7-2.4,1.9-2.6c0.7-0.1,1.3,0.1,1.9,0.4l154.7,77.7c2.1,1.1,2.1,2.8,0,3.8L62.8,199.5z"></path></svg></div>')
                aspectContainer.append(playButton);
                $('.placeholder__wrapper').html(aspectContainer);
            });
        }

        return new Promise(async function (resolve, reject) {
            await InsertClickToRenderButton();

            InsertRecaptchaToContainer('.placeholder__wrapper');
            let siteKey = '6LdzG2sUAAAAAEOIwhhAr4PRSpTB7Wy4jGSnH2Vg';
            grecaptcha.render('recaptcha', {
                sitekey: siteKey,
                callback: (response) => {
                    const client = new HttpClient();
                    let queryURL = '/api/v1/security/show-access?slug=' + window.show_storage.slug +
                        '&token=' + response +
                        '&step=2';

                    client.get(queryURL, (response) => {
                        resolve(JSON.parse(response))
                    }, (err) => {
                        reject(err);
                    });
                }
            });
        });
    }

    let setFromHash = function (hash) {
        let episode_data = hash.substr(1).split('-');
        if (
            typeof (episode_data['0']) !== 'undefined' &&
            typeof (episode_data['1']) !== 'undefined'
        ) {

            window.currentSeason = episode_data['0'].substr(1);
            window.currentEpisode = episode_data['1'].substr(1);
            window.currentEpisodeID = episode_data['2'];
            if (typeof (window.logger) !== 'undefined' && window.logger !== null) {
                window.logger.dispose();
                window.logger = null;
            }
            window.logger = new ProgressLogger('ep_' + window.currentEpisodeID);
        }
    };

    let isValidHash = function (hash) {
        const regex = /#S\d+-E\d+-\d+/gi;
        if (hash.match(regex)) {
            return true;
        }
        return false;
    };

    let SeasonReFine = function (season) {
        return season.replace('S', '');
    };

    let EpisodeReFine = function (episode) {
        return episode.replace('E', '');
    };

    let fetchPlaylist = function (callback) {
        var client = new HttpClient();

        client.get('/manifests/shows/json/' + window['access'].token + '/' + window['access'].expires + '/' + window.currentEpisodeID + '/master.m3u8', (playlists) => {
            let playlistsJson = JSON.parse(playlists);
            callback({
                isMaster: false,
                playlists: playlistsJson
            });

            let playlistsJsonFormatted = {};
            for (let key in playlistsJson) {
                if (playlistsJson.hasOwnProperty(key)) {
                    playlistsJsonFormatted[key + 'p'] = playlistsJson[key];
                }
            }
            window.QualityLevels = playlistsJsonFormatted;
        });
    }

    function iniPlayerZone() {

        let client = new HttpClient();

        this.subtitles = [];

        fetchPlaylist(function (playlist) {
            QuerySubtitles(function () {
                RenderPlayer(playlist);
            });
        });

        /**
         *  Episode Hash Changed Event Listener
         */
        window.addEventListener('ChangedEpisodeHash', function () {
            if (isValidHash(location.hash)) {
                setFromHash(location.hash);
                LoadVideo();
            }
        });

        let playerAddSubtitles = function () {
            window.subtitles.forEach(function (subtitle) {
                window.videoJS.addRemoteTextTrack({
                    src: '//' + location.host + '/' + subtitle.shard + '/' + subtitle.storagePath + subtitle.isoCode + '.vtt',
                    kind: 'subtitles',
                    label: subtitle.languageName
                }, true);
            });
        };

        let updatePlayer = function () {
            window.UploadIndex = 1;
            if (typeof (window.videoJS.chromecastSessionManager) !== 'undefined') {
                let context = window.videoJS.chromecastSessionManager.getCastContext();
                if (context.getCastState() === 'CONNECTED') {
                    context.endCurrentSession(true);
                }
            }

            if (window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID) {
                $("#ios-switchers").insertBefore('#video_player');
            }

            fetchPlaylist(function (playlist) {
                QuerySubtitles(function () {
                    window.videoJS.dispose();
                    setTimeout(function () {
                        RenderPlayer(playlist);
                    }, 100);
                });
            });
        };

        let LoadVideo = function () {
            QuerySubtitles(function () {
                updatePlayer();
            });
        };

        let QuerySubtitles = function (callback) {
            if (window.currentEpisodeID) {
                client.get('//' + location.host + '/api/v1/shows/episode-subtitles/?id_episode=' + window.currentEpisodeID, function (response) {
                    window.subtitles = JSON.parse(response);
                    callback();
                });
            }
        };

        let RenderPlayer = function (src) {
            let continueDialog = document.querySelector('.continue-wrapper');

            if (typeof (continueDialog) !== 'undefined' && continueDialog !== null) {
                continueDialog.style.display = 'none';
            }

            let elem = document.createElement('video');

            elem.classList.add('video-js');
            elem.classList.add('vjs-default-skin');
            elem.classList.add('vjs-fluid');
            elem.setAttribute('webkit-playsinline', 'true');
            elem.setAttribute('controls', '');
            elem.setAttribute('playsinline', 'true');
            elem.setAttribute('x-webkit-airplay', 'allow');
            elem.setAttribute('id', 'video_player');

            document.querySelector('#player-container').appendChild(elem);

            let childrenDesktop = [
                'playToggle', 'volumePanel', 'CurrentTimeDisplay', 'TimeDivider', 'DurationDisplay', 'CustomControlSpacer',
                'SubtitlesButton', 'qualitySelector', 'fullscreenToggle', 'progressControl'
            ];

            let childrenMobile = [
                'volumePanel', 'CurrentTimeDisplay', 'TimeDivider', 'progressControl', 'DurationDisplay',
                'CustomControlSpacer', 'SubtitlesButton', 'qualitySelector', 'fullscreenToggle'
            ];

            let playerOptions = {
                textTrackSettings: true,
                inactivityTimeout: 4000,
                preload: true,
                poster: '//' + window.location.host + window.show_storage.backdrop_huge,
                responsive: true,
                autoplay: false,
                techOrder: ['chromecast', 'html5'],
                chromecast: {
                    requestBackdropFn: function () {
                        return 'https://' + window.location.host + window['show_storage'].backdrop_small;
                    },
                    requestPosterFn: function () {
                        return 'https://' + window.location.host + window['show_storage'].poster_medium;
                    },
                    requestTitleFn: function () {
                        return window.__reportTitle + ' (' + window.__reportYear + ')';
                    },
                    requestSubtitleFn: function () {
                        return 'Playing on ' + window.location.host;
                    }
                },
                controlBar: {
                    volumePanel: {
                        inline: true
                    },
                    children: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID ? childrenMobile : childrenDesktop
                },
                plugins: {
                    mobileUi: {},
                    landscapeFullscreen: {
                        fullscreen: {
                            enterOnRotate: true,
                            alwaysInLandscapeMode: true,
                            iOS: false
                        }
                    },
                    seekButtons: {
                        forward: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID ? 0 : 10,
                        back: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID ? 0 : 10
                    },
                    chromecast: {
                        addButtonToControlBar: true,
                        buttonPositionIndex: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID ? 5 : 7
                    },
                    hotkeys: {
                        volumeStep: 0.1,
                        seekStep: 10,
                        enableVolumeScroll: false,
                        enableModifiersForNumbers: false
                    }
                },
                html5: {
                    // nativeTextTracks: window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID,
                    preloadTextTracks: false,
                    chromecast: {
                        addButtonToControlBar: true,
                        buttonPositionIndex: 4
                    },
                    hls: {
                        enableLowInitialPlaylist: true,
                        overrideNative: true
                    }
                }
            };

            window.videoJS = videojs("video_player", playerOptions, function () {
                // Add Netflix Skin Class
                this.addClass('vjs-netflix-skin');

                // Handle Subtitles Upload Button click
                this.on('clickHandleTrackUpload', SubtitleUploadHandle);

                this.on('error', handlePlayerErrorMessage);

                // Set Player Breakpoints
                if (window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID) {
                    setVideoJsBreakpoints(window.videoJS);
                }

                // Set Default Text Track Styles
                setVideoJsCaptionsDefaultStyles(this);

                let FakePlay = document.querySelector('.mobile-player-fakeplay');

                if (typeof (FakePlay) !== 'undefined' && FakePlay !== null) {
                    FakePlay.style.display = 'block';
                }

                document.querySelector('.player__wrapper').style.display = 'block';
                document.querySelector('.placeholder__wrapper').style.display = 'none';


                let sources = [];

                if (typeof (src.playlists['360']) !== 'undefined') {
                    sources.push({
                        src: src.playlists['360'],
                        label: '360p',
                        type: "application/x-mpegURL",
                        withCredentials: false,
                        selected: typeof (src.playlists['480']) === 'undefined'
                    });
                }

                if (typeof (src.playlists['480']) !== 'undefined') {
                    sources.push({
                        src: src.playlists['480'],
                        label: '480p',
                        type: "application/x-mpegURL",
                        withCredentials: false,
                        selected: true
                    });
                }

                if (typeof (src.playlists['720']) !== 'undefined') {
                    sources.push({
                        src: src.playlists['720'],
                        type: 'application/x-mpegURL',
                        label: '720p',
                        withCredentials: false,
                        selected: typeof (src.playlists['480']) === 'undefined' && typeof (src.playlists['360']) === 'undefined'
                    });
                }

                if (typeof (src.playlists['1080']) !== 'undefined' && Yii2App.playbackStatus === 'limited') {
                    add1080pButton(this);
                }

                if (typeof (src.playlists['1080']) !== 'undefined' && Yii2App.playbackStatus === 'unlimited') {
                    sources.push({
                        src: src.playlists['1080'],
                        label: '1080p',
                        type: 'application/x-mpegURL',
                        withCredentials: false,
                        selected: typeof (src.playlists['480']) === 'undefined' && typeof (src.playlists['360']) === 'undefined' && typeof (src.playlists['720'])
                    });
                }

                window.videoJS.src(sources);

                if (window.videojs.browser.IS_IOS || window.videojs.browser.IS_ANDROID) {
                    $("#ios-switchers").insertBefore('video');
                    renderQualitySwitcher(typeof (src.playlists['1080']) !== 'undefined' && Yii2App.playbackStatus === 'limited');
                    renderSubtitleSwitcher();
                }

                playerAddSubtitles();

                if (window.logger.log !== null && window.logger.getCurrentTime() > 5) {
                    window.videoJS.bigPlayButton.hide();
                    renderContinueDialog(window.logger.getDuration(), window.logger.getCurrentTime());
                }

                let isPosted = false;
                window.videoJS.on('playing', function () {
                    if (!isPosted) {
                        window.logger.startLogging();
                        reportClickPlayEvent();
                        isPosted = true;
                        if (typeof (FakePlay) !== "undefined" && FakePlay !== null) {
                            FakePlay.style.display = 'none';
                        }
                    }
                });

                window.videoJS.on('subsUploader', function () {
                    SubtitleUploadHandle();
                });
            });
        };
    }

    const iniEpisodesSwitcher = function () {
        window.VueEpisodesSwitcher = new Vue({
            el: '#episodes-switcher',
            name: 'EpisodesSwitcher',
            data: {
                chromecastSwitcher: document.querySelector('#castbutton'),
                currentSeason: 12,
                currentEpisode: 1,
                seasons: [],
                isOpenSeasons: false,
                isOpenEpisodes: false,
            },
            computed: {
                seasonEpisodes: function () {
                    return this.seasons[this.currentSeason].episodes;
                }
            },
            methods: {
                isValidHash: function (hash) {
                    const regex = /#S\d+-E\d+-\d+/gi;
                    if (hash.match(regex)) {
                        return true;
                    }
                    return false;
                },
                setFromHash: function (hash) {
                    let episode_data = hash.substr(1).split('-');
                    if (
                        typeof (episode_data['0']) !== 'undefined' &&
                        typeof (episode_data['1']) !== 'undefined'
                    ) {
                        this.currentSeason = episode_data['0'].substr(1);
                        this.currentEpisode = episode_data['1'].substr(1);
                    }
                },
                updateHash: function () {
                    if (typeof (this.chromecastSwitcher) !== 'undefined') {
                        if (this.seasons[this.currentSeason].episodes[this.currentEpisode].is_chromecast_supported === '1') {
                            this.chromecastSwitcher.classList.add('enabled-casting');
                        } else {
                            this.chromecastSwitcher.classList.remove('enabled-casting');
                        }
                    }
                    if (window.history && window.history.pushState) {
                        let href = location.href;
                        if (typeof (location.hash) !== 'undefined' && location.hash && this.isValidHash(location.hash)) {
                            href = href.replace(location.hash, '#S' + this.currentSeason + '-E' + this.currentEpisode + '-' + this.seasons[this.currentSeason].episodes[this.currentEpisode].id_episode);
                        } else {
                            href = href + '#S' + this.currentSeason + '-E' + this.currentEpisode + '-' + this.seasons[this.currentSeason].episodes[this.currentEpisode].id_episode;
                        }
                        history.replaceState(null, null, href);
                        let eventChangedEpisodeHash = document.createEvent('Event');
                        eventChangedEpisodeHash.initEvent('ChangedEpisodeHash', true, true);
                        window.dispatchEvent(eventChangedEpisodeHash);
                    } else {
                        location.replace('#S' + this.currentSeason + '-E' + this.currentEpisode + '-' + this.seasons[this.currentSeason].episodes[this.currentEpisode].id_episode);
                        let eventChangedEpisodeHash = document.createEvent('Event');
                        eventChangedEpisodeHash.initEvent('ChangedEpisodeHash', true, true);
                        window.dispatchEvent(eventChangedEpisodeHash);
                    }
                },
                updateComponent: function () {
                    if (
                        typeof (location.hash) !== 'undefined' &&
                        location.hash !== '' &&
                        this.isValidHash(location.hash)
                    ) {
                        this.setFromHash(location.hash);
                    } else {
                        this.setLatest();
                    }
                    if (this.seasons[this.currentSeason].episodes[this.currentEpisode].is_chromecast_supported === '1') {
                        this.chromecastSwitcher.classList.add('enabled-casting');
                    } else {
                        this.chromecastSwitcher.classList.remove('enabled-casting');
                    }
                },
                updateSeason: function (index) {
                    this.currentSeason = index;
                    this.setLatestEpisode(index);
                    this.updateHash();
                },
                updateEpisode: function (index) {
                    this.currentEpisode = index;
                    this.updateHash();
                },
                setLatestEpisode: function () {
                    let latestEpisode = 1;
                    for (let property in this.seasons[this.currentSeason].episodes) {
                        if (this.seasons[this.currentSeason].episodes.hasOwnProperty(property)) {
                            latestEpisode = property;
                        }
                    }
                    this.currentEpisode = latestEpisode;
                },
                setLatest: function (latestSeason) {
                    latestSeason = typeof (latestSeason) === 'undefined' ? 1 : latestSeason;
                    let latestEpisode = 1;
                    if (latestSeason === 1) {
                        for (let property in this.seasons) {
                            if (this.seasons.hasOwnProperty(property)) {
                                latestSeason = property;
                            }
                        }
                    }
                    for (let property in this.seasons[latestSeason].episodes) {
                        if (this.seasons[latestSeason].episodes.hasOwnProperty(property)) {
                            latestEpisode = property;
                        }
                    }
                    this.currentEpisode = latestEpisode;
                    this.currentSeason = latestSeason;
                    this.updateHash();
                }
            },
            created: function () {
                this.seasons = JSON.parse(window.seasons);
            },
            mounted: function () {
                document.querySelector('.episodes-controls-wrapper').classList.remove('zero-opacity');
                this.updateComponent();
            }
        });
    }

    const UpdateCurrentEpisodeIndicator = function () {
        document.querySelector('.episode-information').classList.add('fullOpacity');
        document.querySelector('.episode-information .episode').innerText = 'Episode ' + window.currentEpisode;
        document.querySelector('.episode-information .season').innerText = 'Season ' + window.currentSeason;
    };

    if (isValidHash(location.hash)) {
        setFromHash(location.hash);
        UpdateCurrentEpisodeIndicator();
    }

    window.addEventListener('ChangedEpisodeHash', function () {
        document.querySelector('.episode-information').classList.add('fullOpacity');
        setFromHash(location.hash);
        UpdateCurrentEpisodeIndicator();
    });

    $(document).ready(async function () {
        iniEpisodesSwitcher();

        try {
            let FirstStepResponse = await FirstSecurityStep();

            if (FirstStepResponse.success === true) {
                window.access = {
                    token: FirstStepResponse.data.accessToken,
                    expires: FirstStepResponse.data.expires
                };

                iniPlayerZone();

                return true;
            }
        } catch (e) {
            console.log(e);
        }

        try {
            let SecondStepResponse = await SecondSecurityStep();

            console.log(SecondStepResponse);

            if (SecondStepResponse.success === true) {

                window.access = {
                    token: SecondStepResponse.data.accessToken,
                    expires: SecondStepResponse.data.expires
                };

                iniPlayerZone();

                SetCookie('sk', SecondStepResponse.data.sk, Yii2App.HOTLINK_SK_DURATION);

                return true;
            }
        } catch (e) {
            console.log(e);
        }

    });
}

function renderQualitySwitcher(fake1080p) {

    if (typeof (window.VueSwitcher) !== 'undefined') {
        window.VueSwitcher.UpdateQualityLevels();
        return;
    }

    window.VueSwitcher = new Vue({
        el: '#ios-quality-switch',
        name: 'iOSQualitySwitcher',
        data: function () {
            return {
                fake1080p: fake1080p,
                ct: 0,
                safeSeek: false,
                QualityLevels: [],
                isOpen: false
            };
        },
        computed: {
            Selected: function () {
                let SelectedOne = false;

                this.QualityLevels.forEach(function (QualityLevel) {
                    if (QualityLevel.selected) {
                        SelectedOne = QualityLevel;
                    }
                });

                return SelectedOne;
            }
        },
        methods: {
            UpdateQualityLevels: function () {
                this.QualityLevels = window.videoJS.currentSources();
                if (fake1080p) {
                    this.QualityLevels.push({
                        label: '1080p'
                    });
                }
            },
            doSeeking: function () {
                if (this.safeSeek) {
                    window.videoJS.currentTime(this.ct);
                    window.videoJS.play();
                    this.safeSeek = false;
                }
            },
            enableByIndex: function (index) {
                if (typeof (this.QualityLevels[index].src) === 'undefined') {
                    // osho
                    OverlayArticle.manualInit('/static/1080p-only-premium?isAjax=true');
                    window.videoJS.pause();
                    return;
                }

                let this_ = this;
                this.ct = window.videoJS.getCache().currentTime;

                this.QualityLevels.forEach(function (item, indx) {
                    this.QualityLevels[indx].selected = false;
                }.bind(this));

                this.QualityLevels[index].selected = true;

                window.videoJS.src(this.QualityLevels);

                this.safeSeek = true;
                if (window.videoJS.readyState() < 3) {
                    window.videoJS.one('canplay', this_.doSeeking);
                } else {
                    this.doSeeking();
                }

            }
        },
        mounted: function () {
            this.UpdateQualityLevels();
        }
    });
}

/**
 * Progress Logger Constructor
 * @param key
 * @param interval
 * @constructor
 */
function ProgressLogger(key, interval) {

    interval = typeof (interval) === 'undefined' ? 2000 : interval;

    let initLogger = function () {
        let log = null;

        try {
            log = JSON.parse(localStorage.getItem(this.key));
        } catch (e) {
        }

        if (typeof (log) === 'object' && log !== null) {
            this.log = log;
        }
    }.bind(this);

    let timer = null;

    this.key = key;
    this.log = null;

    let doLogging = function () {

        this.log = {
            currentTime: window.videoJS.currentTime(),
            duration: window.videoJS.duration()
        };

        localStorage.setItem(this.key, JSON.stringify(this.log));

    }.bind(this);

    this.getCurrentTime = function () {
        return this.log.currentTime;
    }.bind(this);

    this.getDuration = function () {
        return this.log.duration;
    }.bind(this);

    this.updateKey = function (newKey) {
        this.key = newKey;
    };

    this.stopLogging = function () {
        if (timer !== null) {
            clearInterval(timer);
        }
    };

    this.dispose = function () {

        this.stopLogging();

    }.bind(this);

    this.startLogging = function () {
        if (timer !== null) {
            clearInterval(timer);
        }
        timer = setInterval(function () {
            doLogging();
        }, interval);
    };

    initLogger();

}

/**
 * Subtitles Upload Handler
 */

function SubtitleUploadHandle() {
    window.UploadIndex = typeof (window.UploadIndex) === 'undefined' ? 1 : window.UploadIndex;

    let disableSubtitles = function () {
        for (let i = 0; i < window.videoJS.tech_.textTracks_.length; i++) {
            window.videoJS.tech_.textTracks_[i].mode = 'disabled';
        }
    };

    let uploadHandle = function () {
        let DropZone = document.querySelector("#SubtitlesDropzone");

        while (DropZone.firstChild) {
            DropZone.removeChild(DropZone.firstChild);
        }

        let fileInput = document.createElement('input');
        fileInput.type = 'file';

        DropZone.appendChild(fileInput);

        fileInput.onchange = function () {
            let req = new XMLHttpRequest();
            let formData = new FormData();

            formData.append('srt', fileInput.files[0]);
            req.open('POST', '/subtitles-process/');
            req.send(formData);
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    let blob = new Blob([req.response], {type: 'text/vtt'});
                    let blobURL = URL.createObjectURL(blob);
                    let remoteTrack = window.videoJS.addRemoteTextTrack(
                        {
                            src: blobURL,
                            label: 'Custom ' + window.UploadIndex
                        },
                        false
                    );
                    disableSubtitles();
                    setTimeout(function () {
                        remoteTrack.track.mode = 'showing';
                    }, 50);
                    window.UploadIndex++;
                }
            };
        };
        fileInput.click();
    }

    uploadHandle();

}

function renderContinueDialog(duration, currentTime) {

    var _this = this;

    this.duration = duration;
    this.currentTime = currentTime;

    this.DrawProgress = function () {

        let SecondWeight = 100 / this.duration;
        let ProgressWidth = (SecondWeight * this.currentTime).toFixed(0);
        document.querySelector('.continue-wrapper .progress-bar').style.width = ProgressWidth + '%';

    }

    this.UpdateTimeDisplay = function () {
        document.querySelector('.continue__time-display--wrapper .duration').innerHTML = toHHMMSS(this.duration);
        document.querySelector('.continue__time-display--wrapper .currentTime').innerHTML = toHHMMSS(this.currentTime);
    }.bind(this);

    ShowContinueDialog = function () {
        let wrapper = document.querySelector('.continue-wrapper').style.display = 'block';
    };

    HideContinueDialog = function () {
        let wrapper = document.querySelector('.continue-wrapper').style.display = 'none';
    };

    this.BindListeners = function () {

        document.querySelector('button.continue__button--from_begin').onclick = function () {
            HideContinueDialog();
            window.videoJS.play();
        };

        document.querySelector('button.continue__button').onclick = function () {

            HideContinueDialog();

            if (window.videoJS.paused()) {
                window.videoJS.play();
            }

            let safeSeek = true;
            window.videoJS.on('playing', function () {
                if (safeSeek === true) {
                    window.videoJS.currentTime(_this.currentTime);
                    safeSeek = false;
                }
            });
        };

    };

    this.DrawProgress();
    this.UpdateTimeDisplay();
    this.BindListeners();
    ShowContinueDialog();

}

/**
 * Funcnction initializes subtitles witcher,
 * if it was already initialized tries to reload texttrack
 * and rebind events to new player instance
 */
function renderSubtitleSwitcher() {
    if (typeof (window.VueSubtitles) !== 'undefined') {
        this.VueSubtitles.OffEventListeners();

        window.VueSubtitles.fetchTextTracks();
        window.VueSubtitles.textTracks = window.videoJS.textTracks();

        this.VueSubtitles.OnEventsListeners();
        return;
    }

    window.VueSubtitles = new Vue({
        name: 'VueSubtitleSwitcher',
        el: '#mobile-sub-switcher',
        data: function () {
            return {
                subtitles: [],
                isOpen: false
            }
        },
        methods: {
            OffEventListeners: function () {
                this.textTracks.off('change', function () {
                    this.fetchTextTracks();
                }.bind(this));

                this.textTracks.off('addtrack', function () {
                    this.fetchTextTracks();
                }.bind(this));
            },
            OnEventsListeners: function () {
                this.textTracks.on('change', function () {
                    this.fetchTextTracks();
                }.bind(this));

                this.textTracks.on('addtrack', function () {
                    this.fetchTextTracks();
                }.bind(this));
            },
            fetchTextTracks: function () {
                this.subtitles = [];
                for (let i = 0; i < window.videoJS.remoteTextTracks().length; i++) {
                    if (window.videoJS.remoteTextTracks()[i].kind === 'subtitles') {
                        this.subtitles.push({
                            label: window.videoJS.remoteTextTracks()[i].label,
                            mode: window.videoJS.remoteTextTracks()[i].mode,
                            index: i
                        });
                    }
                }
            },
            UpdateTrack: function (index) {
                this.disableAll();
                window.videoJS.remoteTextTracks()[index].mode = 'showing';
            },
            disableAll: function () {
                window.videoJS.remoteTextTracks().tracks_.forEach(function (item) {
                    if (item.mode === 'showing') {
                        item.mode = 'disabled';
                    }
                });
            },
            uploadHandle: function () {
                SubtitleUploadHandle();
            }
        },
        computed: {
            selected: function () {
                let SelectedItem = {
                    label: 'Subtitles..',
                    index: -1
                };

                this.subtitles.forEach(function (item) {
                    if (item.mode === 'showing') {
                        SelectedItem = {
                            label: item.label,
                            index: item.index
                        };
                    }
                });

                return SelectedItem;
            }
        },
        mounted: function () {
            this.textTracks = window.videoJS.textTracks();

            this.OnEventsListeners();

            for (let i = window.videoJS.remoteTextTracks().length - 1; i >= 0; i--) {
                if (window.videoJS.remoteTextTracks()[i].kind === 'subtitles') {
                    this.subtitles.push({
                        label: window.videoJS.remoteTextTracks()[i].label,
                        mode: window.videoJS.remoteTextTracks()[i].mode,
                        index: i
                    });
                }
            }
        }
    });
}

/**
 * Sets Default Captions Look
 * For Text Tracks
 * @param player
 */
function setVideoJsCaptionsDefaultStyles(player) {
    player.textTrackSettings.setValues({
        backgroundColor: "#000",
        backgroundOpacity: "0.5",
        color: "#FFF",
        fontFamily: "proportionalSansSerif",
        fontPercent: 1.25,
        textOpacity: "1",
        windowColor: "#000",
        windowOpacity: "0",
    });
}

function add1080pButton(player) {
    player.on('playing', function () {
        if (document.querySelector('.only-prem-1080p') !== null) {
            $('.only-prem-1080p').remove();
        }
    });

    $(document).on('click', '.only-prem-1080p__continue-watching', function (e) {
        e.preventDefault();
        player.play();
    });

    player.on('playerSourcesChanged', function () {
        let elem = $('<li class="vjs-menu-item" id="user-limited-notify-button">1080p</li>');
        elem.on('click', function () {
            if (document.querySelector('.only-prem-1080p') === null) {
                $('.vjs-lookmovie').append(get1080pMessage());
            }
            player.pause();
            $('.vjs-quality-selector').removeClass('vjs-hover');
        });
        $('.vjs-quality-selector .vjs-menu-content').append(elem);
    });
}

function get1080pMessage() {
    return '<div class="only-prem-1080p">' +
        '<p><b>1080p</b> will be available for</p>' +
        '<br><p><b>Monday - Friday:</b> 1PM to 1AM EDT</p>' +
        '<br><p><b>Saturday - Sunday:</b> Entire day</p>' +
        '<br><p><br>While we are doing everything to provide the best FREE streaming experience' +
        '<br> it still comes with high servers bandwidth costs.</p>' +
        '<br> <p>To reduce costs, some features will be available for Paid Members only at peak hours.</p>' +
        '<br><div class="only-prem-1080p__buttons">' +
        '<a class="only-prem-1080p__button only-prem-1080p__continue-watching" href="#vjs-continue-watching">Continue Watching</a>' +
        '<a class="only-prem-1080p__button only-prem-1080p__check-premium" href="/premium.html" target="_blank">Become Premium</a>' +
        '</div>' +
        '</div>';
}

/**
 * Sets The Default Player Breakpoints
 * @param player
 */
function setVideoJsBreakpoints(player) {
    player.breakpoints({
        tiny: 30,
        xsmall: 320,
        small: 450,
        medium: 992,
        large: 1440,
        xlarge: Infinity
    });
}

const setupFeServerSwitchEvents = function (queryPlaylistFn, player) {
    const feSwitcherWrapper = document.querySelector('.change-fe');
    const feSwitcher = document.querySelector('#change-fe');
    if (typeof (feSwitcher) !== 'undefined' && feSwitcher !== null) {
        feSwitcherWrapper.style.display = 'block';
        feSwitcher.onchange = function () {
            queryPlaylistFn(window['_StorageProtection'], feSwitcher.value, function (response) {
                window.QualityLevels = JSON.parse(response);
                var src = window.QualityLevels;
                let sources = [];

                if (typeof (src['360p']) !== 'undefined') {
                    sources.push({
                        src: src['360p'],
                        label: '360p',
                        type: "application/x-mpegURL",
                        withCredentials: false,
                        selected: typeof (src['480p']) === 'undefined'
                    });
                }

                if (typeof (src['480p']) !== 'undefined') {
                    sources.push({
                        src: src['480p'],
                        label: '480p',
                        type: "application/x-mpegURL",
                        withCredentials: false,
                        selected: true
                    });
                }

                if (typeof (src['720p']) !== 'undefined') {
                    sources.push({
                        src: src['720p'],
                        type: 'application/x-mpegURL',
                        label: '720p',
                        withCredentials: false,
                        selected: typeof (src['480p']) === 'undefined' && typeof (src['360p']) === 'undefined'
                    });
                }

                if (typeof (src['1080p']) !== 'undefined') {
                    sources.push({
                        src: src['1080p'],
                        label: '1080p',
                        type: 'application/x-mpegURL',
                        withCredentials: false,
                        selected: typeof (src['480p']) === 'undefined' && typeof (src['360p']) === 'undefined' && typeof (src['720p'])
                    });
                }

                player.src(sources);
                if (player.readyState() < 3) {
                    player.one('canplay', function () {
                        player.play();
                    });
                } else {
                    player.play()
                }
            });
        }
    }
};