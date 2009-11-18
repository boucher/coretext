CTFont = function(name, size, matrix) {
    this.name   = name;
    this.size   = size;
    this.matrix = matrix;
}

// HACK for adding to an attributed string or something

@implementation _CTFontObject : CPObject
{
}

- (unsigned)hash
{
    if (self.__address == nil)
        self.__address = _objj_generateObjectHash();

    return self.__address;
}

@end

CTFont.prototype.isa = _CTFontObject;
