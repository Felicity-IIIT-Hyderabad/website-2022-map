# Felicity '22 Map
Repository for the Felicity '22 map website.

## Dependencies
- [Docker](https://docs.docker.com/engine/install/)

## Setup 
Clone the main repository:
```
git clone git@github.com:Felicity-IIIT-Hyderabad/website-2022-map.git felicity-2022-map
```

Build and run the image:
```
cd felicity-2022-map
./manage.sh start
```

Visit [http://localhost:3000](http://localhost:3000).

To stop the container:
```
./manage.sh stop
```

## Project Structure
All the Phaser3 logic can be found in [index.js](src/index.js).  
Assets (sprite atlas, tilesets and tilemaps) are stored in the [assets](src/assets) directory.  
