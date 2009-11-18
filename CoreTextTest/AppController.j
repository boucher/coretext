/*
 * AppController.j
 * CoreTextTest
 *
 * Created by __Me__ on __Date__.
 * Copyright 2008 __MyCompanyName__. All rights reserved.
 */

@import <Foundation/CPObject.j>

@import "CoreText.j"

CPLogRegister(CPLogConsole);

@implementation AppController : CPObject
{
}

- (void)applicationDidFinishLaunching:(CPNotification)aNotification
{
    var theWindow = [[CPWindow alloc] initWithContentRect:CGRectMakeZero() styleMask:CPBorderlessBridgeWindowMask],
        contentView = [theWindow contentView];
        
    var testView = [[TestView alloc] initWithFrame:CGRectMake(0, 0, 1000, 500)];
    [contentView addSubview:testView];

    var label = [[CPTextField alloc] initWithFrame:CGRectMakeZero()];

    [label setStringValue:@"Hello World!"];
    [label setFont:[CPFont boldSystemFontOfSize:24.0]];

    [label sizeToFit];

    [label setAutoresizingMask:CPViewMinXMargin | CPViewMaxXMargin | CPViewMinYMargin | CPViewMaxYMargin];
    [label setFrameOrigin:CGPointMake((CGRectGetWidth([contentView bounds]) - CGRectGetWidth([label frame])) / 2.0, (CGRectGetHeight([contentView bounds]) - CGRectGetHeight([label frame])) / 2.0)];

    [contentView addSubview:label];
    
    [theWindow makeFirstResponder:testView];
    [theWindow makeKeyAndOrderFront:self];

    // Uncomment the following line to turn on the standard menu bar.
    //[CPMenu setMenuBarVisible:YES];
}

@end


@implementation TestView : CPView
{
    CPString text;
}

- (id)initWithFrame:(CGRect)aRect
{
    if (self = [super initWithFrame:aRect])
    {
        text = "";
    }
    return self;

}

- (void)drawRect:(CGRect)aRect
{
    var context = [[CPGraphicsContext currentContext] graphicsPort],
        bounds = [self bounds];
        
    // Prepare font
    var font = new CTFont("Helvetiker", 24);

    // Create an attributed string
    var attr = [CPDictionary dictionaryWithObject:font forKey:kCTFontAttributeName],
        attrString = [[CPAttributedString alloc] initWithString:"Hello, World!"+text attributes:attr];

    [attrString addAttribute:kCTFontAttributeName value:(new CTFont("Helvetiker", 12)) range:CPMakeRange(0, 5)];
    [attrString addAttribute:kCTForegroundColorAttributeName value:[CPColor redColor] range:CPMakeRange(4, 5)];
    
    CPLog.info("++++ " + attrString);

    // Draw the string
    var line = CTLine.createWithAttributedString(attrString);
    CGContextSetTextMatrix(context, CGAffineTransformMakeIdentity());
    CGContextSetTextPosition(context, 10, 40);
    CGContextFillRect(context, CGRectMake(10, 40, 5, 5));
    line.draw(context);
}

- (void)keyDown:(CPEvent)anEvent
{
    text += [anEvent characters];
    [self setNeedsDisplay:YES];
}

- (BOOL)acceptsFirstResponder
{
    return YES;
}

@end