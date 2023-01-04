/*
	TODOS
	Add in the Snaky Player Life on the 2D map 
	Implement collision detection and scores when hitting a node 
	Add a score counter somewhere.
	IDEAS: Add EYES (Stereoscopic vision)
 */

// maken two screens, 1 for the developer, and 1 for the player
var canvas2D;
var context2D;
var canvas1D;
var context1D;

function initialize()
{
	// Logick
	Game.initialize();
	// UI
	KeyHandler.initialize();
	
	canvas2D = createCanvas2D();
	context2D = canvas2D.getContext("2d");
	document.body.appendChild(canvas2D);
	canvas1D = createCanvas1D();
	context1D = canvas1D.getContext("2d");
	document.body.appendChild(canvas1D);
	// now start the main loop
	window.requestAnimationFrame(draw);
}

window.onload = function()
{
	initialize();
}

function createCanvas2D()
{
	var canvas = document.createElement("CANVAS");
	canvas.width = 800;
	canvas.height = 600;
	return canvas;
}

function createCanvas1D()
{
	var canvas = document.createElement("CANVAS");
	canvas.width = 800;
	canvas.height = 100;
	return canvas;
}

function draw()
{
	Game.tick();
	context2D.clearRect(0,0,canvas2D.width,canvas2D.height);
	Game.draw2D(context2D);
	context1D.clearRect(0,0,canvas1D.width,canvas1D.height);
	Game.draw1D(context1D);
	window.requestAnimationFrame(draw);
}

// game stuffs
var Game = (
	function()
	{
		var isInitialized = false;
		var isDebugMode = true;
		
		var ROTATION_SPEED = 0.01;
		var PLAYER_ACCELERATION = 0.07;
		
		var gameMap;
		var player;
		var visibleNodes;
		// test 
		var target;
		
		var RENDERING_FOV_OPACITY = 0.2;
		
		return {
			get player() { return player },
			
			initialize: function()
			{
				if(isInitialized) return;
				isInitialized = true;
				Game.newGame();
			},
			
			newGame: function()
			{
				// just clear everything and start again.
				gameMap = new GameMap();
				Game.generateScoreNodes();
				
				var startingPosition = new Vector(gameMap.dimensions.x/2,gameMap.dimensions.y/2);
				player = new Player(startingPosition);
				
				// test 
				target = randomElementInArray(gameMap.scoreNodes);
			},
			
			// random generation for now
			// the real goal is to make is as frustrating as possible for the player;
			// goal: ensure that greedy algorithm distance of nodes exceeds player length by a good amount, such that it doesn't seem impossible to get all of them, but it is still impossible mathematically
			generateScoreNodes: function(number = 50)
			{
				for(var count = 0; count < number; count++)
				{
					var scoreNode = Game.generateRandomScoreNode();
					// first see if it collides already w/ another node, this is sanity check #1
					if(gameMap.isNodeCollidingWith(scoreNode)) continue;
					// all checks passed, add it to the list
					gameMap.addNode(scoreNode);
				}
			},
			
			// context free completely random generation
			generateRandomScoreNode: function()
			{
				// try not to hit the edge, so min and max are tweaked a little based on maxRadius
				var mapWidth = gameMap.dimensions.x;
				var mapHeight = gameMap.dimensions.y;
				var maxRadius = GameScoreNode.prototype.MAX_RADIUS;
				
				var position = new Vector(randomInteger(0+maxRadius, mapWidth-maxRadius)
					,randomInteger(0+maxRadius, mapHeight-maxRadius));
				var radius = randomInteger(1,maxRadius);
				
				var node = new GameScoreNode(position, radius);
				return node;
			},
			
			// controls 
			rotatePlayer: function(angle)
			{
				player.rotate(angle);
			},
			
			tick: function()
			{
				// make two passes to filter out nodes 
				// first, remove all nodes of an arbitrary length away from the camera 
				// then, obviously remove all nodes outside of the FOV (with a few deg of margin)
				visibleNodes = player.getVisibleNodes(gameMap.scoreNodes);
				// controls!
				var rotation = 0;
				var acceleration = 0;
				if(KeyHandler.keysPressed[37]) rotation -= ROTATION_SPEED; 
				if(KeyHandler.keysPressed[39]) rotation += ROTATION_SPEED;
				if(KeyHandler.keysPressed[40]) acceleration += PLAYER_ACCELERATION;
				if(KeyHandler.keysPressed[38]) acceleration -= PLAYER_ACCELERATION;
				// movement! acceleration and all that!
				player.accelerate(acceleration);
				player.rotate(rotation);
				player.tick();
			},
			
			// draw the topdown view
			draw2D: function(context)
			{
				if(!gameMap) return;
				// sanity check draw border
				context.beginPath();
				context.rect(0,0,canvas2D.width,canvas2D.height);
				context.closePath();
				context.stroke();
				// draw nodes
				var nodes = gameMap.scoreNodes;
				for(var index = 0; index < nodes.length; index++)
				{
					var node = nodes[index];
					var fillStyle = "#00";
					
					fillStyle += node === target ? "FF" : "00";
					fillStyle += visibleNodes.indexOf(node) > -1 ? "FF" : "00";
					context.fillStyle = fillStyle;
					// debug rel angle
					if(isDebugMode) context.fillText(`${player.getRelativeAngleTo(node).toFixed(3)}`, node.position.x - 13, node.position.y - node.radius - 10);
					
					Game.draw2DNode(context, node);
				}
				// draw player in red
				context.fillStyle = "#FF0000";
				Game.draw2DNode(context, player);
				// draw direction arrow
				var playerPosition = player.getPosition();
				var playerDirectionArrow = new Vector(-10,0);
				playerDirectionArrow.rotate(player.getAngle());
				playerDirectionArrow.add(playerPosition);
				context.beginPath();
				context.lineTo(playerPosition.x, playerPosition.y);
				context.lineTo(playerDirectionArrow.x, playerDirectionArrow.y);
				context.closePath();
				context.stroke();
				// draw FOV 
				Game.draw2DFOV(context, player);
				
				// test out autorotate
				/*
				var relAngle = (player.getPosition().getAngleTo(target.getPosition()) - player.getAngle() +(Math.PI * 2))%(Math.PI*2);
				if(relAngle>0&&relAngle<Math.PI)
				{
					player.rotate(0.05);
				}
				else 
				{
					player.rotate(-0.05);
				}
				*/
			},
			
			draw2DNode: function(context, node)
			{
				var position = node.getPosition();
				var radius = node.getRadius();
				context.beginPath();
				context.arc(position.x, position.y, radius, 0, 2*Math.PI);
				context.closePath();
				context.fill();
			},
			
			draw2DFOV: function(context, cameraNode)
			{
				var position = cameraNode.getPosition();
				var radius = cameraNode.MAX_VISIBLE_DISTANCE;
				// the angle is going to be screwed up because Canvas and my Angle calc start from different origins (R and L). it's a whole thing, sorry.
				var centerAngle = cameraNode.getAngle() + Math.PI; 
				var arcAngle = cameraNode.getFOV();
				
				var line = new Vector(radius, 0);
				line.rotate(centerAngle - arcAngle/2);
				
				context.beginPath();
				context.lineTo(position.x, position.y);
				context.lineTo(line.x + position.x, line.y + position.y);
				context.arc(position.x, position.y, radius, centerAngle - arcAngle/2, centerAngle + arcAngle/2);
				context.lineTo(position.x, position.y);
				// context.arc(position.x, position.y, radius, 0, 1);
				context.closePath();
				
				context.globalAlpha = RENDERING_FOV_OPACITY;
				context.fill();
				context.globalAlpha = 1.0;
			},
			
			// draw the flatland view
			draw1D: function(context)
			{
				if(!gameMap) return;
				// sanity check draw border
				context.beginPath();
				context.rect(0,0,canvas1D.width,canvas1D.height);
				context.closePath();
				context.stroke();
				
				// draw visible nodes only, since we're in 1st person view from player's perspective
				for(var index = 0; index < visibleNodes.length; index++)
				{
					var node = visibleNodes[index];
					var fillStyle = "#00";
					
					fillStyle += node === target ? "FF" : "00";
					fillStyle += "00";
					context.fillStyle = fillStyle;
										
					Game.draw1DNode(context, node, player);
				}
				
				// now draw the centerline crosshair
				context.strokeStyle = "#FF0000";
				context.beginPath();
				context.lineTo(canvas1D.width/2, 0);
				context.lineTo(canvas1D.width/2, 50);
				context.closePath();
				context.stroke();
			},
			
			draw1DNode: function(context, node, camera)
			{
				var viewportWidth = canvas1D.width;
				
				// rel angle centered at 0, +/- indicates left and right. we convert back to make it easier to work with.
				var relativeAngle = player.getRelativeAngleTo(node);
				if(relativeAngle > Math.PI) relativeAngle -= (Math.PI * 2);
				var positionScreenRatio = relativeAngle/camera.getFOV();
				var centerX = (positionScreenRatio * viewportWidth) + 400; // we don't div 2 because FOV already does that for us
				
				// now get the width
				var distance = camera.getDistanceTo(node);
				var circumference = distance * Math.PI * 2;
				var arcLength = circumference * ( camera.getFOV() / (Math.PI * 2) );
				var sizeScreenRatio = (node.radius * 2) / arcLength; // technically wrong, but insignificant for our purposes. don't use it for calculations, only rendering...
				var width = sizeScreenRatio * viewportWidth;
				
				// for an extra bonus, the farther away from our max vision, the lighter it is, for that extra touch of pseudo-3d-1d-idk_what_d_it_is
				var distanceRatio = distance/player.MAX_VISIBLE_DISTANCE;
				// now we gotta invert it, the CLOSER we are the lighter we want it to be 
				distanceRatio = Math.abs(distanceRatio - 1);
				// just in case.
				distanceRatio = Math.min(Math.max(distanceRatio, 0), 1);
				
				context.globalAlpha = distanceRatio;
				// now finally, we get to draw 
				context.beginPath();
				context.rect(centerX - width/2, 0, width, 50);
				context.closePath();
				context.fill();
				context.globalAlpha = 1.0;
			},
		}
	}
)();

function GameMap(width = this.BASE_WIDTH, height = this.BASE_HEIGHT)
{
	this.scoreNodes = [];
	this.dimensions = new Vector(width,height);
	this.playerPath = []; // will mostly be used for debugging
}

GameMap.prototype.BASE_WIDTH = 800;
GameMap.prototype.BASE_HEIGHT = 600;

GameMap.prototype.addNode = function(node)
{
	this.scoreNodes.push(node);
}

GameMap.prototype.isNodeCollidingWith = function(comparisonNode)
{
	for(var index = 0; index < this.scoreNodes.length; index++)
	{
		var node = this.scoreNodes[index];
		if(node.isCollidingWith(comparisonNode)) return true;
	}
	return false;
}

/**
 * Map object base class.
 * @param position the position vector
 */
function Node(position, radius = 1)
{
	this.position = position;
	this.radius = radius;
}

Node.prototype.getPosition = function()
{
	return this.position;
}

Node.prototype.setPosition = function(position)
{
	this.position.set(position);
}

Node.prototype.getRadius = function()
{
	return this.radius;
}

Node.prototype.getDistanceTo = function(node)
{
	return this.getPosition().getDistanceTo(node.getPosition());
}

Node.prototype.isCollidingWith = function(node)
{
	var distance = this.getPosition().getDistanceTo(node.getPosition());
	
	if(distance < this.radius + node.radius)
	{
		return true;
	}
	return false;
}

/**
 * the center of the universe! (for now)
 */
function Player(position)
{
	Node.call(this, position, this.BASE_RADIUS);
	
	this.angle = 0;
	this.velocity = new Vector(0,0);
	
	this.fov = this.BASE_FIELD_OF_VIEW;
	
	this.lifeLeft = this.BASE_LIFE; // measured in pixels.
}

ObjectUtilities.compositePrototype(Player, Node);

Player.prototype.BASE_RADIUS = 5;
Player.prototype.BASE_LIFE = 1000;
Player.prototype.BASE_FIELD_OF_VIEW = Math.PI * (3 / 4) // in rads, though any value above 0 is fine; human FOV is 135 deg or 0.75pi rads.
Player.prototype.MAX_VISIBLE_DISTANCE = 300; // cutoff in pixels for rendering in 1D
Player.prototype.FIELD_OF_VIEW_MARGIN = 0.1; // how much we include objects not normally visible in FOV for rendering purposes.
Player.prototype.VELOCITY_TWEEN_RATIO = 0.92;

Player.prototype.getAngle = function()
{
	return this.angle;
}

Player.prototype.getFOV = function()
{
	return this.fov;
}

Player.prototype.getRelativeAngleTo = function(node)
{
	var relativeAngle = this.getPosition().getAngleTo(node.getPosition()) - this.getAngle();
	// normalize now to between 0 and 2PI
	// we're adding ANOTHER 2PI for good measure, because we're minusing our own angle somewhere, and that screws things up; it's fine the modulus doesn't care.
	relativeAngle = (relativeAngle + (Math.PI * 2 * 2)) % (Math.PI * 2);
	return relativeAngle;
}

// for rendering
Player.prototype.getVisibleNodes = function(nodes)
{
	var nodesInFOV = [];
	for(var index = 0; index < nodes.length; index++)
	{
		var node = nodes[index];
		var distance = this.getDistanceTo(node);
		if(this.isNodeInFOV(node) && distance < this.MAX_VISIBLE_DISTANCE) nodesInFOV.push(node);
	}
	return nodesInFOV;
}

Player.prototype.getNodesInFOV = function(nodes)
{
	var nodesInFOV = [];
	for(var index = 0; index < nodes.length; index++)
	{
		var node = nodes[index];
		if(this.isNodeInFOV(node)) nodesInFOV.push(node);
	}
	return nodesInFOV;
}

Player.prototype.isNodeInFOV = function(node)
{
	var relativeAngle = this.getRelativeAngleTo(node);
	// relAngle should be between -FOV/2 and FOV/2 radians in order to count is being in FOV, but since the angle is normalized, we'll use the positive versions instead; still the same angles.
	if( (relativeAngle >= (Math.PI * 2) - (this.fov/2 + this.FIELD_OF_VIEW_MARGIN) && relativeAngle <= (Math.PI * 2))
		|| (relativeAngle >= 0 && relativeAngle <= this.fov/2 + this.FIELD_OF_VIEW_MARGIN) )
	{
		return true;
	}
	return false;
}

Player.prototype.getVelocity = function()
{
	return this.velocity;
}

Player.prototype.move = function(delta)
{
	this.position.add(delta);
}

Player.prototype.accelerate = function(delta)
{
	var deltaVelocity = new Vector(1,0);
	deltaVelocity.scale(delta);
	deltaVelocity.rotate(this.angle);
	this.velocity.add(deltaVelocity);
}

Player.prototype.setAngle = function(angle)
{
	this.angle = angle;
}

Player.prototype.rotate = function(angle)
{
	this.angle += angle;
	this.normalizeAngle(); // reset to between 0 & 2PI
}

Player.prototype.normalizeAngle = function()
{
	this.angle = this.angle % (Math.PI * 2);
	if(this.angle < 0) this.angle += (Math.PI * 2);
}

// keep it simple; don't let it become a god object, as it wonts
Player.prototype.tick = function()
{
	this.position.add(this.velocity);
	// and tween us some friction!
	if(this.velocity.getLength < 0.01)
	{
		this.velocity.zero();
	}
	else 
	{
		this.velocity.scale(this.VELOCITY_TWEEN_RATIO);
	}
}
/**
 * collide with it to get points!
 * the bigger it is, the LESS points it gets (since it's easier to hit, right?)
 */
function GameScoreNode(position, radius)
{
	Node.call(this, position, radius);
}

ObjectUtilities.compositePrototype(GameScoreNode, Node);

GameScoreNode.prototype.BASE_SCORE = 10; // the score when radius is 1 (min score as radius increases is 1)
GameScoreNode.prototype.MAX_RADIUS = GameScoreNode.prototype.BASE_SCORE; // actually a calculated const, sorry, but is based on (and literally just) BASE_SCORE

GameScoreNode.prototype.getScore = function()
{
	return Math.max(1,this.BASE_SCORE - this.radius);
}

/* TESTS */

// manual sanity check(s)
function testRelativeAngle()
{
	var pos_p0p0 = new Vector(0,0);
	var pos_m1p1 = new Vector(-1,1);
	var pos_p0p1 = new Vector(0,1);
	var pos_p1p1 = new Vector(1,1);
	var pos_p1p0 = new Vector(1,0);
	var pos_m1p0 = new Vector(-1,0);
	var pos_p2p1 = new Vector(2,1);
	
	console.log(`Rel Angle from (0,0) to (-1,1) is ${pos_p0p0.getAngleTo(pos_m1p1)} rad.`);
	console.log(`Rel Angle from (0,0) to (0,1) is ${pos_p0p0.getAngleTo(pos_p0p1)} rad.`);
	console.log(`Rel Angle from (0,0) to (1,1) is ${pos_p0p0.getAngleTo(pos_p1p1)} rad.`);
	console.log(`Rel Angle from (0,0) to (1,0) is ${pos_p0p0.getAngleTo(pos_p1p0)} rad.`);
	console.log(`Rel Angle from (0,0) to (-1,0) is ${pos_p0p0.getAngleTo(pos_m1p0)} rad.`);
}