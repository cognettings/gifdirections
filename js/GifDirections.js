'use strict';

var gifDirections = (function () {
	// Constants
	var IMAGE_SIZE = {
		SMALL : { width : 200, height : 200 },
		MEDIUM : { width : 300, height : 300 },
		LARGE : { width : 400, height : 400 }
	};
	var GRANULARITY = {
		LOW : 'low',
		MEDIUM : 'medium',
		HIGH : 'high'
	};
	var OVERLAY_DIRECTIONS = false;
	var TIME_PER_DIRECTION_FRAME = 1000;
	var TIME_PER_FRAME = 500;

	// Properties
	var previousGifs = [];

	/**
	 * Check the options and choose defaults if necessary.
	 */
	function _checkOptions(options) {
		if (options) {
			if (!options.origin || !options.destination) {
				return false;
			}
			
			options.granularity = (options.granularity) ? options.granularity : GRANULARITY.MEDIUM;
			options.imageSize = (options.imageSize) ? options.imageSize : IMAGE_SIZE.MEDIUM;
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
			previousGifs.push(options);
			
			callback(getLastGif());
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
		var length = previousGifs.length;
	
		if (length > 0) {
			return previousGifs[length - 1];
		}
	}
	
	/**
	 * Return an array containing all the previously generated Gifs.
	 */
	function getPreviousGifs() {
		return previousGifs;
	}
	
	return {
		genDirectionsGif : genDirectionsGif,
		getLastGif : getLastGif,
		getPreviousGifs : getPreviousGifs
	};
})();