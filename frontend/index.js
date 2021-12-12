import { createTable } from "./genresongtable.js";
import { createRadarChart } from "./radar-chart.js";

// Test data (for radar chart)
var testdata = [
    [//iPhone
    {axis:"Battery Life",value:0.22},
    {axis:"Brand",value:0.28},
    {axis:"Contract Cost",value:0.29},
    {axis:"Design And Quality",value:0.17},
    {axis:"Have Internet Connectivity",value:0.22},
    {axis:"Large Screen",value:0.02},
    {axis:"Price Of Device",value:0.21},
    {axis:"To Be A Smartphone",value:0.50}			
    ],[//Samsung
    {axis:"Battery Life",value:0.27},
    {axis:"Brand",value:0.16},
    {axis:"Contract Cost",value:0.35},
    {axis:"Design And Quality",value:0.13},
    {axis:"Have Internet Connectivity",value:0.20},
    {axis:"Large Screen",value:0.13},
    {axis:"Price Of Device",value:0.35},
    {axis:"To Be A Smartphone",value:0.38}
    ],[//Nokia Smartphone
    {axis:"Battery Life",value:0.26},
    {axis:"Brand",value:0.10},
    {axis:"Contract Cost",value:0.30},
    {axis:"Design And Quality",value:0.14},
    {axis:"Have Internet Connectivity",value:0.22},
    {axis:"Large Screen",value:0.04},
    {axis:"Price Of Device",value:0.41},
    {axis:"To Be A Smartphone",value:0.30}
    ]
  ];

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

        // Change the selection of playlist inside the dropdown menu
        $('#playlists li a').click(function(e) 
        { 
            e.preventDefault();
            $('#playlists .active').attr('aria-current', 'false');
            $('#playlists .active').removeClass('active');
            
            $(this).addClass('active');
            $(this).attr('aria-current', 'true');


            return false 
        });
        var playlistOne = json[0];
        currentPlaylist = playlistOne;

        
        // Some testing stuff
        currentSongs.push(currentPlaylist.songs[0]);
        currentSongs.push(currentPlaylist.songs[1]);
        
        currentlySelectedSongs = currentSongs;

        // Draw the table (NOT YET IMPLEMENTED)
        createTable(currentPlaylist, currentlySelectedSongs); 
        drawRadarChart();
    });

    // $(document).ready(function() 
    // {
        
        
    // });
}

main();




