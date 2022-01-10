# Maze Generator

Here is an online [maze generator](https://codebox.net/pages/maze-generator/online) that can create mazes using square,
triangular, hexagonal or circular grids:

<img src="https://codebox.net/assets/images/maze-generator/maze_square.svg" alt="Maze using a square grid" width="200px"> <img src="https://codebox.net/assets/images/maze-generator/maze_circle.svg" alt="Maze using a circular grid" width="200px"> <img src="https://codebox.net/assets/images/maze-generator/maze_hexagon.svg" alt="Maze using a hexagonal grid" width="200px"> <img src="https://codebox.net/assets/images/maze-generator/maze_triangle.svg" alt="Maze using a triangular grid" width="200px">

As well as creating mazes the generator has many other features, for example it can render a 'distance map',
colouring each location in the grid according how far away it is from a selected point:

<img src="https://codebox.net/assets/images/maze-generator/maze_square_distance_map.svg" alt="Maze distance map" width="400px">

The generator offers a choice of 10 different algorithms, which each produce mazes with different characteristics.
All mazes created by these algorithms are 'perfect' mazes, i.e. there is exactly one path connecting any pair of
locations within the grid, and therefore one unique solution to each maze.

If you want to try solving one of the mazes yourself then you can! The generator lets you navigate through the maze
using mouse/keyboard controls, and can automatically move you forward to the next junction in the maze to save you
time. Once you finish a maze your time is displayed, together with an 'optimality score' showing how close your
solution was to the optimal one. Of course, you can also give up at any point and see where you should have gone:

<img src="https://codebox.net/assets/images/maze-generator/maze_playing.png" alt="Maze game in progress" width="300px"> <img src="https://codebox.net/assets/images/maze-generator/maze_solution.png" alt="Maze solution" width="300px">

The generator can either create mazes instantly, or slow down the process so that you can watch the algorithms at work.
Some algorithms work using a process of trial and error, and can take a long time to finish, whereas others are guaranteed
to complete quickly:

<video controls width="300px" poster="https://codebox.net/assets/video/maze-generator/maze_algorithms_poster.png">
    <source src="https://codebox.net/assets/video/maze-generator/maze_algorithms.webm" type="video/webm">
    <source src="https://codebox.net/assets/video/maze-generator/maze_algorithms.mp4" type="video/mp4">
    <source src="https://codebox.net/assets/video/maze-generator/maze_algorithms.ogv" type="video/ogg">
    Sorry, your browser doesn't support embedded videos.
</video>

By creating a mask you can remove cells from the default grids to create interesting shapes:

<img src="https://codebox.net/assets/images/maze-generator/maze_square_masked.svg" alt="Maze using a square grid with masking" width="200px"> <img src="https://codebox.net/assets/images/maze-generator/maze_circle_masked.svg" alt="Maze using a circular grid with masking" width="200px"> <img src="https://codebox.net/assets/images/maze-generator/maze_hexagon_masked.svg" alt="Maze using a hexagonal grid with masking" width="200px"> <img src="https://codebox.net/assets/images/maze-generator/maze_triangle_masked.svg" alt="Maze using a triangular grid with masking" width="200px">

Normally the generator creates a completely unique random maze each time you use it, however if you want to play around with a
particular maze without changing the layout then just take a note of the 'Seed Value' that is displayed alongside it.
Entering this value into the 'Seed' input field will make sure you get the same pattern again when you click the 'New Maze' button.

If you make a maze that you would like to keep you can download your creation as an SVG file,
either with or without the solution displayed.

Many thanks to Jamis Buck for his excellent book [Mazes for Programmers](http://mazesforprogrammers.com) which taught me
everything I needed to know to make this.

## Running Locally
You can [try out the maze generator online here](https://codebox.net/pages/maze-generator/online). 
If you want to run your own copy then:
* Clone the repository, including the 'mazejs' submodule:
      
   `git clone --recurse-submodules git@github.com:codebox/mazes.git`

* Go into the 'mazes' directory:

    `cd mazes`
   
* Start a web server at this location:
   
    `python3 -m http.server` 
