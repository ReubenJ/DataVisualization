var SpotifyWebApi = require('spotify-web-api-node');
const express = require('express')
var cors = require('cors');

const fs = require('fs');
// const { resolveSoa } = require('dns');

// This file is copied from: https://github.com/thelinmichael/spotify-web-api-node/blob/master/examples/tutorial/00-get-access-token.js

const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
  ];

let client_id = '2952289f1dcc4380bbec371dfbfce131';
let client_secret = '56d8f3d3af3848c1a5f365efa6339593';

// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: 'http://localhost:8888/callback'
});
  

// Setup/initializing
const app = express();
app.use(express.static(__dirname + '/../frontend'))
   .use(cors());


app.get('/login', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
  });


app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;
  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log('access_token:', access_token);
      console.log('refresh_token:', refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      res.send('Success! You can now close the window.');

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];

        console.log('The access token has been refreshed!');
        console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
      }, expires_in / 2 * 1000);
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

// Get data about current logged-in user
app.get('/me_info', (req, res) => {
  spotifyApi.getMe().then(
    (data) => {
      console.log(data);
    }
  )
});

// Get all the data we need
app.get('/data', async (req, res) => {
  spotifyApi.getUserPlaylists().then(async (results) => {
    // Store playlist info api calls as promises
    let promises = [];
    results.body.items.forEach((obj) => {
      let playlist_id = obj.href.substring(obj.href.lastIndexOf('/') + 1, obj.href.length);
      promises.push(spotifyApi.getPlaylistTracks(playlist_id));
    });

    // Collect data
    const data = await getData(results, promises);

    // Write to file
    fs.writeFile('playlists_data.json', JSON.stringify(data), (err) => {
      if (err) console.log(err);
    });
    
    res.send(data);
  })
  .catch(error => {
    res.send("error getting data: " + JSON.stringify(error));
    console.error(error);
  });
});

async function getData(res, promises) {
  return new Promise(resolve => {
    Promise.all(promises).then(async (playlists) => {
      let data = []
      for (let playlist in playlists) {    
        // Get list of track IDs
        let trackIds = [];
        let artistIds = [];
        for (let song_idx in playlists[playlist].body.items) {
          trackIds.push(playlists[playlist].body.items[song_idx].track.id);
          artistIds.push(playlists[playlist].body.items[song_idx].track.artists[0].id);
        }

        // Get list of song statistics
        stats = [];
        stats_APIdata = await spotifyApi.getAudioFeaturesForTracks(trackIds);
        stats_APIdata.body.audio_features.forEach((item) => {
          stats.push(item);
        });

        // Get list of song data
        // Split artistIds into arrays of 50 each
        var perChunk = 50 // items per chunk    
        let artistArrays = artistIds.reduce((resultArray, item, index) => { 
          const chunkIndex = Math.floor(index/perChunk)

          if(!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
          }

          resultArray[chunkIndex].push(item)
          return resultArray
        }, []);      

        // For each array, make a request with .getTracks()
        let genresArray = [];
        let imageArray = [];
        for (let artistArray in artistArrays) {
          let artists = await spotifyApi.getArtists(artistArrays[artistArray]);
          for (let artist in artists.body.artists) {
            if (artists.body.artists[artist] != null) {
              genresArray.push(artists.body.artists[artist].genres);
              imageArray.push(artists.body.artists[artist].images);
            }
            else {
              genresArray.push(["unknown"]);
              imageArray.push("unknown");     // TODO: Maybe change to url of white image?
            }
          }
        }

        var song_data = []
        for (var song_idx in playlists[playlist].body.items) {
          let song = playlists[playlist].body.items[song_idx];
          song_data.push({ 
              'track_id': trackIds[song_idx],
              'album_name': song.track.album.name,
              'artists': {
                  'name': song.track.artists[0].name,
                  'genres': genresArray[song_idx],
                  'image': imageArray[song_idx],
              },
              'song_name': song.track.name,
              'genres': genresArray[song_idx],
              'popularity': song.track.popularity,
              'statistics': stats[song_idx]
          });
        }
        
        // Store data
        data.push({
          'name': res.body.items[playlist].name,
          'songs': song_data
        });  
      }

      resolve(data);
    });
  });
}

app.listen(8888, () =>
  console.log(
    'HTTP Server up. Now go to http://localhost:8888/login in your browser.'
  )
);



