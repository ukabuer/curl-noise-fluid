/* based on https://codepen.io/al-ro/pen/Mowyer */

var percent = 4;
var ctx = canvas.getContext("2d");
var mx, my;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
function getLocation(x, y) {
	var bbox = canvas.getBoundingClientRect();
	return {
		x: (x - bbox.left) * (canvas.width / bbox.width),
		y: (y - bbox.top) * (canvas.height / bbox.height)
	};
}
canvas.onmousemove = function (e) {
	var location = getLocation(e.clientX, e.clientY);
	mx = location.x;
	my = location.y;
}

var TWO_PI = 2 * Math.PI;
var mobile = false;
if (navigator.userAgent.match(/Android/i)
	|| navigator.userAgent.match(/webOS/i)
	|| navigator.userAgent.match(/iPhone/i)
	|| navigator.userAgent.match(/iPad/i)
	|| navigator.userAgent.match(/iPod/i)
	|| navigator.userAgent.match(/BlackBerry/i)
	|| navigator.userAgent.match(/Windows Phone/i)
) {
	mobile = true;
}
else {
	mobile = false;
}

var discCount;
if (mobile) {
	discCount = 100;
} else {
	discCount = 1000;
}

var variables = {
	speed: 0.4,
	fade: 0.13,
	step: 250,
	particle_size: 0.7,
	rainbow: true,
	lighten: false,
	colour: '#ff9500',
	cx: canvas.width / 2,
	cy: canvas.height / 8,
	wind: false,
	obstacle: false
}
var tcx = variables.cx, tcy = variables.cy;
//Colours from:
//https://krazydad.com/tutorials/makecolors.php
var red = [];
var grn = [];
var blu = [];

center = 128;
width = 127;
frequency1 = 0.3;
frequency2 = 0.3;
frequency3 = 0.3;

phase1 = 0;
phase2 = 2;
phase3 = 4;

for (s = 0; s < discCount; s++) {
	red[s] = Math.round(Math.sin(frequency1 * s + phase1) * width + center);
	grn[s] = Math.round(Math.sin(frequency2 * s + phase2) * width + center);
	blu[s] = Math.round(Math.sin(frequency3 * s + phase3) * width + center);
	// red[s] = 200;
	// grn[s] = 200;
	// blu[s] = 0;
}
var discs = [];
var ra = Math.min(canvas.height, canvas.width) / percent;
for (i = 0; i < discCount; i++) {
	var style = 'rgba(' + red[i] + ',' + grn[i] + ',' + blu[i] + ', 1)';
	var tx = Math.random() * canvas.width;
	var ty = Math.random() * canvas.height;
	if(variables.obstacle)
		while (distance(tx, ty, variables.cx, variables.cy, ra) <= 0) {
			tx = Math.random() * canvas.width;
			ty = Math.random() * canvas.height;
		}
	var disc = {
		x: tx,
		y: ty,
		x_vel: 0,
		y_vel: 0,
		radius: 1,
		colour: style
	};
	discs.push(disc);
}

/**
 * utils / functions
 */
function distance(x1, y1, x2, y2, ra) {
	var ty = y2 - y1;
	var tx = x2 - x1;
	return Math.sqrt(ty * ty + tx * tx) - ra;
}
function mdistance(x1, y1, x2, y2) {
	var ty = y2 - y1;
	var tx = x2 - x1;
	return Math.sqrt(ty * ty + tx * tx);
}
function smooth_step1(r) {
	if (r < 0) return 0;
	else if (r > 1) return 1;
	return r * r * r * (10 + r * (-15 + r * 6));
}
function sqr(x) {
	return x * x;
}
function cross(x1, y1, x2, y2) {
	return x1 * y2 - y1 * x2;
}
function mag2(x, y) {
	var l = sqr(x) + sqr(y);
	return l;
}

function move() {
	var ra = Math.min(canvas.height, canvas.width) / percent;

	for (i = 0; i < discCount; i++) {
		if (discs[i].x < discs[i].radius) {
			discs[i].x = discs[i].radius; //Math.random() * canvas.width;
			discs[i].y = Math.random() * canvas.height;
			// if (distance(discs[i].x, discs[i].y, variables.cx, variables.cy, ra) < 0) discs[i].x += 2 * ra;
			// discs[i].x_vel = -discs[i].x_vel;
		}
		if (discs[i].y < discs[i].radius) {
			discs[i].x = discs[i].radius; //Math.random() * canvas.width;
			discs[i].y = Math.random() * canvas.height;
			// if (distance(discs[i].x, discs[i].y, variables.cx, variables.cy, ra) < 0) discs[i].y += 2 * ra;
			// discs[i].y_vel = -discs[i].y_vel;
		}
		if (discs[i].x > canvas.width - discs[i].radius) {
			discs[i].x = discs[i].radius; //Math.random() * canvas.width;
			discs[i].y = Math.random() * canvas.height;
			// if (distance(discs[i].x, discs[i].y, variables.cx, variables.cy, ra) < 0) discs[i].x += 2 * ra;
			// discs[i].x_vel = -discs[i].x_vel;
		}
		if (discs[i].y > canvas.height - discs[i].radius) {
			discs[i].x = discs[i].radius; //Math.random() * canvas.width;
			discs[i].y = Math.random() * canvas.height;
			// if (distance(discs[i].x, discs[i].y, variables.cx, variables.cy, ra) < 0) discs[i].y += 2 * ra;
			// discs[i].y_vel = -discs[i].y_vel;
		}

		discs[i].x += variables.speed * discs[i].x_vel;
		discs[i].y += variables.speed * discs[i].y_vel;
	}
}

//Use noise.js library to generate a grid of 2D simplex noise values
try {
	noise.seed(Math.random());
} catch (err) {
	console.log(err.message);
}

function ramp2(r) {
	return smooth_step1((r + 1) / 2) * 2 - 1;
}

function ramp(r) {
	if (r >= 1) return 1;
	else if (r <= -1) return -1;
	else {
		var res = 15.0 / 8.0 * r - 10.0 / 8.0 * r * r * r + 3.0 / 8.0 * r * r * r * r * r;
		return res;
	}
}

function potential(x, y) {
	var ra = Math.min(canvas.height, canvas.width) / percent;
	var lw = variables.step;
	//lw = 1;
	var dis = distance(x, y, variables.cx, variables.cy, ra);
	var hasWind = variables.wind ? 1 : 0;
	var res = (noise.simplex2(x / lw, y / lw) * 3 + 0.1 * y * hasWind);
	if (variables.obstacle) {
		res *= ramp(dis / lw);
	}
	return res * lw;
}

function computeCurl(x, y) {
	var eps = 0.001;
	var n1 = potential(x, y + eps);
	var n2 = potential(x, y - eps);
	var a = (n1 - n2) / (2 * eps);
	var n1 = potential(x + eps, y);
	var n2 = potential(x - eps, y);
	var b = (n1 - n2) / (2 * eps);

	return [a, -b];
}

window.onresize = function () {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	ctx.fillStyle = "rgb(17,27,68)";
	ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}
/*
	speed: 0.4,
	fade: 0.13,
	step: 250,
	particle_size: 0.7,
	rainbow: true,
	lighten: false,
	colour: '#ff9500',
	cx: canvas.width / 2,
	cy: canvas.height / 8,
	wind: false,
	obstacle: false
	*/
var reset_button = {
	reset: function () {
		variables.speed = 0.4;
		variables.fade = 0.13;
		variables.step = 250;
		variables.particle_size = 0.7;

		for (i = 0; i < discCount; i++) {
			var tx = Math.random() * canvas.width;
			var ty = Math.random() * canvas.height;
			if(variables.obstacle)
				while (distance(tx, ty, variables.cx, variables.cy, ra) <= 0) {
					tx = Math.random() * canvas.width;
					ty = Math.random() * canvas.height;
				}
			discs[i].x = tx;
			discs[i].y = ty;
		}
		tcx = variables.cx;
		tcy = variables.cy;
		ctx.fillStyle = "rgb(17,27,68)";
		ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
	}
};
var clear_button = {
	clear: function () {
		ctx.fillStyle = "rgb(17,27,68)";
		ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
	}
};

//dat.gui library controls
var gui = new dat.GUI();
gui.add(variables, 'step').min(0.1).max(1000).step(0.1).listen();
gui.add(variables, 'speed').min(0.0).max(1.0).step(0.01).listen();
gui.add(variables, 'particle_size').min(0.1).max(5).step(0.1).listen();
gui.add(variables, 'fade').min(0.0).max(1.0).step(0.01).listen();
gui.add(variables, 'wind');
gui.add(variables, 'obstacle');
// gui.addColor(variables, 'colour').listen().onChange(function (value) { variables.rainbow = false; });
// if (!mobile) {
// 	gui.add(variables, 'lighten');
// }

gui.add(reset_button, 'reset');
gui.add(clear_button, 'clear');
gui.close();

//DRAW//
ctx.fillStyle = "rgb(17,27,68)";
ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

function draw() {

	ctx.fillStyle = "rgba(17,27,68, " + variables.fade + ")";
	ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

	move();

	ctx.save();
	if (variables.lighten && !mobile) {
		ctx.globalCompositeOperation = "lighten";
	}
	for (i = 0; i < discs.length; i++) {
		if (variables.rainbow) {
			ctx.fillStyle = discs[i].colour;
		} else {
			ctx.fillStyle = variables.colour;
		}

		var curl = computeCurl(discs[i].x, discs[i].y);

		discs[i].x_vel = variables.speed * curl[0];
		discs[i].y_vel = variables.speed * curl[1];
		ctx.beginPath();
		ctx.arc(discs[i].x, discs[i].y, variables.particle_size, 0, TWO_PI);
		ctx.fill();
	}
	var ra = Math.min(canvas.height, canvas.width) / percent;
	if (variables.obstacle) {
		ctx.beginPath();
		ctx.arc(tcx, tcy, ra, 0, TWO_PI);
		ctx.strokeStyle = 'white';
		ctx.stroke();
	}


	ctx.restore();
	window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);