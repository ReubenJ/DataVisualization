import { initTable, updateSongTable, getTopGenresRanking, topGenreTable} from "./genresongtable.js";
import { createRadarChart } from "./radar-chart.js";

// Common data that is used by the graphs
var currentPlaylist;
var currentlySelectedSongs = []

// Extract statistics 
function extractStatistics(songs) {
    var stats = [];
    // Data format must be:
    // {
    //     axis: "statname", value: "value"
    // }
    for (var song in songs) {
        stats.push([
            {axis: "energy", value: songs[song].statistics.energy },
            {axis: "valence", value: songs[song].statistics.valence },
            {axis: "liveness", value: songs[song].statistics.liveness },
            {axis: "danceability", value: songs[song].statistics.danceability },
            {axis: "speechiness", value: songs[song].statistics.speechiness }
        ]);
    }

    return stats;
}

export function drawRadarChart() {
    // TODO: Put image based on song data 
    var songsStats = extractStatistics(currentlySelectedSongs);
    createRadarChart(songsStats);
}

function getPlaylist(playlists, playlistName){
    for(var i = 0; i < playlists.length; i++){
        if (playlists[i]['name'] == playlistName) {
            return playlists[i];
        }
    }
}

function createDropdownMenu(playlists) {
    // Add playlist names in the dropdown menu
    var playlist_items = [];
    $.each(playlists, function(val, text) {
        console.log(val);
        console.log(text['name']);
        playlist_items.push('<li><a class="dropdown-item" href=#>' + text['name'] + '</a></li>');
    });
    $('#playlists').append(playlist_items.join(''));

    $('#playlists li a').click(function(e) 
    { 
        e.preventDefault();
        $('#playlists .active').attr('aria-current', 'false');
        $('#playlists .active').removeClass('active');
        
        $(this).addClass('active');
        $(this).attr('aria-current', 'true');

        
        // Reset playlist data when changing playlists
        currentPlaylist = getPlaylist(playlists, $(this).text());
        currentlySelectedSongs = [];
        currentlySelectedSongs.push(currentPlaylist.songs[0]);
        currentlySelectedSongs.push(currentPlaylist.songs[1]);

        updateSongTable(currentlySelectedSongs, currentPlaylist);
        drawRadarChart();
        
        return false 
    });
}

function main() {
    // Structure json data 
    $.getJSON("playlists_data.json", (json) => {
        var playlists = json;

        // Create dropdown menu
        createDropdownMenu(playlists);
        
        // Default table values
        currentPlaylist = json[0];
        currentlySelectedSongs.push(currentPlaylist.songs[0]);
        currentlySelectedSongs.push(currentPlaylist.songs[1]);

        // Draw the table
        initTable('#songtable', ["track", "artist"]);
        
        updateSongTable(currentlySelectedSongs, currentPlaylist);
        
        // Draw radar chart
        drawRadarChart();
    });

    $.getJSON("playlists.json", (json) => {
        var playlists = json;
        currentPlaylist = json[0];
        console.log("sonething here");

        initTable('#genretable', ["ranking", "genre"]);
        let genreRanking = getTopGenresRanking(currentPlaylist)
        topGenreTable(genreRanking);

    });
}

main();




