'use strict';

var gifDirections = (function () {
	// Constants
	var IMAGE_SIZE = {
		SMALL : { width : 400, height : 400 },
		MEDIUM : { width : 500, height : 500 },
		LARGE : { width : 600, height : 600 }
	};
	var GRANULARITY = {
		LOW : 'low',
		MEDIUM : 'medium',
		HIGH : 'high'
	};
	var OVERLAY_DIRECTIONS = false;
	var TIME_PER_DIRECTION_FRAME = 1500;
	var TIME_PER_FRAME = 750;

	// Properties
	var _previousGifs = [];
    var _options = {};

    function _addImagesFromPath(path, directions, callback) {
		var streetViewUrl = 'http://maps.googleapis.com/maps/api/streetview?key=AIzaSyDDvZuug7_v9APAkG6aYQhV3oc-SsCbbzU&sensor=false&size='
		streetViewUrl += _options.imageSize.width + 'x' + _options.imageSize.height;
		var images = [];
		var imageSources = [];
		
		// Get the street view image URLs
		for (var i = 0; i < path.length; i++) {
			var point = path[i];
			var nextPoint = (i + 1 < path.length) ? path[i + 1] : 0;
			
			var locationString = '&location=' + point.k + ',' + point.A;
			var headingString = '';
			
			var origin = new google.maps.LatLng(point.k, point.A);
			var destination = nextPoint ? new google.maps.LatLng(nextPoint.k, nextPoint.A) : null;
			
			// Determine the heading between path points
			var heading;
			if (destination) {
				heading = google.maps.geometry.spherical.computeHeading(origin, destination);
				headingString = '&heading=' + heading;
			}
			
			var image = new Image();
			image.crossOrigin = 'Anonymous';
			images.push(image);
			
			//image.src = streetViewUrl + locationString + headingString;
			imageSources.push(streetViewUrl + locationString + headingString);
		}
		
		getImages(imageSources);
		
		/**
		 * Get images from the Google Street View API.
		 */
		function getImages(sourceList) {
			var numImagesLoaded = 0;
			var imagesToLoad = sourceList.length;
			var loadedImages = [];
			var directionsToUse = [];
			var inc = 1;
			
			// Determine number of images to load based on the granularity chosen.
			switch (_options.granularity) {
				case GRANULARITY.LOW:
					inc = 2;
					break;
				case GRANULARITY.MEDIUM:
					inc = 5;
					break;
				case GRANULARITY.HIGH:
					inc = 8;
					break;
			}
			
			imagesToLoad = Math.floor(sourceList.length / inc);
			
			// Load the images.
			for (var i = 0; i < sourceList.length; i += inc) {
				loadedImages.push(images[i]);
				directionsToUse.push(directions[i]);
				
				images[i].onload = function () {
					numImagesLoaded++;
					
					// Update image loading progress
					var progress = numImagesLoaded / imagesToLoad * 100;
					progress = (progress > 100) ? 100 : progress;
					//window.dispatchEvent(new CustomEvent('progress', {'detail' : numImagesLoaded / imagesToLoad * 100}));
					
					// If all the images have been loaded, then generate the gif.
					if (numImagesLoaded == imagesToLoad) {
						images = loadedImages;
						createDirectionsGif();
					}
				}
				
				images[i].src = sourceList[i];
			}
			
			directions = directionsToUse;
		}
		
		// Create the GIF after all images have been loaded
		function createDirectionsGif() {
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			var i = 0;
			var loadedImages = 0;
			var imagesToLoad = images.length;
			var gif = new GIF({
				workers: 4,
				quality: 30
			});
			
			// Set up the canvas context
			canvas.width = _options.imageSize.width;
			canvas.height = _options.imageSize.height;
			ctx.font = '20px Georgia';
			
			// Add the street view images to the page
			images.forEach(function(image) {
				if (_options.overlayDirections) {
					// Overlay directions on each frame
					ctx.drawImage(image, 0, 0);
					var text = new MultilineText(0, 0, canvas.width);
					text.setText(directions[i]);
					text.draw(ctx);
					//ctx.fillText(directions[i], 0, 20);
					image.onload = function () {
						gif.addFrame(image, {delay: _options.timePerFrame});
						loadedImages++;
						
						// Render gif when all the frames have been added.
						if (loadedImages == imagesToLoad) {
							gif.render();
						}
					};
					image.src = canvas.toDataURL();
					//gif.addFrame(canvas, {delay: _options.timePerFrame});
				} else {
					gif.addFrame(image, {delay: _options.timePerFrame});
				}
				
				i++;
			});
			
			// What to do when gif has been created.
			gif.on('finished', function(blob) {
				var renderedGif = URL.createObjectURL(blob);
				_previousGifs.push(renderedGif);
				callback(renderedGif);
			});
			
			if (_options.overlayDirections == false) {
				gif.render();
			}
		}
	}
    
	/**
	 * Check the options and choose defaults if necessary.
	 */
	function _checkOptions(options) {
		if (options) {
			if (!options.origin || !options.destination || !options.route) {
				return false;
			}
			
			options.granularity = (options.granularity) ? options.granularity : GRANULARITY.MEDIUM;
			switch (options.imageSize) {
                case 'small':
                    options.imageSize = IMAGE_SIZE.SMALL;
                    break;
                case 'medium':
                    options.imageSize = IMAGE_SIZE.MEDIUM;
                    break;
                case 'large':
                    options.imageSize = IMAGE_SIZE.LARGE;
                    break;
                default:
                    options.imageSize = IMAGE_SIZE.MEDIUM;
                    break;
            }
			options.overlayDirections = (options.overlayDirections) ? options.overlayDirections : OVERLAY_DIRECTIONS;
			options.timePerDirectionFrame = (options.timePerDirectionFrame) ? options.timePerDirectionFrame : TIME_PER_DIRECTION_FRAME;
			options.timePerFrame = (options.timePerFrame) ? options.timePerFrame : TIME_PER_FRAME;
		
			return true;
		} else {
			return false;
		}
	}
	
	/**
	 * Generate a Gif containing the street view images from one place to another.
	 */
	function genDirectionsGif(options, callback) {
		if (_checkOptions(options)) {
			// Continue with Gif generation.
            _options = options;
			
			// Get the latitudes and longitudes
			var regEx = new RegExp('</?\\w>', 'ig');
			var steps = options.route.legs[0].steps;
			var path = [];
			var directions = [];
			steps.forEach(function (s) {
				path = path.concat(s.path);
				
				if (options.overlayDirections) {
					// Get the instructions for each frame.
					s.path.forEach(function (p) {
						// Remove HTML formatting from instruction.
						var instruction = s.instructions;
						instruction = instruction.replace(regEx, '');
						directions.push(instruction);
					});
				}
			});
			
			_addImagesFromPath(path, directions, callback);
			
			return true;
		} else {
			callback();
			return false;
		}
	}
	
	/**
	 * Return the most recently generated Gif.
	 */
	function getLastGif() {
		var length = _previousGifs.length;
	
		if (length > 0) {
			return _previousGifs[length - 1];
		}
	}
	
	/**
	 * Return an array containing all the previously generated Gifs.
	 */
	function getPreviousGifs() {
		return _previousGifs;
	}
	
    // Return gifDirections' public interface.
	return {
		genDirectionsGif : genDirectionsGif,
		getLastGif : getLastGif,
		getPreviousGifs : getPreviousGifs
	};
})();