width = 1000 + 2;
height = 1000 + 2;
pad = 700;

Interval = 50

wave_N = 8;
nnn = 5;
mmm = 10+nnn;
Nn = Math.ceil(Math.sqrt(wave_N*mmm/nnn*(height-2)/pad));
Mm = Math.ceil(wave_N/Nn);
text_pad = Math.min(Math.floor((height-2)/nnn/Nn),Math.floor(pad/mmm/Mm));
text_px = Math.min(24,Math.floor(text_pad*0.9));

rate = 0.5
decay = 0.99999-0.0032//-(7/6*(Math.LOG2E*Math.log(wave_N)))/500
//decay = 0.99
init_bias = 16

g_timer = -1;
g_dc = null;
g_canvas = null;
g_imageData = null;
line = new Int32Array(height);
for(var i=0; i<height; i++) {
	line[i] = width*i*3;
}
log = [new Float32Array(width*height*3), new Float32Array(width*height*3)];
log_idx = 0;

flag = [];
color = [];
center_x = [];
center_y = [];
wave_L = [];
wave_limit = [];
wave_time = [];
wave_idx = [];
wave = [];

function init(n) {
	color[n] = [0,0,0];
	flag[n] = 0;
	if (Math.random()<rate) {
		color[n][0] = Math.floor(Math.random()*511)-255;
		color[n][1] = Math.floor(Math.random()*511)-255;
		color[n][2] = Math.floor(Math.random()*511)-255;
		flag[n] = 1;
	}
	center_x[n] = Math.floor(Math.random()*(width-2)/10)*10+1;
	center_y[n] = Math.floor(Math.random()*(height-2)/10)*10+1;
	wave_L[n] = Math.floor(Math.random()*5)*10+10;
	wave_limit[n] = ( Math.floor(Math.random()*10)*5+5 )*wave_L[n];
	wave_time[n] = 0;
	wave_idx[n] = 0;
	wave[n] = new Float32Array(wave_L[n]*3);
	for (var i=0; i<wave_L[n]; i++) {
		var val = Math.sin(Math.PI*i/wave_L[n])*init_bias;
		var idx = 3*i;
		wave[n][idx] = val*color[n][0];
		wave[n][idx+1] = val*color[n][1];
		wave[n][idx+2] = val*color[n][2];
	}
}

function draw(n) {
	var nn = n%Nn;
	var mm = Math.floor(n/Nn);
	var text_x = width+text_pad*2+text_pad*mmm*mm+1;
	var text_y = text_pad+nnn*text_pad*nn+1;
	g_dc.fillStyle = '#000';
	g_dc.fillRect(text_x-text_pad*2,text_y-text_pad,mmm*text_pad,nnn*text_pad);
	g_dc.fillStyle = '#fff';
	g_dc.fillText(n+1+'',text_x-text_px*2,text_y);
	g_dc.fillText('color: '+color[n][0]+', '+color[n][1]+', '+color[n][2],text_x,text_y)
	g_dc.fillText('center: '+(center_x[n]-1)+', '+(center_y[n]-1),text_x,text_y+text_pad);
	g_dc.fillText('length: '+wave_L[n],text_x,text_y+2*text_pad);
	g_dc.fillText('limit: '+wave_limit[n]/wave_L[n],text_x,text_y+3*text_pad);
	var rr = (nnn-1)/2;
	g_dc.fillStyle = 'rgb('+Math.abs(color[n][0])+','+Math.abs(color[n][1])+','+Math.abs(color[n][2])+')';
	g_dc.beginPath();
	g_dc.arc(text_x+text_pad*(9+rr),text_y+rr*text_pad-text_px,rr*text_pad,0,2*Math.PI);
	g_dc.fill();
}

function setupCanvasAndStartSimulation() {
	g_canvas = document.getElementById("sample1");
	g_dc = g_canvas.getContext("2d");
	g_dc.font = text_px+'px serif';
	g_canvas.removeEventListener('mousedown', rainDrop);
	g_canvas.addEventListener('mousedown', rainDrop);
	if (g_timer === -1) {
		for (var n=0; n<wave_N; n++) {
			init(n);
			draw(n);
		}
		g_timer = setInterval(function() { simulation(); }, Interval);
	}
	return true;
}

function rainDrop(evt) {
	//evt = evt || window.event;
	//var x = width*(evt.pageX - g_canvas.offsetLeft)/g_canvas.clientWidth;
	//var y = height*(evt.pageY - g_canvas.offsetTop)/g_canvas.clientHeight;

	//var yOldest = g_2dwave_y[(g_2dwave_idx+1) %2];
	//yOldest[g_2d_offsets[Math.floor(y)]+Math.floor(x)] = 8.0;
	log = [new Float32Array(width*height*3), new Float32Array(width*height*3)];
	log_idx = 0;
	for (var n=0; n<wave_N; n++) {
		init(n);
		draw(n);
	}
}

angle = 0;

function mkWave() {
	var tmp = log[(log_idx+1)%2];
	for(var n=0; n<wave_N; n++) {
		if (flag[n]) {
			var idx = line[center_y[n]]+3*center_x[n];
			for(var c=0; c<3; c++) {
				tmp[idx+c] += wave[n][3*wave_idx[n]+c];
			}
			wave_idx[n] = (wave_idx[n]+1)%wave_L[n];
		}
		wave_time[n]++;
		if (wave_time[n]===wave_limit[n]) {
			init(n);
			draw(n);
		}
	}
}

function simulation() {
	mkWave();
	var image = g_dc.getImageData(0,0,width,height);
	var tmp = log[log_idx];
	log_idx = (log_idx+1)%2;
	var now = log[log_idx];
	for (var h=1; h<height-1; h++) {
		var h1 = line[h-1];
		var h2 = line[h];
		var h3 = line[h+1];
		for (var w=1; w<width-1; w++) {
			var w1 = 3*(w-1);
			var w2 = 3*w;
			var w3 = 3*(w+1);
			for (var c=0; c<3; c++) {
				var val = (now[h1+w1+c]+now[h1+w2+c]+now[h1+w3+c]+now[h2+w1+c]+
				now[h2+w3+c]+now[h3+w1+c]+now[h3+w2+c]+now[h3+w3+c])/4-tmp[h2+w2+c];
				tmp[h2+w2+c] = decay*val;
				image.data[4*(h*width+w)+c] = Math.abs(val);
			}
			image.data[4*(h*width+w)+3] = 255;
		}
	}
	g_dc.putImageData(image,0,0);
}

onload = function() {
	setupCanvasAndStartSimulation();
}
