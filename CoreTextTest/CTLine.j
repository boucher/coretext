@import <AppKit/CPColor.j>
@import "CTFont.j"

var defaultFont = new CTFont("Time", 12),
    defaultColor = [CPColor blackColor];

CTLine = function(/*CGContextRef*/ attributedString) {
	this.attributedString = attributedString;
}

CTLine.createWithAttributedString = function(/*CGContextRef*/ attributedString) {
    return new CTLine(attributedString);
}

// CTLineRef CTLineCreateTruncatedLine( CTLineRef line, double width, CTLineTruncationType truncationType, CTLineRef truncationToken );
// CTLineRef CTLineCreateJustifiedLine( CTLineRef line, CGFloat justificationFactor, double justificationWidth );

CTLine.prototype.draw = function(/*CGContextRef*/ context) {
    var range = CPMakeRange(0,0),
        index = 0,
        string = [this.attributedString string]
        length = [string length],
        dx = 0,
        dx1 = 0;
    
    while (index < length)
    {
        var attributes = [this.attributedString attributesAtIndex:index effectiveRange:range],
            font = [attributes objectForKey:kCTFontAttributeName] || defaultFont,
            color = [attributes objectForKey:kCTForegroundColorAttributeName] || defaultColor,
            run = [string substringWithRange:range];
        
		fillTextNative(context, run, (context.textX || 0) + dx, context.textY || 0, color, font)
		dx += measureTextNative(context, run, font)
    
    	//fillTextTypefaceJS(context, run, (context.textX || 0) + dx1, context.textY || 0, color, font)
    	//dx1 += measureTextTypefaceJS(context, run, font);
    	
    	//console.log("dx="+dx+" dx1="+dx1);

        index = CPMaxRange(range);
    }
}


function fillTextNative(context, text, x, y, color, font)
{
    //console.error("y="+y);
	context.fillStyle = [color cssString];
	context.font = font.size + "pt " + font.name;

	//CPLog.warn("text=" + text + " color=" + context.fillStyle + " font="+context.font);

	context.fillText(text, x, y);
}

function measureTextNative(context, text, font)
{
	context.font = font.size + "pt " + font.name;
	return context.measureText(text).width;
}

function fillTextTypefaceJS(context, text, x, y, color, font)
{
    //console.error("y="+y);
    var style = _typeface_js.styleFromFontAndColor(font, color);

	//CPLog.warn("text="+text+" style.color="+style.color+" style.fontFamily="+style.fontFamily+" style.fontSize="+style.fontSize);

    context.save();
    context.translate(x, y);

    _typeface_js.renderText(context, text, style);

    context.restore();
}

function measureTextTypefaceJS(context, text, font)
{
    var style = _typeface_js.styleFromFontAndColor(font, nil);
    
    //CPLog.info("style.fontFamily="+style.fontFamily)
    
    var face = _typeface_js.faceFromStyle(style);
    
    var extents = _typeface_js.getTextExtents(face, style, text);
    
    //for (var i in extents)
    //    console.log(i + "=>" + extents[i]);
    
    var x = _typeface_js.pixelsFromPoints(face, style, extents.x);
    
    var x1 = _typeface_js.getTextExtentsX(face, style, text);
    
    //console.log("x="+x+" x1="+x1);
    
	return x;
}

// glyphCount
// glyphRuns
// stringRange
// penOffsetForFlush

// imageBounds
// typographicBounds
// trailingWhitespaceWidth

// offsetForStringIndex
// stringIndexForPosition

// typeID


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

//(function() {

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
		    //console.log('DEBUG: ' + message);
		},
		error: function(message) {
			console.error('ERROR: ' + message);
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
		var horizontalAdvance = 0;
	
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

	getTextExtentsX: function(face, style, text) {
	    
		var letterSpacingPoints = 
			style.letterSpacing && style.letterSpacing != 'normal' ? 
				this.pointsFromPixels(face, style, style.letterSpacing) : 
				0;
				
	    var x = 0;
		for (var i = 0; i < text.length; i++) {
		    var glyph = face.glyphs[text.charAt(i)] ? face.glyphs[text.charAt(i)] : face.glyphs[this.fallbackCharacter];
            x += this.pixelsFromPoints(face, style, glyph.ha) + letterSpacingPoints;
            //log.debug("glyph.ha="+glyph.ha + " letterSpacingPoints="+ letterSpacingPoints)
	    }
	    
	    return x;
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
    
    faceFromStyle : function(style) {
        var face;
		if (this.faces[style.fontFamily] && this.faces[style.fontFamily][style.fontWeight])
		{
			face = this.faces[style.fontFamily][style.fontWeight][style.fontStyle];
		}
		else
		{
		    var components = [];
		    components.push(style.fontFamily);
		    if (style.fontWeight !== "normal") components.push(style.fontWeight);
		    if (style.fontStyle !== "normal") components.push(style.fontStyle);
		    if (components.length < 2) components.push("regular");
		    
		    var path = "fonts/"+components.join("_")+".typeface.js";
    		this.log.debug("path="+path);
		    
    		var fontReq = new XMLHttpRequest();
            fontReq.open("GET", path, false);
            fontReq.send(null);
            var serverResponse = fontReq.responseText;
            //alert(serverResponse);
            // FIXME: eval bad! 
            eval(serverResponse);
    		if (this.faces[style.fontFamily] && this.faces[style.fontFamily][style.fontWeight])
    		{
    			face = this.faces[style.fontFamily][style.fontWeight][style.fontStyle];
    		}
		}
		this.log.debug("face="+face+" style.fontFamily="+style.fontFamily+" style.fontWeight="+style.fontWeight+" style.fontStyle="+style.fontStyle);
		return face;
    },
    
	defaultStyle : { 
    	color: "rgb(64, 255, 64)",//browserStyle.color, 
    	fontFamily: "helvetiker",//browserStyle.fontFamily.split(/\s*,\s*/)[0].replace(/(^"|^'|'$|"$)/g, '').toLowerCase(), 
    	fontSize: 15,//this.pixelsFromCssAmount(browserStyle.fontSize, 12),
    	fontWeight: "normal",//this.cssFontWeightMap[browserStyle.fontWeight],
    	fontStyle: "normal",//browserStyle.fontStyle ? browserStyle.fontStyle : 'normal',
    	fontStretchPercent: 1,//this.cssFontStretchMap[inlineStyle && inlineStyle['font-stretch'] ? inlineStyle['font-stretch'] : 'default'],
    	textDecoration: "underline",//browserStyle.textDecoration,
    	lineHeight: 21,//this.pixelsFromCssAmount(browserStyle.lineHeight, 'normal'),
    	letterSpacing: 0//this.pixelsFromCssAmount(browserStyle.letterSpacing, 0)
    },
    
    styleFromFontAndColor : function(font, color) {
        var style = {};
        if (color)
            style.color = [color cssString];
        if (font) {
            style.fontFamily = font.name.split(/\s*,\s*/)[0].replace(/(^"|^'|'$|"$)/g, '').toLowerCase();
            style.fontSize = font.size * (100 / 75);
        }
        
        return this.mergeStyles(style, this.defaultStyle);
    },
    
    mergeStyles : function(a, b) {        
        style = {};
        for (var property in b)
            style[property] = b[property];
        for (var property in a)
            style[property] = a[property];
        return style;
    },

    renderGlyph : function(ctx, face, char, style) {
        
        this.cache_canvas = document.createElement("canvas");
        this.cache_canvas.width = "500";
        this.cache_canvas.height = "500";
        
        if (true)
            this.cache_canvas.setAttribute("style", "position: absolute; right: 0px; top: 0px; border: 1px solid green;");
        else
            this.cache_canvas.style.display = "none";
            
        document.body.appendChild(this.cache_canvas);
        
        this.cache_ctx = this.cache_canvas.getContext('2d');
        
        this.cache_x = 0;
        
        this.renderGlyph = this._renderGlyph;
        return this.renderGlyph.apply(this, arguments);
    },

	_renderGlyph: function(ctx, face, char, style) {

		var glyph = face.glyphs[char];

        //for (var i in glyph)
        //    this.log.debug(char + ": "+ i + "->" + glyph[i]);

		if (!glyph) {
			this.log.error("glyph not defined: " + char);
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
				
                this.log.debug("caching " + char)
                //cache_ctx.fillStyle = "green";
                //cache_ctx.fillRect(0, 0, 50, 50);
				
				cache = glyph.cached[style.hash] = {};
				cache.w = cache.h = 30;
				cache.x = this.cache_x;
				cache.y = 30;
				
				this.cache_x += 30;
				
				//for (var i in cache)
				//    this.log.debug("cache " + i + "=" + cache[i]);
				
				this.cache_ctx.save();
				
				var pointScale = this.pixelsFromPoints(face, style, 1);
				
				this.cache_ctx.translate(cache.x, cache.y);
				
				this.cache_ctx.scale(pointScale * style.fontStretchPercent, -1 * pointScale);
				this.cache_ctx.translate(0, -1 * face.ascender);
				this.cache_ctx.fillStyle = style.color;
				
				this.log.debug(face.ascender)
				
				this.cache_ctx.beginPath();

				for (var i = 0; i < outline.length; ) {

					var action = outline[i++];
                    
					switch(action) {
						case 'm':
                            //this.log.debug("action="+action+" "+i+","+(i+1))
							this.cache_ctx.moveTo(outline[i++], outline[i++]);
							break;
						case 'l':
                            //this.log.debug("action="+action+" "+i+","+(i+1))
							this.cache_ctx.lineTo(outline[i++], outline[i++]);
							break;
						case 'q':
                            //this.log.debug("action="+action+" "+i+","+(i+1)+","+(i+2)+","+(i+3))
							var cpx = outline[i++];
							var cpy = outline[i++];
							this.cache_ctx.quadraticCurveTo(outline[i++], outline[i++], cpx, cpy);
							break;
					}
					
				}
					
    			this.cache_ctx.fill();
				this.cache_ctx.restore();
            }
            
            
			//ctx.fillStyle = "rgb("+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+")";
			//ctx.fillRect(0, 0, cache.w, cache.h);
			
			//cache_ctx.fillStyle = "rgb("+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+")";
		    //cache_ctx.fillRect(cache.x, cache.y, cache.w, cache.h);
            
            ctx.drawImage(this.cache_canvas, cache.x, cache.y, cache.w, cache.h, 0, 0, cache.w, cache.h);
		
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

	renderText: function(ctx, string, style) {
	    //style = this.mergeStyles(style, this.defaultStyle);     

        styleAddHash(style);

		var face = this.faceFromStyle(style);

		if (!face) {
		    this.log.debug("no font " + style.fontFamily);
			return;
		}

        this.renderWord(face, style, string, ctx);
	},

	renderWord: function(face, style, text, ctx) {
		//var surface = this.initializeSurface(face, style, text, canvas);
		
		//var pointScale = this.pixelsFromPoints(face, style, 1);
		//this.log.debug("pointScale="+pointScale);
		//ctx.save();
		//ctx.scale(pointScale * style.fontStretchPercent, -1 * pointScale);
		//ctx.translate(0, -1 * face.ascender);
		
		//ctx.fillStyle = style.color;
		
		//var ctx = surface.context;
		//var canvas = surface.canvas;
		//ctx.beginPath();
		ctx.save();

		var chars = text.split('');
		for (var i = 0; i < chars.length; i++) {
			var char = chars[i];
			this.renderGlyph(ctx, face, char, style);
		}

		//ctx.fill();
		
		var pointScale = this.pixelsFromPoints(face, style, 1);

		if (style.textDecoration == 'underline') {
            this.log.error("drawing line " + (face.underlinePosition*pointScale) + "," + (face.underlineThickness*pointScale) )
			ctx.beginPath();
			ctx.moveTo(0, face.underlinePosition * pointScale);
			ctx.restore();
			ctx.lineTo(0, face.underlinePosition * pointScale);
			ctx.strokeStyle = style.color;
			ctx.lineWidth = face.underlineThickness * pointScale;
			ctx.stroke();
		}
		else
		    ctx.restore();
		
		//ctx.restore();
	}
};


function styleAddHash(style) {
    if (style.hash)
        return;
    
    style.hash = style.fontSize + "-" + style.color;
}

//})();
