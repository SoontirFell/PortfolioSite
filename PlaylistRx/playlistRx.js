/*globals browser, console, SC, YT */
/*jslint plusplus: true */

'use strict';

const notifications = ( () => {
    let _SavedSpotifySongs =  [],
        _SavedYoutubeSongs = [],
        _SpotifyFinished = false,
        _YoutubeFinished = false;

    const _AddSongsToAlert = (song, platform) => {
        if (typeof song === 'string'){
            if (platform === 'spotify') {
                _SavedSpotifySongs.push(song);
            }
            if (platform === 'youtube') {
                _SavedYoutubeSongs.push(song);
            }
        } else {
            console.log(song + 'is not a string.');
        }
    },

    _AlertSavedSongs = () => {
        const countSy = _SavedSpotifySongs.length,
            countYt = _SavedYoutubeSongs.length,
            spotifyReady = (_SpotifyFinished && countSy >= 0),
            youtubeReady = (_YoutubeFinished && countYt >= 0);

        let msg = '';

        if (spotifyReady) {
            msg += 'The following songs were saved to Spotify:\n';
            msg += _GetSpotifyTitles();
        }

        if (youtubeReady) {
            if (spotifyReady) {
                msg += '\n \n';
            }

            msg += 'The following songs were saved to YouTube:\n';
            msg += _GetYoutubeTitles();
        }

        if ((_SpotifyFinished || !playlistRxUtilities.serviceHasCheck('Spotify')) && (_YoutubeFinished || !playlistRxUtilities.serviceHasCheck('YouTube'))) {
            window.alert(msg);
            _ResetNotifications();
        }
    },

    _GetSpotifyTitles = () => {
        const countSy = _SavedSpotifySongs.length;
        let i,
            msg = '';

        for (i = 0; i < countSy; i++) {
            msg += _SavedSpotifySongs[i];
            if (i + 1 <= countSy) {
                msg += '\n';
            }
        }

        return msg;
    },

    _GetYoutubeTitles = () => {
        const countYt = _SavedYoutubeSongs.length;
        let i,
            msg = '';

        for (i = 0; i < countYt; i++) {
            msg += _SavedYoutubeSongs[i];
            if (i + 1 <= countYt) {
                msg += '\n';
            }
        }

        return msg;
    },

    _ResetNotifications = () => {
        _SavedSpotifySongs = [];
        _SavedYoutubeSongs = [];
        _SpotifyFinished = false;
        _YoutubeFinished = false;
    },

    _ConfirmUnsaved = () => {
        if (window.confirm('Remove these songs from PlaylistRx and your Reddit Saved list?')) {
            redditSaved.unsaveSelected();
        }
    },

    _SpotifyFinishedTrue = () => {
        _SpotifyFinished = true;
    },

    _YoutubeFinishedTrue = () => {
        _YoutubeFinished = true;
    }

    return {
        addSongsToAlert: _AddSongsToAlert,
        alertSavedSongs: _AlertSavedSongs,
        confirmUnsaved: _ConfirmUnsaved,
        spotifyFinishedTrue: _SpotifyFinishedTrue,
        youtubeFinishedTrue: _YoutubeFinishedTrue
    };
})(),

playlistSY = (function () {
    const _ClientId =  '5086ac5b03f84cfc9bf0d80792fe5264',
        _RedirectURI = 'http://127.0.0.1:5500/playlistRx.html';

    let _Albums = [],
        _PlaylistId = '',
        _PlaylistName = '',
        _Playlists = [],
        _Songs = [],
        _State = localStorage.getItem('playlistRx.spotify.state.val'),
        _Token = localStorage.getItem('playlistRx.spotify.token.val'),
        _TokenExpDate = localStorage.getItem('playlistRx.spotify.token.expires'),
        _UserId;

    const _ParseSYId = (url, rId, title) => {
        let uri = _UriExtractor(url);

        if (url.indexOf('/track/') > -1) {
            _Songs.push({
                title: title,
                url: url,
                uri: 'spotify:track:' + uri,
                rId: rId
            });
        }

        if (url.indexOf('/album/') > -1) {
            _Albums.push({
                title: title,
                url: url,
                uri: uri,
                rId: rId
            });
        }

        if (url.indexOf('/playlist/') > -1) {
            _Playlists.push({
                title: title,
                url: url,
                uri: uri,
                rId: rId
            });
        }
    },

    _UriExtractor = (url) => {
        const uriStart = url.lastIndexOf('/') + 1,
            lastQuestion = url.indexOf('?');

        if (lastQuestion > -1) {
            return url.substring(uriStart, lastQuestion);
        } else {
            return url.substring(uriStart);
        }
    },

    _AddRows = () => {
        _ConvertAlbumsToSongs()
        .then(_ConvertPlaylistsToSongs)
        .then(_CreateRowsForSongs)
        .catch(playlistRxUtilities.errorLogging);
    },

    _ConvertAlbumsToSongs = async () => {
        let i,
            len = _Albums.length,
            promiseArray = [],
            song;

        if (len > 0) {
            if (!_IsAccessToken()) {
                return _InitiateAuthorization(playlistSY.addRows);
            }

            for (i = 0; i < len; i++) {
                song = await _GetAlbumTracks(_Albums[i].uri, _Albums[i].rId);
                promiseArray.push(song);
            }
        }
        return Promise.all(promiseArray);
    },

    _GetAlbumTracks = (uri, rId) => {
        let fetchOptions,
            fetchUrl;

        fetchUrl = 'https://api.spotify.com/v1/albums/' + uri + '/tracks';

        fetchOptions = {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + _Token,
                'content-type': 'application/x-www-form-urlencoded'
            }
        };

        return fetch(fetchUrl, fetchOptions)
        .then(dataWrappedInPromise => dataWrappedInPromise.json())
        .then(responseData => _SaveAlbumTracks(responseData, rId))
        .catch(playlistRxUtilities.errorLogging);
    },

    _SaveAlbumTracks = (trackData, rId) => {
        let i,
            len,
            title;

        if(!trackData.items) {
            return false;
        }

        len = trackData.items.length;

        for (i = 0; i < len; i++) {
            title = trackData.items[i].artists[0].name + ' - ' + trackData.items[i].name;

            _Songs.push({
                uri: trackData.items[i].uri,
                rId: rId,
                url: 'https://open.spotify.com/track/' + trackData.items[i].id,
                title: title
            });
        }
    },

    _ConvertPlaylistsToSongs = () => {
        
    },

    _CreateRowsForSongs = () => {
        let i,
            len;

        i = 0;
        len = _Songs.length;

        for (i; i < len; i++) {
            playlistRxUtilities.createRow('SY', _Songs[i].title, _Songs[i].url, i);
        }
    },

    _SavePlaylist  = async () => {
        if (!_IsAccessToken() ) {
            return __InitiateAuthorization(_SavePlaylist);
        }

        _PlaylistName = playlistRxUtilities.generatePlaylistName();

        await _GetUserId();
        await _GetPlaylistId();
        _AddTracksToPlaylist();
    },

    _GetUserId = () => {
        let fetchOptions,
            fetchUrl = 'https://api.spotify.com/v1/me';

        fetchOptions = {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + _Token,
                'content-type': 'application/x-www-form-urlencoded'
            }
        }

        return fetch(fetchUrl, fetchOptions)
        .then(dataWrappedInPromise => dataWrappedInPromise.json())
        .then(responseData => _SaveUserId(responseData))
        .catch(playlistRxUtilities.errorLogging);
    },

    _SaveUserId = (response) => {
        _UserId = response.id;
    },

    _GetPlaylistId = async () => {
        const response = await _GetUsersPlaylists(),
            playlists = response.items;

        let len = playlists.length;

        for(let i = 0; i < len; i++) {
            if (playlists[i].name === _PlaylistName) {
                _PlaylistId = playlists[i].id;
                break;
            }
        }

        if (_PlaylistId === '') {
            await _CreatePlaylist();
        }

        return Promise.resolve();
    },

    _GetUsersPlaylists = () => {
        let fetchOptions,
            fetchUrl = 'https://api.spotify.com/v1/me/playlists?limit=50';

        fetchOptions = {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + _Token,
                'content-type': 'application/x-www-form-urlencoded'
            }
        }

        return fetch(fetchUrl, fetchOptions)
        .then(dataWrappedInPromise => dataWrappedInPromise.json())
        .catch(playlistRxUtilities.errorLogging);
    },

    _CreatePlaylist = () => {
        let fetchOptions,
            fetchUrl = 'https://api.spotify.com/v1/users/' + _UserId + '/playlists';

        fetchOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + _Token,
                'content-type': 'application/json'
            },
            body: JSON.stringify({name: _PlaylistName})
        }

        return fetch(fetchUrl, fetchOptions)
        .then(dataWrappedInPromise => dataWrappedInPromise.json())
        .then(response => _PlaylistId = response.id)
        .catch(playlistRxUtilities.errorLogging);
    },

    _AddTracksToPlaylist = (after) => {
        let fetchOptions,
            fetchUrl,
            intervalVars,
            i,
            len,
            uriArray;

        intervalVars = _SetTrackInterval(after);
        after = intervalVars.after;
        i = intervalVars.i;
        len = intervalVars.len;

        uriArray = _GetCheckedTracks(i, len);

        fetchUrl = 'https://api.spotify.com/v1/users/' + _UserId + '/playlists/' + _PlaylistId + '/tracks';

        fetchOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + _Token,
                'content-type': 'application/json'
            },
            body: JSON.stringify({uris: uriArray})
        }

        fetch(fetchUrl, fetchOptions)
        .then(_CheckForMore(after))
        .catch(playlistRxUtilities.errorLogging);
    },

    _CheckForMore = (after) => {
        if (after) {
            _AddTracksToPlaylist(after);
        } else {
            notifications.spotifyFinishedTrue();
            notifications.alertSavedSongs();
        }
    },

    _SetTrackInterval = (after) => {
        let i,
            len;

        if (after) {
            i = after;
            if ((after + 100) > _Songs.length) {
                len = _Songs.length;
                after = false;
            } else {
                len = after + 100;
                after = len;
            }
        } else {
            i = 0;
            if (_Songs.length > 100 && after !== false) {
                len = 100;
                after = len;
            } else {
                len = _Songs.length;
                after = false;
            }
        }

        return {
            after: after,
            i: i,
            len: len
        };
    },

    _GetCheckedTracks = (i, len) => {
        let uriArray = [];
        for (i; i < len; i++) {
            if (document.getElementById('spotifyCheck' + i).checked) {
                uriArray.push(_Songs[i].uri);
                notifications.addSongsToAlert(_Songs[i].title, 'spotify');
            }
        }
        return uriArray;
    },

    _IsAccessToken = () => {
        let currentDate = Date.now();

        if (_Token !== 'undefined' && _Token !== null && _TokenExpDate > currentDate) {
            return true;
        }

        return false;
    },

     _InitiateAuthorization = (callback) => {
        let authUrl,
            popup;

        _CheckForState();

        authUrl = 'https://accounts.spotify.com/authorize?response_type=token&scope=user-read-private%20playlist-modify-private%20playlist-modify-public&client_id=' + _ClientId + '&redirect_uri=' + _RedirectURI + '&state=' + _State;

        popup = window.open(authUrl);

        if (!playlistRxUtilities.checkIfPopupBlocked(popup)) {
            _ListenForAccessToken(callback);
        }
    },

    _CheckForState = () => {
        if (!_State) {
            _State = playlistRxUtilities.newState();
            localStorage.setItem('playlistRx.spotify.state.val', _State);
        }
    },

    _ListenForAccessToken = (callback) => {
        window.addEventListener('storage', (event) => {
            let accessToken = localStorage.getItem('playlistRx.spotify.token.val');
            if(!!accessToken) {
                _SetAccessTokenExpiration(accessToken);
                if(typeof callback === 'function') {
                    callback();
                }
            }
        })
    },

    _SetAccessTokenExpiration = (accessToken) => {
        let currentDate = Date.now();

        _Token = accessToken;
        _TokenExpDate = currentDate + 3570000;
        localStorage.setItem('playlistRx.spotify.token.expires', _TokenExpDate);
    },

    _GetAlbums = () => {
        return _Albums;
    },

    _GetExternalPlaylists = () => {
        return _Playlists;
    },

    _GetSongs = () => {
        return _Songs;
    },

    _GetState = () => {
        return _State;
    }

    return {
        addRows: _AddRows,
        getAlbums: _GetAlbums,
        getExternalPlaylists : _GetExternalPlaylists,
        getSongs: _GetSongs,
        getState: _GetState,
        parseSYId: _ParseSYId,
        savePlaylist: _SavePlaylist
    };
})(),

playlistYT = ( () => {
    const _ClientId = '602382788924-lluqufsf5bldmu5ago6bt9vuojo48d1a.apps.googleusercontent.com',
        _RedirectURI =  'http://127.0.0.1:5500/playlistRx.html';

    let _PlaylistId = '',
        _PlaylistName = '',
        _Songs = [],
        _State = localStorage.getItem('playlistRx.youtube.state.val'),
        _Token = localStorage.getItem('playlistRx.youtube.token.val'),
        _TokenExpDate = localStorage.getItem('playlistRx.youtube.token.expires');

    const _ParseYTId = (url, rId, title) => {
        let idMatcher,
            ytId;

        idMatcher = new RegExp(/[a-z,\d,\_,\-]{11}/, 'i');
        ytId = url.match(idMatcher)[0];

        _Songs.push({
            title: title,
            url: url,
            ytId: ytId,
            rId: rId
        });
    },

    _AddRows = () => {
        let i,
            len;

        i = 0;
        len = _Songs.length;

        for (i; i < len; i++) {
            playlistRxUtilities.createRow('YT', _Songs[i].title, _Songs[i].url, i);
        }
    },

    _SavePlaylist  = async () => {
        let checkedNodes;

        if (!_IsAccessToken() ) {
            return _InitiateAuthorization(_SavePlaylist);
        }

        checkedNodes = document.querySelectorAll('input.YouTube:checked');

        if (checkedNodes.length > 0) {
            _PlaylistName = playlistRxUtilities.generatePlaylistName();
            await _CheckForPlaylistByName();
            if (_PlaylistId === '') {
                await _CreatePlaylist();
            }
            _AddTracksToPlaylist(checkedNodes);
        }
    },

    _IsAccessToken = () => {
        let currentDate = Date.now();

        if (_Token !== 'undefined' && _Token !== null && _TokenExpDate > currentDate) {
            return true;
        }

        return false;
    },

     _InitiateAuthorization = (callback) => {
        let authUrl,
            popup;

        _CheckForState();

        authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + _ClientId + '&response_type=token&state=' + _State + '&redirect_uri=' + _RedirectURI + '&scope=https://www.googleapis.com/auth/youtube';

        popup = window.open(authUrl);

        if (!playlistRxUtilities.checkIfPopupBlocked(popup)) {
            _ListenForAuthToken(callback);
        }
    },

    _CheckForState = () => {
        if (!_State) {
            _State = playlistRxUtilities.newState();
            localStorage.setItem('playlistRx.youtube.state.val', _State);
        }
    },

    _ListenForAuthToken = (callback) => {
        window.addEventListener('storage', async (event) => {
            let accessToken = localStorage.getItem('playlistRx.youtube.token.val');
            if(!!accessToken) {
                await _ValidateAuthToken(accessToken)
                .catch(playlistRxUtilities.errorLogging);

                _SetAccessTokenExpiration(accessToken);

                if(typeof callback === 'function') {
                    callback();
                }
            }
        })
    },

    _ValidateAuthToken = (authCode) => {
        let fetchUrl,
            fetchOptions;

        fetchUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + authCode;

        fetchOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'Basic VG1VTF9kRlRYMzlYUEE6',
                'content-type': 'application/x-www-form-urlencoded'
            }
        };

        return fetch(fetchUrl, fetchOptions);
    },

    _SetAccessTokenExpiration = (accessToken) => {
        let currentDate = Date.now();
        _Token = accessToken;
        _TokenExpDate = currentDate + 3570000;
        localStorage.setItem('playlistRx.youtube.token.expires', _TokenExpDate);
    },

    _CheckForPlaylistByName = async () => {
        const response = await _GetUsersPlaylists(),
            playlists = response.items;

        let len = playlists.length;

        for (let i = 0; i < len; i++) {
            if (playlists[i].snippet.title === _PlaylistName) {
                _PlaylistId = playlists[i].id;
                break;
            }
        }

        return Promise.resolve();
    },

    _GetUsersPlaylists = () => {
        let fetchUrl,
            fetchOptions;

            fetchUrl = 'https://www.googleapis.com/youtube/v3/playlists?maxResults=50&mine=true&part=snippet';

            fetchOptions = {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + _Token,
                    'content-type': 'application/json'
                },
            };

        return fetch(fetchUrl, fetchOptions)
        .then(dataWrappedInPromise => dataWrappedInPromise.json())
        .catch(playlistRxUtilities.errorLogging);
    },

    _CreatePlaylist = () => {
        let fetchOptions,
            fetchUrl;

        fetchUrl = 'https://www.googleapis.com/youtube/v3/playlists?access_token=' + _Token + '&part=snippet';

        fetchOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + _Token,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                snippet: {
                    title: _PlaylistName
                }
            })
        };

        return fetch(fetchUrl, fetchOptions)
        .then(dataWrappedInPromise => dataWrappedInPromise.json())
        .then(responseData => _SetPlaylistId(responseData))
        .catch(playlistRxUtilities.errorLogging);
    },

    _SetPlaylistId = (response) => {
        _PlaylistId = response.id;
    },

    _AddTracksToPlaylist = async (checkedNodes) => {
        let i,
            checkedNodeArray,
            tracksLen,
            tracksToAdd;

        checkedNodeArray = Array.from(checkedNodes);

        tracksToAdd = checkedNodeArray.map((node) => {
            let match = node.id.match(/\d+$/);
            match = match ? match[0] : '-1';
            return parseInt(match, 10);
        });

        tracksLen = tracksToAdd.length;

        for (i = 0; i < tracksLen; i++) {
            let songIndex = tracksToAdd[i],
                trackId = _Songs[songIndex].ytId;

            notifications.addSongsToAlert(_Songs[songIndex].title, 'youtube');
            await _AddTrackToPlaylist(trackId);
        }
        notifications.youtubeFinishedTrue();
        notifications.alertSavedSongs();
    },

    _AddTrackToPlaylist = (trackId) => {
        let fetchOptions,
            fetchUrl;

        fetchUrl = 'https://www.googleapis.com/youtube/v3/playlistItems?access_token=' + _Token + '&part=snippet';

        fetchOptions = {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                snippet: {
                    playlistId: _PlaylistId,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId: trackId
                    }
                }
            })
        };

        return fetch(fetchUrl, fetchOptions)
        .catch(playlistRxUtilities.errorLogging);
    },

    _GetSongs = () => {
        return _Songs;
    },

    _GetState = () => {
        return _State;
    };

    return {
        addRows: _AddRows,
        getSongs : _GetSongs,
        getState : _GetState,
        parseYTId: _ParseYTId,
        savePlaylist : _SavePlaylist
    };
})(),

redditSaved = ( () => {
    const _RedirectURI =  'http://127.0.0.1:5500/playlistRx.html';

    let _State = localStorage.getItem('playlistRx.reddit.state.val'),
        _Token = localStorage.getItem('playlistRx.reddit.token.val'),
        _TokenExpDate = localStorage.getItem('playlistRx.reddit.token.expires'),
        _Username = '';

    const _FetchRedditSaved  = () => {
        playlistRxUtilities.clearPlaylistRxTable();

        if ( _IsAccessToken() ) {
            _BeginSongRetrieval();
        } else {
            _InitiateAuthorization();
        }
    },

    _IsAccessToken = () => {
        let currentDate = Date.now();

        if (_Token !== 'undefined' && _Token !== null && _TokenExpDate > currentDate) {
            return true;
        }

        return false;
    },

     _InitiateAuthorization = () => {
        let authUrl,
            popup;

        _CheckForState();

        authUrl = 'https://www.reddit.com/api/v1/authorize?client_id=TmUL_dFTX39XPA&response_type=code&state=' + _State + '&redirect_uri=' + _RedirectURI + '&duration=temporary&scope=history,identity,save';

        popup = window.open(authUrl);

        if (!playlistRxUtilities.checkIfPopupBlocked(popup)) {
            _ListenForAuthCode(popup);
        }
    },

    _CheckForState = () => {
        if (!_State) {
            _State = playlistRxUtilities.newState();
            localStorage.setItem('playlistRx.reddit.state.val', _State);
        }
    },

    _ListenForAuthCode = (popup) => {
        let authCode = localStorage.getItem('playlistRx.reddit.authCode.val');

        if (popup.closed && authCode) {
            _AuthorizationController(authCode);
        } else {
            window.setTimeout( () => {
                _ListenForAuthCode(popup);
            }, 500);
        }
    },

    _AuthorizationController = (authCode) => {
        Promise.resolve(authCode)
        .then(_ValidateAuthToken)
        .then(_ParseAccessToken)
        .then(_BeginSongRetrieval)
        .catch(playlistRxUtilities.errorLogging);
    },

    _ValidateAuthToken = (authCode) => {
        let fetchUrl,
            fetchOptions;

        fetchUrl = 'https://www.reddit.com/api/v1/access_token?grant_type=authorization_code&code=' + authCode + '&redirect_uri=' + _RedirectURI;

        fetchOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'Basic VG1VTF9kRlRYMzlYUEE6',
                'content-type': 'application/x-www-form-urlencoded'
            }
        };

        return fetch(fetchUrl, fetchOptions);
    },

    _ParseAccessToken = (response) => {
        let accessPromise = response.json(),
            currentDate = Date.now();

        accessPromise.then((promiseValue) => {
            _Token = promiseValue.access_token;
            _TokenExpDate = currentDate + 3570000;
            localStorage.setItem('playlistRx.reddit.token.val', _Token);
            localStorage.setItem('playlistRx.reddit.token.expires', _TokenExpDate);
            return;
        });
    },

    _BeginSongRetrieval = () => {
        Promise.resolve()
        .then(_RetrieveUsername)
        .then(_LoadSavedSongs)
        .catch(_ErrorHandling);
    },

    _RetrieveUsername = () => {
        const fetchUrl = 'https://oauth.reddit.com/api/v1/me',
            fetchOptions = {
                headers: {
                    'Authorization': 'bearer ' + _Token,
                    'content-type': 'application/x-www-form-urlencoded'
                }
            };

        return fetch(fetchUrl, fetchOptions)
        .then( usernameResponse => usernameResponse.json() )
        .then( usernameResponseJson => {
            if (!!usernameResponseJson.error) {
                throw usernameResponseJson.error;
            }
             _Username = usernameResponseJson.name;
        })
        .catch(_ErrorHandling);
    },

    _LoadSavedSongs = (after) => {
        let fetchUrl,
            fetchOptions;

        fetchUrl = 'https://oauth.reddit.com/user/'+ _Username + '/saved?limit=100';

        if (after) {
            fetchUrl += '&after=' + after;
        }

        fetchOptions = {
            headers: {
                'Authorization': 'bearer ' + _Token,
                'content-type': 'application/x-www-form-urlencoded'
            }
        };

        return fetch(fetchUrl, fetchOptions).then( (response) => {
            response.json().then( (response) => {
                if (response.data) {
                    _ParseSavedSongs(response.data.children);
                    _CheckforMoreSongs(response.data.after);
                }
                return false;
            });
        });
    },

    _ParseSavedSongs = (redditSavedData) => {
        const count = redditSavedData.length;

        for (let i = 0; i < count; i++) {
            _LoadYoutubeSongs(redditSavedData[i]);
            _LoadSpotifySongs(redditSavedData[i]);
        }
    },

    _LoadYoutubeSongs = (redditSavedData) => {
        const youtube = document.getElementById('checkYouTube').checked;

        if (youtube && (redditSavedData.data.domain === 'youtube.com' || redditSavedData.data.domain === 'youtu.be')) {

            if (!!redditSavedData.data.media) {
                playlistYT.parseYTId(redditSavedData.data.url, redditSavedData.data.name, redditSavedData.data.media.oembed.title);
            } else {
                playlistYT.parseYTId(redditSavedData.data.url, redditSavedData.data.name, redditSavedData.data.title);
            }
        }
    },

    _LoadSpotifySongs = (redditSavedData) => {
        const spotify = document.getElementById('checkSpotify').checked;

        if (spotify && redditSavedData.data.domain === 'open.spotify.com') {

            if (!!redditSavedData.data.media) {
                playlistSY.parseSYId(redditSavedData.data.url, redditSavedData.data.name, redditSavedData.data.media.oembed.description);
            }
        }
    },

    _CheckforMoreSongs = (after) => {
        after ? _LoadSavedSongs(after) : playlistRxUtilities.buildPlaylistTable();
    },

    _ErrorHandling = (error) => {
        playlistRxUtilities.errorLogging(error);

        if (error === 401) {
            _InitiateAuthorization();
        }
    },

    _GetState = () => {
        return _State;
    },

    _UnsaveSelected = () => {
        let checked,
            i,
            num,
            tr;

        checked = document.querySelectorAll('input:checked');
        i = checked.length - 1;

        for (i; i >= 0; i--) {
            tr = checked[i].parentNode.parentNode;

            if (checked[i].classList.contains('Spotify')) {
                num = parseInt(checked[i].id.substring(12), 10);
                _Unsave(playlistSY.getSongs()[num].rId);
                tr.parentNode.removeChild(tr);
            }

            if (checked[i].classList.contains('YouTube')) {
                num = parseInt(checked[i].id.substring(12), 10);
                _Unsave(playlistYT.getSongs()[num].rId);
                tr.parentNode.removeChild(tr);
            }
        }
    },

    _Unsave = (rId) => {
        let fetchUrl,
            fetchOptions;

        fetchUrl = 'https://oauth.reddit.com/api/unsave?id=' + rId;

        fetchOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'bearer ' + _Token,
                'content-type': 'application/x-www-form-urlencoded'
            }
        };

        return fetch(fetchUrl, fetchOptions)
        .catch(playlistRxUtilities.errorLogging);
    }

    return {
        authorizationController: _AuthorizationController,
        fetchRedditSaved: _FetchRedditSaved,
        getState: _GetState,
        unsaveSelected: _UnsaveSelected
    };
})(),

playlistRxUtilities = (() => {
    const _CheckIfPopupBlocked = (popup) => {
        if(!popup) {
            alert('PlaylistRx needs to open pop-ups for you to authorize access to Reddit, Youtube, and/or Spotify. This is the only reason PlaylistRx will open a pop-up.\n\nPlease allow pop-ups on PlaylistRx if you would like to use this service.');

            return true;
        }

        return false;
    },

    _CheckUncheckAll = (event) => {
        let i,
            len,
            status,
            targets;

        i = 0;
        status = event.target.checked;
        targets = document.querySelectorAll('.playlistCreator input');
        len = targets.length;

        for (i; i < len; i++) {
            if (targets[i].checked !== status) {
                targets[i].checked = status;
            }
        }
    },

    _CheckUncheckAllSpotify = (event) => {
        let i,
            len,
            status,
            targets;

        i = 0;
        status = event.target.checked;
        targets = document.getElementsByClassName('Spotify');
        len = targets.length;

        for (i; i < len; i++) {
            if (targets[i].checked !== status) {
                targets[i].checked = status;
            }
        }
    },

    _CheckUncheckAllYoutube = (event) => {
        let i,
            len,
            status,
            targets;

        i = 0;
        status = event.target.checked;
        targets = document.getElementsByClassName('YouTube');
        len = targets.length;

        for (i; i < len; i++) {
            if (targets[i].checked !== status) {
                targets[i].checked = status;
            }
        }
    },

    _ClearPlaylistRxTable = () => {
        let checked,
            i,
            tr;

        playlistSY.songs = [];
        playlistYT.songs = [];

        checked = document.querySelectorAll('input:checked');
        i = checked.length - 1;

        for (i; i >= 0; i--) {
            if (checked[i].classList.contains('Spotify') || checked[i].classList.contains('YouTube')) {
                tr = checked[i].parentNode.parentNode;
                tr.parentNode.removeChild(tr);
            }

        }
    },

    _CreateRow = (service, title, url, count) => {
        let checkbox,
            checkboxId,
            link,
            serviceClass,
            spotifyPlacer,
            td,
            tr,
            trId,
            youtubePlacer;

        spotifyPlacer = document.getElementById('youtubeSubheader').previousElementSibling;
        youtubePlacer = document.getElementById('playlistCreator').lastChild;

        tr = document.createElement('tr');

        switch (service) {
        case 'SY':
            trId = 'spotifyTrack' + count;
            checkboxId = 'spotifyCheck' + count;
            serviceClass = 'Spotify';
            spotifyPlacer.after(tr);
            break;
        case 'YT':
            trId = 'youtubeTrack' + count;
            checkboxId = 'youtubeCheck' + count;
            serviceClass = 'YouTube';
            youtubePlacer.after(tr);
            break;
        default:
            return;
        }

        tr.setAttribute('id', trId);

        checkbox = document.createElement('input');
        checkbox.setAttribute('id', checkboxId);
        checkbox.setAttribute('name', checkboxId);
        checkbox.setAttribute('type', 'checkbox');
        checkbox.classList.add(serviceClass);
        checkbox.checked = true;

        td = document.createElement('td');
        td.appendChild(checkbox);
        tr.appendChild(td);

        link = document.createElement('a');
        link.innerHTML = title;
        link.setAttribute('href', url);

        td = document.createElement('td');
        td.appendChild(link);
        td.setAttribute('colspan', '3');
        tr.appendChild(td);
    },

    _ErrorLogging = (error) => {
        console.log(error);
    },

    _GeneratePlaylistName = () => {
        let date,
            dateRaw,
            input,
            name;

        input = document.getElementById('playlistNameInput').value;

        if (!!input) {
            name = input;
        } else {
            dateRaw = new Date();
            date = dateRaw.getFullYear() + '/' + (dateRaw.getMonth() + 1)  + '/' + dateRaw.getDate();
            name = 'PlaylistRx_' + date;
        }
        return name;
    },

    _NewState = () => {
        let i,
            possible,
            state;

        possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        state = '';

        for (i = 0; i < 8; i++) {
            state += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return state;
    },

    _SavePlaylists = () => {
        if (_ServiceHasCheck('Spotify')) {
            playlistSY.savePlaylist();
        }

        if (_ServiceHasCheck('YouTube')) {
            playlistYT.savePlaylist();
        }
    },

    _ServiceHasCheck = (service) => {
        let i,
            len,
            nodes;

        i = 0;
        nodes = document.getElementsByClassName(service);
        len = nodes.length;

        for (i; i < len; i++) {
            if (nodes[i].checked === true) {
                return true;
            }
        }
    },

    _BuildPlaylistTable = () => {
        const youtubeSongs = playlistYT.getSongs(),
            spotifySongs = playlistSY.getSongs(),
            spotifyAlbums = playlistSY.getAlbums(),
            spotifyPlaylists = playlistSY.getExternalPlaylists();

        if (spotifyAlbums.length !== 0 || spotifySongs.length !== 0 || spotifyPlaylists.length !== 0) {
            playlistSY.addRows();
        }

        if (youtubeSongs.length !== 0) {
            playlistYT.addRows();
        }
    },

    _CheckAuthorizationFlow  = () => {
        let pageLocation,
            authObject,
            authResponseStart,
            authResponse;

        pageLocation = window.location.href;
        authResponseStart = pageLocation.indexOf('?');

        if (authResponseStart === -1) {
            authResponseStart = pageLocation.indexOf('#');
        }

        if (authResponseStart > -1) {
            authResponse = pageLocation.substring(authResponseStart + 1);
            authObject = _ParseQueryString(authResponse);
            _RouteAuthorization(authObject);
        }
    },

    _RouteAuthorization = (authObject) => {
        const state = authObject.state,
            redditState = redditSaved.getState(),
            youtubeState = playlistYT.getState(),
            spotifyState = playlistSY.getState();


        if (state === redditState) {
            localStorage.setItem('playlistRx.reddit.authCode.val', authObject.code);
        }

        if (state === youtubeState) {
            localStorage.setItem('playlistRx.youtube.token.val', authObject.access_token);
        }

        if (state === spotifyState) {
            localStorage.setItem('playlistRx.spotify.token.val', authObject.access_token);
        }

        window.close();
    },

    _ParseQueryString = (queryString) => {
        let qsArray     = (queryString && queryString.length > 0) ? queryString.split('&') : [],
        qsArrayLen  = qsArray.length,
        qsObject    = {},
        qsNVArray   = [];

        queryString = queryString.split('?')[1];

        // loop over valid array to build name/value pairs
        if (qsArrayLen > 0) {
            for (let qsIndex = 0; qsIndex < qsArrayLen; qsIndex++) {
                // assumes "name=value" form
                qsNVArray = qsArray[qsIndex].split('=');
                if (qsNVArray.length > 0) {
                    qsObject[decodeURIComponent(qsNVArray[0])] = decodeURIComponent(qsNVArray[1]);
                }
            }
        }
        // return the name/value pair object
        return qsObject;
    }

    return {
        buildPlaylistTable: _BuildPlaylistTable,
        checkAuthorizationFlow :_CheckAuthorizationFlow,
        checkIfPopupBlocked: _CheckIfPopupBlocked,
        checkUncheckAll: _CheckUncheckAll,
        checkUncheckAllSpotify: _CheckUncheckAllSpotify,
        checkUncheckAllYoutube: _CheckUncheckAllYoutube,
        clearPlaylistRxTable: _ClearPlaylistRxTable,
        createRow: _CreateRow,
        errorLogging: _ErrorLogging,
        generatePlaylistName: _GeneratePlaylistName,
        newState: _NewState,
        parseQueryString : _ParseQueryString,
        savePlaylists: _SavePlaylists,
        serviceHasCheck: _ServiceHasCheck
    };
})();

document.getElementById('playlistRx').addEventListener('click', redditSaved.fetchRedditSaved);

document.getElementById('saveSelected').addEventListener('click', playlistRxUtilities.savePlaylists);
document.getElementById('unsaveSelected').addEventListener('click', notifications.confirmUnsaved);

document.getElementById('checkAll').addEventListener('change', playlistRxUtilities.checkUncheckAll);
document.getElementById('spotifyCheckAll').addEventListener('change', playlistRxUtilities.checkUncheckAllSpotify);
document.getElementById('youtubeCheckAll').addEventListener('change', playlistRxUtilities.checkUncheckAllYoutube);

playlistRxUtilities.checkAuthorizationFlow();