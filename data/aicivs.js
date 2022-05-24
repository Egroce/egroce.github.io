G.AddData({
	name:'AI Civs',
	author:'Egroce',
	desc:'bruh',
	engineVersion:1,
	manifest:0,
	func:function()
		G.funcs['game loaded']=function()
		{
			G.renderMap=function(map,obj)
			{
				console.log("skerr")
				var time=Date.now();
				var timeStep=Date.now();
				var verbose=false;
				var breakdown=false;//visually break down map-drawing into steps, handy to understand what's happening
				var toDiv=l('mapBreakdown');
				if (breakdown) toDiv.style.display='block';
				
				if (verbose) {console.log('Now rendering map.');}
				
				Math.seedrandom(map.seed);
				
				var ts=16;//tile size
				
				var colorShift=true;
				var seaFoam=true;
				//var x1=5,y1=5,x2=x1+3,y2=y1+3;
				var x1=0,y1=0,x2=map.w,y2=map.h;
				if (obj)
				{
					if (obj.x1) x1=obj.x1;
					if (obj.x2) x2=obj.x2;
					if (obj.y1) y1=obj.y1;
					if (obj.y2) y2=obj.y2;
				}
				
				var totalw=map.w;//x2-x1;
				var totalh=map.h;//y2-y1;
				
				var img=Pic('img/terrain.png');
				var fog=Pic('img/blot.png');
				/*
					the format for terrain.png is (from top to bottom) :
						-colors - the map will pick 4 colors at random from this square to draw the tile
						-heightmap 1 - will be drawn on the tile in overlay mode; must be black and white, have values centered around pure gray, and have transparent edges
						-color detail 1 - colors will be drawn over the heightmap in hard-light mode; should also have transparent edges
						-heightmap 2 - a possible variation
						-color detail 2 - a possible variation
					furthermore, the leftmost 2 columns are reserved for land chunks (drawn together in lighten mode)
				*/
				
				//create fog map (draw all tiles with explored>0 as blots on a transparent background)
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.translate(ts/2,ts/2);
				for (var x=0;x<map.w;x++)
				{
					for (var y=0;y<map.h;y++)
					{
						if (x>=x1 && x<x2 && y>=y1 && y<y2)
						{
							var tile=map.tiles[x][y];
							if (tile.explored>0)
							{
								ctx.globalAlpha=tile.explored*0.9+0.1;
								Math.seedrandom(map.seed+'-fog-'+x+'/'+y);
								var s=1;
								//"pull" the center to other explored tiles
								var sx=0;var sy=0;var neighbors=0;
								if (x==0 || map.tiles[x-1][y].explored>0) {sx-=1;neighbors++;}
								if (x==map.w-1 || map.tiles[x+1][y].explored>0) {sx+=1;neighbors++;}
								if (y==0 || map.tiles[x][y-1].explored>0) {sy-=1;neighbors++;}
								if (y==map.h-1 || map.tiles[x][y+1].explored>0) {sy+=1;neighbors++;}
								s*=0.6+0.1*(neighbors);
								sx+=Math.random()*2-1;
								sy+=Math.random()*2-1;
								var pullAmount=2;
								
								var px=choose([0]);var py=choose([0]);
								var r=Math.random()*Math.PI*2;
								
								ctx.translate(sx*pullAmount,sy*pullAmount);
								ctx.scale(s,s);
								ctx.rotate(r);
								ctx.drawImage(fog,px*32+1,py*32+1,30,30,-ts,-ts,32,32);
								ctx.rotate(-r);
								ctx.scale(1/s,1/s);
								ctx.translate(-sx*pullAmount,-sy*pullAmount);
							}
						}
						ctx.translate(0,ts);
					}
					ctx.translate(ts,-map.h*ts);
				}
				ctx.globalAlpha=1;
				var imgFog=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	FOG took 			'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.drawImage(imgFog,0,0);
				var oldc=c;
				
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.drawImage(oldc,0,0);
				ctx.drawImage(c,-1,0);
				ctx.drawImage(c,1,0);
				ctx.drawImage(c,0,-1);
				ctx.drawImage(c,0,1);
				ctx.globalCompositeOperation='destination-out';
				ctx.drawImage(oldc,0,0);
				ctx.drawImage(oldc,0,0);
				ctx.drawImage(oldc,0,0);
				ctx.drawImage(oldc,0,0);
				ctx.drawImage(oldc,0,0);
				ctx.globalCompositeOperation='source-in';
				ctx.beginPath();
				ctx.rect(0,0,map.w*ts,map.h*ts);
				ctx.fillStyle='rgb(200,150,100)';
				ctx.fill();
				oldc=0;
				var imgOutline=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	OUTLINE took 		'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				//create base heightmap by patching together random chunks of land (the transparency also makes this a mask for the coastline)
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.globalCompositeOperation='lighten';
				ctx.translate(ts/2,ts/2);
				for (var x=0;x<map.w;x++)
				{
					for (var y=0;y<map.h;y++)
					{
						if (x>=x1 && x<x2 && y>=y1 && y<y2)
						{
							var land=map.tiles[x][y].land;
							if (!land.ocean)
							{
								Math.seedrandom(map.seed+'-base-'+x+'/'+y);
								var s=1;
								//"pull" the center to other land tiles
								var sx=0;var sy=0;var neighbors=0;
								if (x==0 || !map.tiles[x-1][y].land.ocean) {sx-=1;neighbors++;}
								if (x==map.w-1 || !map.tiles[x+1][y].land.ocean) {sx+=1;neighbors++;}
								if (y==0 || !map.tiles[x][y-1].land.ocean) {sy-=1;neighbors++;}
								if (y==map.h-1 || !map.tiles[x][y+1].land.ocean) {sy+=1;neighbors++;}
								s*=0.6+0.1*(neighbors);
								if (neighbors==0) s*=0.65+Math.random()*0.35;//island
								sx+=Math.random()*2-1;
								sy+=Math.random()*2-1;
								var pullAmount=4;
								
								var px=choose([0,1]);var py=choose([0,1,2,3,4]);
								var r=Math.random()*Math.PI*2;
								
								ctx.translate(sx*pullAmount,sy*pullAmount);
								ctx.scale(s,s);
								ctx.rotate(r);
								ctx.drawImage(img,px*32+1,py*32+1,30,30,-ts,-ts,32,32);
								ctx.rotate(-r);
								ctx.scale(1/s,1/s);
								ctx.translate(-sx*pullAmount,-sy*pullAmount);
							}
						}
						ctx.translate(0,ts);
					}
					ctx.translate(ts,-map.h*ts);
				}
				var imgBase=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	HEIGHTMAP took 		'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				//create colors for sea and land
				var c=document.createElement('canvas');c.width=totalw*2;c.height=totalh*2;//sea
				var ctx=c.getContext('2d');
				for (var x=0;x<map.w;x++)
				{
					for (var y=0;y<map.h;y++)
					{
						if (x>=x1 && x<x2 && y>=y1 && y<y2)
						{
							var land=map.tiles[x][y].land;
							if (land.ocean)
							{
								Math.seedrandom(map.seed+'-seaColor-'+x+'/'+y);
								var px=land.image;var py=0;
								ctx.drawImage(img,px*32+Math.random()*30+1,py*32+Math.random()*30+1,1,1,x*2,y*2,1,1);
								ctx.drawImage(img,px*32+Math.random()*30+1,py*32+Math.random()*30+1,1,1,x*2+1,y*2,1,1);
								ctx.drawImage(img,px*32+Math.random()*30+1,py*32+Math.random()*30+1,1,1,x*2,y*2+1,1,1);
								ctx.drawImage(img,px*32+Math.random()*30+1,py*32+Math.random()*30+1,1,1,x*2+1,y*2+1,1,1);
							}
						}
					}
				}
				ctx.globalCompositeOperation='destination-over';//bleed
				ctx.drawImage(c,1,0);
				ctx.drawImage(c,-1,0);
				ctx.drawImage(c,0,-1);
				ctx.drawImage(c,0,1);
				ctx.globalCompositeOperation='source-over';//blur
				ctx.globalAlpha=0.25;
				ctx.drawImage(c,2,0);
				ctx.drawImage(c,-2,0);
				ctx.drawImage(c,0,-2);
				ctx.drawImage(c,0,2);
				var imgSea=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	MICROCOLORS took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				var c=document.createElement('canvas');c.width=totalw*2;c.height=totalh*2;//land
				var ctx=c.getContext('2d');
				for (var x=0;x<map.w;x++)
				{
					for (var y=0;y<map.h;y++)
					{
						if (x>=x1 && x<x2 && y>=y1 && y<y2)
						{
							var land=map.tiles[x][y].land;
							if (!land.ocean)
							{
								Math.seedrandom(map.seed+'-landColor-'+x+'/'+y);
								var px=land.image;var py=0;
								ctx.drawImage(img,px*32+Math.random()*30+1,py*32+Math.random()*30+1,1,1,x*2,y*2,1,1);
								ctx.drawImage(img,px*32+Math.random()*30+1,py*32+Math.random()*30+1,1,1,x*2+1,y*2,1,1);
								ctx.drawImage(img,px*32+Math.random()*30+1,py*32+Math.random()*30+1,1,1,x*2,y*2+1,1,1);
								ctx.drawImage(img,px*32+Math.random()*30+1,py*32+Math.random()*30+1,1,1,x*2+1,y*2+1,1,1);
							}
						}
					}
				}
				ctx.globalCompositeOperation='destination-over';//bleed
				ctx.drawImage(c,1,0);
				ctx.drawImage(c,-1,0);
				ctx.drawImage(c,0,-1);
				ctx.drawImage(c,0,1);
				var imgLand=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	LAND COLORS took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				
				//sea color
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.drawImage(imgSea,0,0,map.w*ts,map.h*ts);
				ctx.globalCompositeOperation='source-over';
				ctx.translate(ts/2,ts/2);
				for (var x=0;x<map.w;x++)
				{
					for (var y=0;y<map.h;y++)
					{
						if (x>=x1 && x<x2 && y>=y1 && y<y2)
						{
							var land=map.tiles[x][y].land;
							if (land.ocean)
							{
								Math.seedrandom(map.seed+'-detail-'+x+'/'+y);
								var px=land.image;var py=choose([2,4]);
								var r=Math.random()*Math.PI*2;
								var s=0.9+Math.random()*0.3;
								
								ctx.scale(s,s);
								ctx.rotate(r);
								ctx.drawImage(img,px*32+1,py*32+1,30,30,-ts,-ts,32,32);
								ctx.rotate(-r);
								ctx.scale(1/s,1/s);
							}
						}
						ctx.translate(0,ts);
					}
					ctx.translate(ts,-map.h*ts);
				}
				var imgSeaColor=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	SEA COLORS took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				if (seaFoam)
				{
					var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
					var ctx=c.getContext('2d');
					ctx.drawImage(imgBase,0,0);
					var size=4;
					ctx.globalAlpha=0.25;
					ctx.drawImage(c,-size,0);
					ctx.drawImage(c,size,0);
					ctx.drawImage(c,0,-size);
					ctx.drawImage(c,0,size);
					ctx.drawImage(c,-size,0);
					ctx.drawImage(c,size,0);
					ctx.drawImage(c,0,-size);
					ctx.drawImage(c,0,size);
					ctx.globalAlpha=1;
					ctx.globalCompositeOperation='destination-out';
					ctx.drawImage(imgBase,-1,0);
					ctx.drawImage(imgBase,1,0);
					ctx.drawImage(imgBase,0,-1);
					ctx.drawImage(imgBase,0,1);
					ctx.globalCompositeOperation='source-in';
					ctx.beginPath();
					ctx.rect(0,0,map.w*ts,map.h*ts);
					ctx.fillStyle='rgb(255,255,255)';
					ctx.fill();
					var imgEdges=c;
					if (breakdown) toDiv.appendChild(c);
					c=imgSeaColor;ctx=c.getContext('2d');
					ctx.setTransform(1,0,0,1,0,0);
					ctx.globalCompositeOperation='overlay';
					ctx.drawImage(imgEdges,0,0);
					ctx.drawImage(imgEdges,0,0);
					if (verbose) {console.log('	FOAM took 			'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				}
				
				//draw land shadow on the sea
				c=imgSeaColor;ctx=c.getContext('2d');
				ctx.globalCompositeOperation='destination-out';
				ctx.globalAlpha=0.5;
				ctx.drawImage(imgBase,2,2);
				ctx.drawImage(imgBase,4,4);
				ctx.globalCompositeOperation='destination-over';
				ctx.globalAlpha=1;
				ctx.beginPath();
				ctx.rect(0,0,map.w*ts,map.h*ts);
				ctx.fillStyle='rgb(0,0,0)';
				ctx.fill();
				if (verbose) {console.log('	SEA SHADOW took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				//sea heightmap
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				//fill with dark base
				ctx.beginPath();
				ctx.rect(0,0,map.w*ts,map.h*ts);
				ctx.fillStyle='rgb(64,64,64)';
				ctx.fill();
				ctx.globalCompositeOperation='overlay';
				ctx.translate(ts/2,ts/2);
				for (var x=0;x<map.w;x++)
				{
					for (var y=0;y<map.h;y++)
					{
						if (x>=x1 && x<x2 && y>=y1 && y<y2)
						{
							var land=map.tiles[x][y].land;
							if (land.ocean)
							{
								Math.seedrandom(map.seed+'-detail-'+x+'/'+y);
								var px=land.image;var py=choose([1,3]);
								var r=Math.random()*Math.PI*2;
								var s=0.9+Math.random()*0.3;
								
								ctx.scale(s,s);
								ctx.rotate(r);
								ctx.drawImage(img,px*32+1,py*32+1,30,30,-ts,-ts,32,32);
								ctx.rotate(-r);
								ctx.scale(1/s,1/s);
							}
						}
						ctx.translate(0,ts);
					}
					ctx.translate(ts,-map.h*ts);
				}
				var imgSeaHeight=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	SEA HEIGHTMAP took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.drawImage(imgBase,0,0,map.w*ts,map.h*ts);//draw the coastline
				ctx.globalCompositeOperation='source-in';
				ctx.drawImage(imgLand,0,0,map.w*ts,map.h*ts);//draw land colors within the coastline
				ctx.globalCompositeOperation='destination-over';
				ctx.drawImage(imgSeaColor,0,0,map.w*ts,map.h*ts);//draw sea colors behind the coastline
				if (verbose) {console.log('	COMPOSITING took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				//add color details for each tile
				ctx.globalCompositeOperation='source-over';
				ctx.translate(ts/2,ts/2);
				for (var x=0;x<map.w;x++)
				{
					for (var y=0;y<map.h;y++)
					{
						if (x>=x1 && x<x2 && y>=y1 && y<y2)
						{
							var land=map.tiles[x][y].land;
							if (!land.ocean)
							{
								Math.seedrandom(map.seed+'-detail-'+x+'/'+y);
								var s=1;
								//"pull"
								var sx=0;var sy=0;var neighbors=0;
								if (x==0 || !map.tiles[x-1][y].land.ocean) {sx-=1;neighbors++;}
								if (x==map.w-1 || !map.tiles[x+1][y].land.ocean) {sx+=1;neighbors++;}
								if (y==0 || !map.tiles[x][y-1].land.ocean) {sy-=1;neighbors++;}
								if (y==map.h-1 || !map.tiles[x][y+1].land.ocean) {sy+=1;neighbors++;}
								s*=0.6+0.1*(neighbors);
								if (neighbors==0) s*=0.65+Math.random()*0.35;//island
								sx+=Math.random()*2-1;
								sy+=Math.random()*2-1;
								var pullAmount=4;
								
								var px=land.image;var py=choose([2,4]);
								var r=Math.random()*Math.PI*2;
								
								ctx.translate(sx*pullAmount,sy*pullAmount);
								ctx.scale(s,s);
								ctx.rotate(r);
								ctx.drawImage(img,px*32+1,py*32+1,30,30,-ts,-ts,32,32);
								ctx.rotate(-r);
								ctx.scale(1/s,1/s);
								ctx.translate(-sx*pullAmount,-sy*pullAmount);
							}
						}
						ctx.translate(0,ts);
					}
					ctx.translate(ts,-map.h*ts);
				}
				var imgColor=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	COLOR DETAIL took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				//add heightmap details for each tile in overlay blending mode
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				//fill with dark base
				ctx.beginPath();
				ctx.rect(0,0,map.w*ts,map.h*ts);
				ctx.fillStyle='rgb(32,32,32)';
				ctx.fill();
				ctx.drawImage(imgSeaHeight,0,0,map.w*ts,map.h*ts);//draw the sea heightmap
				ctx.drawImage(imgBase,0,0,map.w*ts,map.h*ts);//draw the coastline
				ctx.globalCompositeOperation='overlay';
				ctx.translate(ts/2,ts/2);
				for (var x=0;x<map.w;x++)
				{
					for (var y=0;y<map.h;y++)
					{
						if (x>=x1 && x<x2 && y>=y1 && y<y2)
						{
							var land=map.tiles[x][y].land;
							if (!land.ocean)
							{
								Math.seedrandom(map.seed+'-detail-'+x+'/'+y);
								var s=1;
								//"pull"
								var sx=0;var sy=0;var neighbors=0;
								if (x==0 || !map.tiles[x-1][y].land.ocean) {sx-=1;neighbors++;}
								if (x==map.w-1 || !map.tiles[x+1][y].land.ocean) {sx+=1;neighbors++;}
								if (y==0 || !map.tiles[x][y-1].land.ocean) {sy-=1;neighbors++;}
								if (y==map.h-1 || !map.tiles[x][y+1].land.ocean) {sy+=1;neighbors++;}
								s*=0.6+0.1*(neighbors);
								if (neighbors==0) s*=0.65+Math.random()*0.35;//island
								sx+=Math.random()*2-1;
								sy+=Math.random()*2-1;
								var pullAmount=4;
								
								var px=land.image;var py=choose([1,3]);
								var r=Math.random()*Math.PI*2;
								
								ctx.translate(sx*pullAmount,sy*pullAmount);
								ctx.scale(s,s);
								ctx.rotate(r);
								ctx.drawImage(img,px*32+1,py*32+1,30,30,-ts,-ts,32,32);
								ctx.rotate(-r);
								ctx.scale(1/s,1/s);
								ctx.translate(-sx*pullAmount,-sy*pullAmount);
							}
						}
						ctx.translate(0,ts);
					}
					ctx.translate(ts,-map.h*ts);
				}
				var imgHeight=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	HEIGHT DETAIL took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				//embossing
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.drawImage(imgHeight,1,1);
				ctx.beginPath();
				ctx.rect(0,0,map.w*ts,map.h*ts);
				ctx.fillStyle='rgb(255,255,255)';
				ctx.globalCompositeOperation='difference';
				ctx.fill();//invert
				ctx.globalCompositeOperation='source-over';
				ctx.globalAlpha=0.5;
				ctx.drawImage(imgHeight,0,0);//create emboss
				ctx.globalCompositeOperation='hard-light';
				ctx.globalAlpha=1;
				ctx.drawImage(c,0,0);
				//ctx.drawImage(c,0,0);
				var imgEmboss1=c;
				if (breakdown) toDiv.appendChild(c);
				
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.drawImage(imgHeight,1,1);
				ctx.beginPath();
				ctx.rect(0,0,map.w*ts,map.h*ts);
				ctx.fillStyle='rgb(255,255,255)';
				ctx.globalCompositeOperation='difference';
				ctx.fill();//invert
				ctx.globalCompositeOperation='source-over';
				ctx.globalAlpha=0.5;
				ctx.drawImage(imgHeight,-1,-1);//create emboss
				ctx.globalCompositeOperation='hard-light';
				ctx.globalAlpha=1;
				//ctx.drawImage(c,0,0);
				var imgEmboss2=c;
				if (breakdown) toDiv.appendChild(c);
				
				//ambient occlusion (highpass)
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.drawImage(imgHeight,0,0);
				var size=2;
				ctx.globalAlpha=0.5;
				ctx.drawImage(c,-size,0);
				ctx.drawImage(c,size,0);
				ctx.drawImage(c,0,-size);
				ctx.drawImage(c,0,size);
				ctx.globalAlpha=1;
				ctx.beginPath();
				ctx.rect(0,0,map.w*ts,map.h*ts);
				ctx.fillStyle='rgb(255,255,255)';
				ctx.globalCompositeOperation='difference';
				ctx.fill();//invert
				ctx.globalCompositeOperation='source-over';
				ctx.globalAlpha=0.5;
				ctx.drawImage(imgHeight,0,0);
				ctx.globalCompositeOperation='overlay';
				ctx.drawImage(c,0,0);
				ctx.drawImage(c,0,0);
				var imgAO=c;
				if (breakdown) toDiv.appendChild(c);
				if (verbose) {console.log('	RELIEF took 		'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				//add emboss and color
				var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
				var ctx=c.getContext('2d');
				ctx.drawImage(imgEmboss1,0,0);
				ctx.globalCompositeOperation='overlay';
				ctx.drawImage(imgEmboss2,1,1);//combine both emboss passes
				/*ctx.globalAlpha=0.5;
				ctx.drawImage(imgHeight,0,0);
				ctx.globalAlpha=1;*/
				ctx.globalCompositeOperation='hard-light';
				ctx.drawImage(imgColor,0,0);//add color
				ctx.globalCompositeOperation='overlay';
				ctx.drawImage(imgAO,0,0);//add AO
				var imgFinal=c;
				if (verbose) {console.log('	COMPOSITING 2 took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				//blots (big spots of random color to give the map some unity)
				Math.seedrandom(map.seed+'-blots');
				ctx.globalCompositeOperation='soft-light';
				ctx.globalAlpha=0.25;
				for (var i=0;i<4;i++)
				{
					var x=Math.random()*map.w*ts;
					var y=Math.random()*map.h*ts;
					var s=Math.max(map.w,map.h)*ts;
					var grd=ctx.createRadialGradient(x,y,0,x,y,s/2);
					grd.addColorStop(0,'rgb('+Math.floor(Math.random()*255)+','+Math.floor(Math.random()*255)+','+Math.floor(Math.random()*255)+')');
					grd.addColorStop(1,'rgb(128,128,128)');
					ctx.fillStyle=grd;
					ctx.fillRect(x-s/2,y-s/2,s,s);
				}
				if (verbose) {console.log('	BLOTS took 			'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				if (colorShift)
				{
					//heck, why not. slight channel-shifting
					var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
					var ctx=c.getContext('2d');
					ctx.drawImage(imgFinal,0,0);
					ctx.globalCompositeOperation='multiply';
					ctx.beginPath();
					ctx.rect(0,0,map.w*ts,map.h*ts);
					ctx.fillStyle='rgb(255,0,0)';
					ctx.fill();
					var imgRed=c;
					var c=document.createElement('canvas');c.width=totalw*ts;c.height=totalh*ts;
					var ctx=c.getContext('2d');
					ctx.drawImage(imgFinal,0,0);
					ctx.globalCompositeOperation='multiply';
					ctx.beginPath();
					ctx.rect(0,0,map.w*ts,map.h*ts);
					ctx.fillStyle='rgb(0,255,255)';
					ctx.fill();
					var imgCyan=c;
					//if (breakdown) toDiv.appendChild(c);
					if (verbose) {console.log('	COLORSHIFT took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				}
				
				c=imgFinal;ctx=c.getContext('2d');
				if (colorShift)
				{
					ctx.globalCompositeOperation='lighten';
					ctx.globalAlpha=0.5;
					ctx.drawImage(imgRed,-1,-1);
					ctx.drawImage(imgCyan,1,1);
				}
				ctx.globalAlpha=1;
				ctx.globalCompositeOperation='soft-light';
				ctx.beginPath();
				ctx.rect(0,0,map.w*ts,map.h*ts);
				ctx.fillStyle='rgb(160,128,96)';
				ctx.fill();//some slight sepia to finish it up
				
				ctx.globalCompositeOperation='destination-in';
				ctx.drawImage(imgFog,0,0);//fog
				ctx.globalCompositeOperation='source-over';
				ctx.drawImage(imgOutline,0,0);//outline
				
				ctx.globalCompositeOperation='source-over';
				ctx.globalAlpha=1;
				
				if (breakdown) toDiv.appendChild(c);
				else
				{
					//flush
					var imgBase=0;
					var imgFog=0;
					var imgOutline=0;
					var imgSea=0;
					var imgLand=0;
					var imgSeaColor=0;
					var imgColor=0;
					var imgEdges=0;
					var imgSeaHeight=0;
					var imgHeight=0;
					var imgEmboss1=0;
					var imgEmboss2=0;
					var imgAO=0;
					var imgFinal=0;
					var imgRed=0;
					var imgCyan=0;
				}
				Math.seedrandom();
				if (verbose) {console.log('	FINAL STEPS took 	'+(Date.now()-timeStep)+'ms');timeStep=Date.now();}
				
				if (verbose) console.log('Rendering map took '+(Date.now()-time)+'ms.');
				return c;
			}
		}
	{
}
