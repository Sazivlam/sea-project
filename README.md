# DCRGraph Simulation

The repo contains code for doing collaborative simulation with DCRGraphs.

## Dev setup
The code is written in javascript and uses some librarie, and thus NPM needs to be installed. This can be done on mac with `brew intall npm`, debian based linux with `sudo apt install npm`  and windows with `scoop install npm`.

With NPM the packages pinned is installed with `npm install` and the development environment is ready.

## Building and testing 

The code uses *esbuild* for bundling the code into one file. To do this run the script `npm run build` before executing the application.

For running tests us the script `npm run test`, which executes all automated tests in the `./test` folder.
