/*****************************************************************

typeface.js, version 0.11 | typefacejs.neocracy.org

Copyright (c) 2008, David Chester davidchester@gmx.net 

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*****************************************************************/

(function() {

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

	log: {
		debug: function(message) {
			var typefaceConsole = document.getElementById('typeface-console');
			if (typefaceConsole) 
				typefaceConsole.innerHTML += 'DEBUG: ' + message + "<br>";
		},

		error: function(message) {
			var typefaceConsole = document.getElementById('typeface-console');
			if (typefaceConsole) 
				typefaceConsole.innerHTML += 'ERROR: ' + message + "<br>";
		}
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

	cssFontWeightMap: {
		normal: 'normal',
		bold: 'bold',
		400: 'normal',
		700: 'bold'
	},

	cssFontStretchMap: {
		'ultra-condensed': 0.55,
		'extra-condensed': 0.77,
		'condensed': 0.85,
		'semi-condensed': 0.93,
		'normal': 1,
		'semi-expanded': 1.07,
		'expanded': 1.15,
		'extra-expanded': 1.23,
		'ultra-expanded': 1.45,
		'default': 1
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

	pixelsFromCssAmount: function(cssAmount, defaultValue) {

		var matches = undefined;

		if (cssAmount == 'normal') {
			return defaultValue;

		} else if (matches = cssAmount.match(/([\-\d+\.]+)px/)) {
			return matches[1];

		} else if (matches = cssAmount.match(/([\-\d\.]+)pt/)) {
			return matches[1] * 100 / 75;
		} else {
			return defaultValue;
		}
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
        	letterSpacing: 0//this.pixelsFromCssAmount(browserStyle.letterSpacing, 0)
        };

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

        this.renderWord(face, style, string, canvas);
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

	initializeSurface: function(face, style, text, canvas) {

		var extents = this.getTextExtents(face, style, text);

		var canvas = canvas || document.createElement('canvas');
		canvas.innerHTML = text;

		this.applyElementVerticalMetrics(face, style, canvas);
		canvas.height = Math.round(this.pixelsFromPoints(face, style, face.lineHeight));

		canvas.width = Math.round(this.pixelsFromPoints(face, style, extents.x, 'horizontal'));

		if (extents.x > extents.ha) 
			canvas.style.marginRight = Math.round(this.pixelsFromPoints(face, style, extents.x - extents.ha, 'horizontal')) + 'px';

		var ctx = canvas.getContext('2d');

		var pointScale = this.pixelsFromPoints(face, style, 1);
		ctx.scale(pointScale * style.fontStretchPercent, -1 * pointScale);
		ctx.translate(0, -1 * face.ascender);
		ctx.fillStyle = style.color;

		return { context: ctx, canvas: canvas };
	},

	renderGlyph: function(ctx, face, char, style) {

		var glyph = face.glyphs[char];

		if (!glyph) {
			this.log.error("glyph not defined: " + char);
			return this.renderGlyph(ctx, face, this.fallbackCharacter, style);
		}

		if (glyph.o) {

            if (glyph.cached_image === undefined) {
				var outline;
				if (glyph.cached_outline) {
					outline = glyph.cached_outline;
				} else {
					outline = glyph.o.split(' ');
					glyph.cached_outline = outline;
				}
				
				cache_ctx.save();
				
				glyph.cached_image = cache_count++;
				cache_ctx.translate(glyph.cached_image * 50, 0)
                
                console.log("caching " + char)
                cache_ctx.fillStyle = "green";
                //cache_ctx.fillRect(0, 0, 50, 50);
                cache_ctx.fillStyle = "black";

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
					
    				cache_ctx.fill();
				}
					
				cache_ctx.restore();
            }
            
            var num = glyph.cached_image;
            
            console.log(ctx+","+cache_ctx)
            ctx.drawImage(cache_canvas, num * 50, 0, 50, 50, 0, 0, 50, 50);
		
		}
		if (glyph.ha) {
			var letterSpacingPoints = 
				style.letterSpacing && style.letterSpacing != 'normal' ? 
					this.pointsFromPixels(face, style, style.letterSpacing) : 
					0;

			ctx.translate(Math.round(glyph.ha + letterSpacingPoints), 0);
		}
	},

	renderWord: function(face, style, text, canvas) {
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
};

window._typeface_js = _typeface_js;
	
// based on code by Dean Edwards / Matthias Miller / John Resig

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
