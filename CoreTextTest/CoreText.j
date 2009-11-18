@import "CTFont.j"
@import "CTLine.j"
@import "CGContext+CoreText.j"

@import <Foundation/CPAttributedString.j>

// String Attribute Name Constants

kCTFontAttributeName            = "kCTFontAttributeName";
kCTKernAttributeName            = "kCTKernAttributeName";
kCTLigatureAttributeName        = "kCTLigatureAttributeName";
kCTForegroundColorAttributeName = "kCTForegroundColorAttributeName";
kCTParagraphStyleAttributeName  = "kCTParagraphStyleAttributeName";
kCTUnderlineStyleAttributeName  = "kCTUnderlineStyleAttributeName";
kCTVerticalFormsAttributeName   = "kCTVerticalFormsAttributeName";
kCTGlyphInfoAttributeName       = "kCTGlyphInfoAttributeName";

// CTUnderlineStyle

kCTUnderlineStyleNone           = 0x00;
kCTUnderlineStyleSingle         = 0x01;
kCTUnderlineStyleThick          = 0x02;
kCTUnderlineStyleDouble         = 0x09;

// CTUnderlineStyleModifiers

kCTUnderlinePatternSolid        = 0x0000;
kCTUnderlinePatternDot          = 0x0100;
kCTUnderlinePatternDash         = 0x0200;
kCTUnderlinePatternDashDot      = 0x0300;
kCTUnderlinePatternDashDotDot   = 0x0400;