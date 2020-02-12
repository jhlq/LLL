class Sphere {
	constructor(loc,col) {
		this.loc = loc || [0,0,0]; //[q,r,l]
		this.col=col || 0xffffff;
	}

	hex() {
		return [this.loc[0],-this.loc[0]-this.loc[1],this.loc[1]];
	}
	xyz() {
		let x=this.loc[0]+this.loc[1]/2+this.loc[2]/2;
		let h=Math.sqrt(3)/2;
		let y=this.loc[1]*h+this.loc[2]*h/2;
		let g=h/3;//(1/4-h**2)/-2*h;
		let z=this.loc[2]*Math.sqrt(h**2-g**2);
		//let h=Math.sqrt(3)/2;let y=0.5;let g=(1/4-h**2)/-2*h;g=h/3;let hp=Math.sqrt(h**2-g**2);
		return [x,y,z];
	}
};

class Spheres {
	constructor(d) {
		this.map=new Map();
		this.map.set([0,0,0],new Sphere([0,0,0]));
		this.d=d||1;
	}
	add(loc,col){
		this.map.set(loc,new Sphere(loc,col));
	}
};
function gridlines(n){
	let sphs=new Spheres
	for (let i=0;i<n;i++){
		sphs.add([i+1,0,0],0xff0000);
		sphs.add([0,i+1,0],0x00ff00);
		sphs.add([0,0,i+1],0x0000ff);
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
}
