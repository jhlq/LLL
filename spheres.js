class Sphere {
	constructor(loc,col) {
		this.loc = loc || [0,0,0]; //[q,r,l]
		this.col=col || 0xffffff;
	}

	hex() {
		return [this.loc[0],-this.loc[0]-this.loc[1],this.loc[1]];
	}
	xyz() {
		let x=this.loc[0]+this.loc[1]/2-this.loc[2]/2;
		let h=Math.sqrt(3)/2;
		let y=this.loc[1]*h-this.loc[2]*h/2;
		let g=h/3;//(1/4-h**2)/-2*h;
		let z=this.loc[2]*Math.sqrt(h**2-g**2);
		//let h=Math.sqrt(3)/2;let y=0.5;let g=(1/4-h**2)/-2*h;g=h/3;let hp=Math.sqrt(h**2-g**2);
		return [x,y,z];
	}
};

class Spheres {
	constructor(d) {
		this.map=new Map();
		this.map.set(String([0,0,0]),new Sphere([0,0,0]));
		this.d=d||1;
		this.connections=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[1,-1,0],[-1,1,0], [0,0,1],[1,0,1],[0,1,1],[0,0,-1],[-1,0,-1],[0,-1,-1]];
	}
	has(loc){
		return this.map.has(String(loc));
	}
	add(loc,col){
		if (this.map.has(String(loc))) return false;
		this.map.set(String(loc),new Sphere(loc,col));
		return true;
	}
	rm(loc){
		return this.map.delete(String(loc));
	}
	adjacent(loc){
		let adj=[];
		for (let con of this.connections){
			adj.push([loc[0]+con[0],loc[1]+con[1],loc[2]+con[2]]);
		}
		return adj;
	}
	adjacentSpace(loc){
		if (loc){
			let adjs=[];
			let adj=this.adjacent(loc);
			for (let ad of adj){
				if (!this.has(ad)){
					adjs.push(ad);
				}
			}
			return adjs;
		} else {
			let tadjs=[];
			let tadjstr=[];
			for (let sp of this.map.values()){
				let adjs=this.adjacentSpace(sp.loc);
				for (let ad of adjs){
					if (!tadjstr.includes(String(ad))){
						tadjstr.push(String(ad));
						tadjs.push(ad);
					}
				}
			}
			return tadjs;
		}
	}
	addshell(col){
		let adjs=this.adjacentSpace();
		for (let loc of adjs){
			this.map.set(String(loc),new Sphere(loc,col));
		}
	}
};
function gridlines(n){
	let sphs=new Spheres
	for (let i=0;i<n;i++){
		sphs.add([i+1,0,0],0xff0000);
		sphs.add([0,i+1,0],0x00ff00);
		sphs.add([0,0,i+1],0x0000ff);
		sphs.add([-(i+1),0,0],0x6f0000);
		sphs.add([0,-(i+1),0],0x006f00);
		sphs.add([0,0,-(i+1)],0x00006f);
	}
	return sphs;
};
function matmul(m,v){
	nv=[];
	for (let row=0;row<m.length;row++){
		let rc=0;
		for (let col=0;col<v.length;col++){
			rc+=m[row][col]*v[col]
		}
		nv.push(rc);
	}
	return nv;
};

function test(){
	let sp=new Sphere([0,0,0]);
	sp.hex()==[0,0,0];
	sp.xyz()==[0,0,0];
	sp=new Sphere([0,0,1]);
	let z=sp.xyz()[2];
	z>0 && z<1;
	let sphs=gridlines(9);
	sphs.map.size()==9*3+1;
	sphs.rm([3,3,3])==false;
	sphs.add([3,3,3]);
	sphs.rm([3,3,3])==true;
	sphs=new Spheres();
	let adj=sphs.adjacent([0,0,0]);
	adj.length==12;
	sphs.add([1,0,0]);
	adj=sphs.adjacentSpace([0,0,0]);
	adj.length==11;
	adj=sphs.adjacentSpheres([0,0,0]);
	adj.length==1;
}
