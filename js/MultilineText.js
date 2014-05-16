'use strict';

function Point(x, y) {
	this.x = x;
	this.y = y;
}

Point.prototype.add = function (other) {
	var sum = new Point(this.x, this.y);
	sum.x += other.x;
	sum.y += other.y;
	
	return sum;
};

function MultilineText(x, y, width) {
    this.size = '20';
    this.pos = new Point(x, y + this.size);
    this.width = width;
    this.color = 'black';
    this.lines = [];
	this.font = 'Georgia';
	this.style = '';
}

MultilineText.prototype.setText = function (text) {
    this.lines = text.split('\n');
};

MultilineText.prototype.draw = function (ctx) {
    ctx.fillStyle = this.color;
    ctx.font = this.style + ' ' + this.size + 'px' + ' ' + this.font;
    
    var i;
    var i2;
    var line;
    var lineLength;
    var word;
    var words;
    var toPrint;
    var toPrintCopy;
    var drawPos = new Point(0, 0);
    drawPos = drawPos.add(this.pos);
    
    for (i = 0; i < this.lines.length; i++) {
        line = this.lines[i];
        words = line.split(' ');
        toPrint = '';
        
        for (i2 = 0; i2 < words.length; i2++) {
            word = words[i2];
            toPrintCopy = toPrint + ' ' + word;
            
            // Append word
            lineLength = ctx.measureText(toPrintCopy).width;
            if (lineLength < this.width) {
                toPrint += ' ' + word;
            }
            // Draw text and reset
            else {
                ctx.fillText(toPrint, drawPos.x, drawPos.y);
                drawPos.y += this.size * 1.5;
                toPrint = word;
            }
        }
        
        // Draw the rest of the line
        ctx.fillText(toPrint, drawPos.x, drawPos.y);
        drawPos.y += this.size * 1.5;
    };
};