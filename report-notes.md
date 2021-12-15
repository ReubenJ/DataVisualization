# General info about our data:

## Research questions:
1) What are the different genres and how prevalent are they in my playlist?
2) How do two songs in my playlist compare in terms of the statistical measurements (energy, valence, danceability, ...)?
    - Which of the song is more danceable
    - Which has higher energy etc...
    - Which song is more suitable for a dance party, which song is more suited for a relaxing time.

### Question 1 justification:
    Manually finding the different genres in a random playlist can be a very tedious task. A visualization is a way to provide an insight
    into this by just having a quick look at it. Being able to see the clusters of songs (clustered by genre) in a force directed graph
    allows the user to see the prevalence of a genre, and what kind of genres are present.

    We also have a table that enumerates the prevalent genres which can be used to filter the data the visualizations are focussed on; providing
    a multifaceted way to explore the data.

### Question 2 justification:
    Each song has a different feel/mood/emotion etc.. which has to do with the artist, genre, and more. Spotify lists statistics that describe such
    moods and these can be used to compare songs to see which one fits certain situations/moods better. This can give us an objective way
    (to Spotify's measurement standards) to compare songs based on these statistics and allows us to draw conclusions about which songs fit certain
    situations better. 


## Muzners 4-level analysis framework:
    We should follow this framework and implement it in D3

    1) Domain situation: 
        - Target users:     anyone interested in exploring details about their liked music. (Spotify users)
        - Goals:            Give the user a deeper insight into their liked music. What genres are most common in certain playlists,
                            What type of songs a playlist contains (based on Spotify's song statistics), Figuring out which songs are
                            more suited for certain situations by comparing them based on Spotify's song statistics.
        - Questions:        (See research questions above)

    2) Abstraction:
        - What is shown (abstraction of data):
            - Force graph of songs in a playlist clustered by genre similarity
            - Genre-table displaying all genres prevalent in a playlist
            - Song-table displaying all songs prevalent in a playlist 
            - Radarchart showcasing the statistical values of the each statistic Spotify makes available for a song

        - Why is it shown (abstraction of questions into visualization tasks):
            - Force graph:      Gives a good insight with a quick glance about what the main clusters (of genres) are, which songs are in there
                                and how big these clusters are (how prevalent a genre is)
            - Tables:           Allows for exploration of the data set through interaction. For example, selecting a certain genre will filter the       displayed
                                dataset to only show songs of that genre.
                                Selecting a certain song display the songs in the radarchart that allows for statistical comparisons
            - Radarchart:       Allows the user to visualize and compare the statistical features of a song. These features indicate several key aspects
                                of a song such as its danceability, energy, etc..

    3 and 4)
        - How is it shown:
            Using HTML and JS (D3 library). Not nessecary to go into detail here for the paper.

        - Weaknesses:
            TBD???



# What to write in the paper:
## Problem Analysis
How clearly is the problem described in terms of visualization?

## Justification
How well are the proposed solutions justified?

## Evaluation
How well is the solution evaluated?

## Discussion
How well do you asses your solution?
What improvements do you identify?

## Structure and presentation
Make sure document is well structured and well presented.
See guidelines at the bottom of the assignment pdf.


# Individual reflection
We also have to write an individual reflection where we detail our individual contribution.