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

    function _addImagesFromPath(path, callback) {
			var streetViewUrl = 'http://maps.googleapis.com/maps/api/streetview?sensor=false&size='
            streetViewUrl += _options.imageSize.width + 'x' + _options.imageSize.height;
			var images = [];
            var numImagesLoaded = 0;
            var imagesToLoad = path.length;
			
			// Get the street view images
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
                
                // Count loaded images. Once done, create the GIF.
                image.onload = function() {
                    numImagesLoaded++;
                    
                    if (numImagesLoaded == imagesToLoad) {
                        createDirectionsGif();
                    }
                };
                
                //console.log(streetViewUrl + locationString + headingString);
                image.crossOrigin = 'Anonymous';
				image.src = streetViewUrl + locationString + headingString;
				images.push(image);
			}
			
            // Create the GIF after all images have been loaded
            function createDirectionsGif() {
                var gif = new GIF({
                    workers: 2,
                    quality: 10
                });
                
                // Add the street view images to the page
                images.forEach(function(image) {
                    //imagesElement.appendChild(image);
                    //gif.addFrame(image, {delay: 500});
                    gif.addFrame(image, {delay: _options.timePerFrame});
                });
                
                gif.on('finished', function(blob) {
                    var renderedGif = URL.createObjectURL(blob);
                    _previousGifs.push(renderedGif);
                    callback(renderedGif);
                });
                
                gif.render();
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
			_addImagesFromPath(options.route.overview_path, callback);
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