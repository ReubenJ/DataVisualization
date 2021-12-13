import { createTable, createTableHeader, updateTable} from "./genresongtable.js";
import { createRadarChart } from "./radar-chart.js";

// Common data that is used by the graphs
var currentPlaylist;
var currentSongs = [];
var currentlySelectedSongs;

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
    
    // Draw the radar chart based on selected items 
    var songsStats = extractStatistics(currentlySelectedSongs);
    createRadarChart(songsStats);
}

function getPlaylist(playlists, playlistName){
    for(var i = 0; i < playlists.length; i++){
        console.log(playlists[i]['name'])
        console.log(playlistName)
        if (playlists[i]['name'] == playlistName) {
            return playlists[i]
        }
    }
}

function main() {
    // Structure json data 
    $.getJSON("playlists_data.json", (json) => {
        var playlists = json;

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

            console.log($(this).text())
            updateTable(getPlaylist(playlists, $(this).text()));

            return false 
        });

        // Change the selection of playlist inside the dropdown menu
    
        var playlistOne = json[0];
        currentPlaylist = playlistOne;

        
        // Some testing stuff
        currentSongs.push(currentPlaylist.songs[0]);
        currentSongs.push(currentPlaylist.songs[1]);
        
        currentlySelectedSongs = currentSongs;

        // Draw the table (NOT YET IMPLEMENTED)
        createTableHeader();
        createTable(playlists, currentlySelectedSongs); 
        drawRadarChart();
    });
}

main();




