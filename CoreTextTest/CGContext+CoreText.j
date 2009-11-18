
CGContextSetTextMatrix = function(/*CGContext*/ c, /*CGAffineTransform*/ t) {
    c.textMatrix = t;
}

CGContextSetTextPosition = function(/*CGContext*/ c, /*CGFloat*/ x, /*CGFloat*/ y) {
    c.textX = x;
    c.textY = y;
}
