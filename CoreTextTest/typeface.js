(function() {
    
    cache_x = 0;
    
function styleAddHash(style) {
    if (style.hash)
        return;
        
    style.hash = style.fontSize + "-" + style.color;
}

var _typeface_js = {

	faces: {},

	loadFace: function(typefaceData) {

		var familyName = typefaceData.familyName.toLowerCase();
		
		if (!this.faces[familyName]) {
			this.faces[familyName] = {};
		}
		if (!this.faces[familyName][typefaceData.cssFontWeight]) {
			this.faces[familyName][typefaceData.cssFontWeight] = {};
		}

		var face = this.faces[familyName][typefaceData.cssFontWeight][typefaceData.cssFontStyle] = typefaceData;
		face.loaded = true;
	},
	
	pixelsFromPoints: function(face, style, points, dimension) {
		var pixels = points * parseInt(style.fontSize) * 72 / (face.resolution * 100);
		if (dimension == 'horizontal' && style.fontStretchPercent) {
			pixels *= style.fontStretchPercent;
		}
		return pixels;
	},

	pointsFromPixels: function(face, style, pixels, dimension) {
		var points = pixels * face.resolution / (parseInt(style.fontSize) * 72 / 100);
		if (dimension == 'horizontal' && style.fontStretchPrecent) {
			points *= style.fontStretchPercent;
		}
		return points;
	},
	
	fallbackCharacter: '.',

	getTextExtents: function(face, style, text) {
		var extentX = 0;
		var extentY = 0;
		var horizontalAdvance;
	
		for (var i = 0; i < text.length; i++) {
			var glyph = face.glyphs[text.charAt(i)] ? face.glyphs[text.charAt(i)] : face.glyphs[this.fallbackCharacter];
			var letterSpacingAdjustment = this.pointsFromPixels(face, style, style.letterSpacing);
			extentX += Math.max(glyph.ha, glyph.x_max) + letterSpacingAdjustment;
			horizontalAdvance += glyph.ha + letterSpacingAdjustment;
		}
		return { 
			x: extentX, 
			y: extentY,
			ha: horizontalAdvance
			
		};
	},
	
	renderText: function(string, canvas, style) {
	    
        var style = style || { 
        	color: "rgb(64, 64, 64)",//browserStyle.color, 
        	fontFamily: "helvetiker",//browserStyle.fontFamily.split(/\s*,\s*/)[0].replace(/(^"|^'|'$|"$)/g, '').toLowerCase(), 
        	fontSize: 15,//this.pixelsFromCssAmount(browserStyle.fontSize, 12),
        	fontWeight: "normal",//this.cssFontWeightMap[browserStyle.fontWeight],
        	fontStyle: "normal",//browserStyle.fontStyle ? browserStyle.fontStyle : 'normal',
        	fontStretchPercent: 1,//this.cssFontStretchMap[inlineStyle && inlineStyle['font-stretch'] ? inlineStyle['font-stretch'] : 'default'],
        	textDecoration: "none",//browserStyle.textDecoration,
        	lineHeight: 21,//this.pixelsFromCssAmount(browserStyle.lineHeight, 'normal'),
        	letterSpacing: 0.5//this.pixelsFromCssAmount(browserStyle.letterSpacing, 0)
        };
        
        styleAddHash(style);

		var face;
		if (
			this.faces[style.fontFamily] && 
			this.faces[style.fontFamily][style.fontWeight]
		) {
			face = this.faces[style.fontFamily][style.fontWeight][style.fontStyle];
		}

		if (!face) {
		    console.log("no font " + style.fontFamily);
			return;
		}
		
		
        var s = new Date();
        this.renderWord(face, style, string, canvas);
        var dt = new Date() - s;
        console.log("1) dt=" + dt + " len=" + string.length + " dt/length="+(dt/string.length));
        
        
        var ctx = canvas.getContext("2d");
		ctx.restore();
        ctx.font = style.fontSize+"px "+style.fontFamily;
        ctx.fillStyle = style.color;
        
        var s = new Date();
        ctx.fillText(string, 0, 30);
        var dt = new Date() - s;
        console.log("2) dt=" + dt + " len=" + string.length + " dt/length="+(dt/string.length));
        
	},
	
	applyElementVerticalMetrics: function(face, style, e) {

		var boundingBoxAdjustmentTop = this.pixelsFromPoints(face, style, face.ascender - Math.max(face.boundingBox.yMax, face.ascender)); 
		var boundingBoxAdjustmentBottom = this.pixelsFromPoints(face, style, Math.min(face.boundingBox.yMin, face.descender) - face.descender); 
				
		var cssLineHeightAdjustment = 0;
		if (style.lineHeight != 'normal') {
			cssLineHeightAdjustment = style.lineHeight - this.pixelsFromPoints(face, style, face.lineHeight);
		}
		
		var marginTop = Math.round(boundingBoxAdjustmentTop + cssLineHeightAdjustment / 2);
		var marginBottom = Math.round(boundingBoxAdjustmentBottom + cssLineHeightAdjustment / 2);

		e.style.marginTop = marginTop + 'px';
		e.style.marginBottom = marginBottom + 'px';
	
	},

	vectorBackends: {

		canvas: {

			_initializeSurface: function(face, style, text, canvas) {

				var extents = this.getTextExtents(face, style, text);

				var canvas = canvas || document.createElement('canvas');
				canvas.innerHTML = text;

				this.applyElementVerticalMetrics(face, style, canvas);
				canvas.height = Math.round(this.pixelsFromPoints(face, style, face.lineHeight)) + 20;

				canvas.width = Math.round(this.pixelsFromPoints(face, style, extents.x, 'horizontal')) + 20;
	
				if (extents.x > extents.ha) 
					canvas.style.marginRight = Math.round(this.pixelsFromPoints(face, style, extents.x - extents.ha, 'horizontal')) + 'px';

				var ctx = canvas.getContext('2d');
                //
				//var pointScale = this.pixelsFromPoints(face, style, 1);
				//ctx.scale(pointScale * style.fontStretchPercent, -1 * pointScale);
				//ctx.translate(0, -1 * face.ascender);
				//ctx.fillStyle = style.color;

				return { context: ctx, canvas: canvas };
			},

			_renderGlyph: function(ctx, face, char, style) {

				var glyph = face.glyphs[char];

                //for (var i in glyph)
                //    console.log(char + ": "+ i + "->" + glyph[i]);

				if (!glyph) {
					console.error("glyph not defined: " + char);
					return this.renderGlyph(ctx, face, this.fallbackCharacter, style);
				}
				
				if (!glyph.cached)
				    glyph.cached = {};

                

				if (glyph.o) {

                    var cache = glyph.cached[style.hash];

                    if (!cache) {
    					var outline;
    					if (glyph.cached_outline) {
    						outline = glyph.cached_outline;
    					} else {
    						outline = glyph.o.split(' ');
    						glyph.cached_outline = outline;
    					}
    					
                        console.log("caching " + char)
                        //cache_ctx.fillStyle = "green";
                        //cache_ctx.fillRect(0, 0, 50, 50);
    					
    					cache = glyph.cached[style.hash] = {};
    					cache.w = cache.h = 30;
    					cache.x = cache_x;
    					cache.y = 30;
    					
    					cache_x += 30;
    					
    					//for (var i in cache)
    					//    console.log("cache " + i + "=" + cache[i]);
    					
    					cache_ctx.save();
    					
        				var pointScale = this.pixelsFromPoints(face, style, 1);
        				
    					cache_ctx.translate(cache.x, cache.y);
        				
        				cache_ctx.scale(pointScale * style.fontStretchPercent, -1 * pointScale);
        				cache_ctx.translate(0, -1 * face.ascender);
        				cache_ctx.fillStyle = style.color;
    					
    					console.log(face.ascender)
    					
    					cache_ctx.beginPath();

    					for (var i = 0; i < outline.length; ) {

    						var action = outline[i++];
                            
    						switch(action) {
    							case 'm':
                                    //console.log("action="+action+" "+i+","+(i+1))
    								cache_ctx.moveTo(outline[i++], outline[i++]);
    								break;
    							case 'l':
                                    //console.log("action="+action+" "+i+","+(i+1))
    								cache_ctx.lineTo(outline[i++], outline[i++]);
    								break;
    							case 'q':
                                    //console.log("action="+action+" "+i+","+(i+1)+","+(i+2)+","+(i+3))
    								var cpx = outline[i++];
    								var cpy = outline[i++];
    								cache_ctx.quadraticCurveTo(outline[i++], outline[i++], cpx, cpy);
    								break;
    						}
    						
    					}
        					
            			cache_ctx.fill();
        				cache_ctx.restore();
                    }
                    
                    
    				//ctx.fillStyle = "rgb("+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+")";
        			//ctx.fillRect(0, 0, cache.w, cache.h);
        			
    				//cache_ctx.fillStyle = "rgb("+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+")";
    			    //cache_ctx.fillRect(cache.x, cache.y, cache.w, cache.h);
                    
                    ctx.drawImage(cache_canvas, cache.x, cache.y, cache.w, cache.h, 0, 0, cache.w, cache.h);
				
				}
				if (glyph.ha) {
					var letterSpacingPoints = 
						style.letterSpacing && style.letterSpacing != 'normal' ? 
							this.pointsFromPixels(face, style, style.letterSpacing) : 
							0;
					
					var pointScale = this.pixelsFromPoints(face, style, 1);

					ctx.translate((glyph.ha + letterSpacingPoints) * pointScale, 0);
				}
			},

			_renderWord: function(face, style, text, canvas) {
				var surface = this.initializeSurface(face, style, text, canvas);
				var ctx = surface.context;
				var canvas = surface.canvas;
				ctx.beginPath();
				ctx.save();

				var chars = text.split('');
				for (var i = 0; i < chars.length; i++) {
					var char = chars[i];
					this.renderGlyph(ctx, face, char, style);
				}

				ctx.fill();

				if (style.textDecoration == 'underline') {

					ctx.beginPath();
					ctx.moveTo(0, face.underlinePosition);
					ctx.restore();
					ctx.lineTo(0, face.underlinePosition);
					ctx.strokeStyle = style.color;
					ctx.lineWidth = face.underlineThickness;
					ctx.stroke();
				}

				return ctx.canvas;
			}
		},

		vml: {

			_initializeSurface: function(face, style, text) {

				var shape = document.createElement('v:shape');

				var extents = this.getTextExtents(face, style, text);
				
				shape.style.width = style.fontSize + 'px'; 
				shape.style.height = style.fontSize + 'px'; 

				if (extents.x > extents.ha) {
					shape.style.marginRight = this.pixelsFromPoints(face, style, extents.x - extents.ha, 'horizontal') + 'px';
				}

				this.applyElementVerticalMetrics(face, style, shape);

				shape.coordsize = (face.resolution * 100 / style.fontStretchPercent / 72 ) + "," + (face.resolution * 100 / 72);
				
				shape.coordorigin = '0,' + face.ascender;
				shape.style.flip = 'y';

				shape.fillColor = style.color;
				shape.stroked = false;

				shape.path = 'hh m 0,' + face.ascender + ' l 0,' + face.descender + ' ';

				return shape;
			},

			_renderGlyph: function(shape, face, char, offsetX, style) {

				var glyph = face.glyphs[char];

				if (!glyph) {
					//console.error("glyph not defined: " + char);
					this.renderGlyph(shape, face, this.fallbackCharacter, offsetX, style);
				}
				
				var vmlSegments = [];

				if (glyph.o) {
					
					var outline;
					if (glyph.cached_outline) {
						outline = glyph.cached_outline;
					} else {
						outline = glyph.o.split(' ');
						glyph.cached_outline = outline;
					}

					var prevAction, prevX, prevY;

					var i;
					for (i = 0; i < outline.length;) {

						var action = outline[i++];
						var vmlSegment = '';

						var x = Math.round(outline[i++]) + offsetX;
						var y = Math.round(outline[i++]);
	
						switch(action) {
							case 'm':
								vmlSegment = (vmlSegments.length ? 'x ' : '') + 'm ' + x + ',' + y;
								break;
	
							case 'l':
								vmlSegment = 'l ' + x + ',' + y;
								break;

							case 'q':
								var cpx = Math.round(outline[i++]) + offsetX;
								var cpy = Math.round(outline[i++]);

								var cp1x = Math.round(prevX + 2.0 / 3.0 * (cpx - prevX));
								var cp1y = Math.round(prevY + 2.0 / 3.0 * (cpy - prevY));

								var cp2x = Math.round(cp1x + (x - prevX) / 3.0);
								var cp2y = Math.round(cp1y + (y - prevY) / 3.0);

								vmlSegment = 'c ' + cp1x + ',' + cp1y + ',' + cp2x + ',' + cp2y + ',' + x + ',' + y;
								break;
						}
						
						prevAction = action;
						prevX = x;
						prevY = y;
				
						if (vmlSegment.length) {
							vmlSegments.push(vmlSegment);
						}
					}					
				}

				vmlSegments.push('x', 'e');
				return vmlSegments.join(' ');
			},

			_renderWord: function(face, style, text) {
				var offsetX = 0;
				var shape = this.initializeSurface(face, style, text);
		
				var letterSpacingPoints = 
					style.letterSpacing && style.letterSpacing != 'normal' ? 
						this.pointsFromPixels(face, style, style.letterSpacing) : 
						0;

				letterSpacingPoints = Math.round(letterSpacingPoints);
				var chars = text.split('');
				for (var i = 0; i < chars.length; i++) {
					var char = chars[i];
					shape.path += this.renderGlyph(shape, face, char, offsetX, style) + ' ';
					offsetX += face.glyphs[char].ha + letterSpacingPoints ;	
				}

				shape.style.marginRight = this.pixelsFromPoints(face, style, face.glyphs[' '].ha) + 'px';
				return shape;
			}

		}

	},

	setVectorBackend: function(backend) {

		var backendFunctions = ['renderWord', 'initializeSurface', 'renderGlyph'];

		for (var i = 0; i < backendFunctions.length; i++) {
			var backendFunction = backendFunctions[i];
			this[backendFunction] = this.vectorBackends[backend]['_' + backendFunction];
		}
	}
};

// IE won't accept real selectors...
var typefaceSelectors = ['.typeface-js', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

if (document.createStyleSheet) { 
	var styleSheet = document.createStyleSheet();
	for (var i = 0; i < typefaceSelectors.length; i++) {
		var selector = typefaceSelectors[i];
		styleSheet.addRule(selector, 'visibility: hidden');
	}

} else if (document.styleSheets && document.styleSheets.length) {
	var styleSheet = document.styleSheets[0];
	document.styleSheets[0].insertRule(typefaceSelectors.join(',') + ' { visibility: hidden; }', styleSheet.cssRules.length); 
}

var backend = !!(window.attachEvent && !window.opera) ? 'vml' : window.CanvasRenderingContext2D || document.createElement('canvas').getContext ? 'canvas' : null;

if (backend == 'vml') {
	
	document.namespaces.add("v");
	
	var styleSheet = document.createStyleSheet();
	styleSheet.addRule('v\\:*', "behavior: url(#default#VML); display: inline-block;");
}

_typeface_js.setVectorBackend(backend);

window._typeface_js = _typeface_js;
	
// based on code by Dean Edwards / Matthias Miller / John Resig
/*
function typefaceInit() {

	// quit if this function has already been called
	if (arguments.callee.done) return;
	
	// flag this function so we don't do the same thing twice
	arguments.callee.done = true;

	// kill the timer
	if (window._typefaceTimer) clearInterval(_typefaceTimer);

	_typeface_js.renderDocument( function(e) { e.style.visibility = 'visible' } );
};

if (/WebKit/i.test(navigator.userAgent)) {

	var _typefaceTimer = setInterval(function() {
		if (/loaded|complete/.test(document.readyState)) {
			typefaceInit(); 
		}
	}, 10);
}

if (document.addEventListener) {
	window.addEventListener('DOMContentLoaded', function() { typefaceInit() }, false);
} 
*/
/*@cc_on @*/
/*@if (@_win32)

document.write("<script id=__ie_onload_typeface defer src=javascript:void(0)><\/script>");
var script = document.getElementById("__ie_onload_typeface");
script.onreadystatechange = function() {
	if (this.readyState == "complete") {
		typefaceInit(); 
	}
};

/*@end @*/


})();
