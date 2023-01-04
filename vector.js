/**
	Really just a way for me to be lazy-pretty with paired value objects.
	This is about the only object that I feel comfortable using its properties exposed
	because it is so low-level and there are no integrity concerns to its fields.
 */
function Vector(x = 0,y = 0)
{
	this.x = x;
	this.y = y;
}

Vector.prototype.add = function(vector)
{
	if(!(vector instanceof Vector)) return;
	this.x += vector.x;
	this.y += vector.y;
}

Vector.prototype.minus = function(vector)
{
	if(!(vector instanceof Vector)) return;
	this.x -= vector.x;
	this.y -= vector.y;
}

Vector.prototype.equals = function(vector)
{
	if(!(vector instanceof Vector)) return;
	if(this.x === vector.x 
		&& this.y === vector.y)
	{
		return true;
	}
	return false;
}

Vector.prototype.set = function(vector)
{
	if(!(vector instanceof Vector)) return;
	this.x = vector.x;
	this.y = vector.y;
}

Vector.prototype.zero = function()
{
	this.x = 0;
	this.y = 0;
}

Vector.prototype.clone = function()
{
	return new Vector(this.x, this.y);
}

Vector.prototype.getLength = function()
{
	var x = this.x;
	var y = this.y;
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

Vector.prototype.getDistanceTo = function(vector)
{
	// we're not implementing a guard statement since we'd only be returning NaN, which is exactly what the output does in that case
	var x = this.x - vector.x;
	var y = this.y - vector.y;
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

Vector.prototype.getAngle = function()
{
	return Math.atan2(this.y, this.x);
}

/*
	Output in the JS canvas coordinate system (TL=(0,0))
	             PI/2
	    (-1,-1) ( 0,-1) ( 1,-1)
	<---(-1, 0) ( 0, 0) ( 1, 0) PI
	    (-1, 1) ( 0, 1) ( 1, 1)
	             3PI/2
 */
Vector.prototype.getAngleTo = function(vector)
{
	// keep it the same as getDistanceTo(vector) for consistency in the cartesian plane
	var x = this.x - vector.x;
	var y = this.y - vector.y;
	return Math.atan2(y,x);
}

Vector.prototype.normalize = function()
{
	var length = this.getLength();
	this.x = this.x / length;
	this.y = this.y / length;
}

Vector.prototype.scale = function(factor)
{
	this.x *= factor;
	this.y *= factor;
}

// theta in rads. rotates the vector around 0,0, basis vector is (1,0) CCW cartesian = CW JS
Vector.prototype.rotate = function(theta)
{
	var x = this.x * Math.cos(-theta) + this.y * Math.sin(-theta);
	var y = -this.x * Math.sin(-theta) + this.y * Math.cos(-theta);
	this.x = x;
	this.y = y;
}

Vector.prototype.toString = function()
{
	return `{x:${this.x},y:${this.y}}`;
}