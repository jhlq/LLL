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
		let y=this.loc[1]*h-this.loc[2]*h/3;
		let hz=Math.sqrt(6)/3;
		let z=this.loc[2]*hz;
		return [x,y,z];
	}
};

class Spheres {
	constructor(d) {
		this.map=new Map();
		//this.map.set(String([0,0,0]),new Sphere([0,0,0]));
		this.d=d||1;
		this.connections=[[1,0,0],[0,0,-1],[0,1,0],[0,1,1],[-1,1,0],[-1,0,-1],[-1,0,0],[0,0,1],[0,-1,0],[0,-1,-1],[1,-1,0],[1,0,1]];
	}
	has(loc){
		return this.map.has(String(loc));
	}
	get(loc){
		return this.map.get(String(loc));
	}
	vox(loc) {
		let x=loc[0]+loc[1]/2-loc[2]/2;
		let h=Math.sqrt(3)/2;
		let y=loc[1]*h-loc[2]*h/3;
		let hz=Math.sqrt(6)/3;
		let z=loc[2]*hz;
		return [x*this.d,y*this.d,z*this.d];
	}
	add(loc,col){
		let sp=0;
		if (loc.loc!=undefined){
			sp=loc;
		} else {
			sp=new Sphere(loc,col);
		}
		if (this.map.has(String(sp.loc))) return false;
		this.map.set(String(sp.loc),sp);
		return true;
	}
	rm(loc){
		return this.map.delete(String(loc));
	}
	dirind(dir){
		for (let i=0;i<this.connections.length;i++){
			if (String(dir)==String(this.connections[i])){
				return i;
			}
		}
		return 0
	}
	next(dir){
		return this.connections[(this.dirind(dir)+1)%this.connections.length];
	}
	adjacent(loc){
		let adj=[];
		for (let con of this.connections){
			adj.push([loc[0]+con[0],loc[1]+con[1],loc[2]+con[2]]);
		}
		return adj;
	}
	adjacentSpheres(loc){
		let adjs=[];
		let adj=this.adjacent(loc);
		for (let ad of adj){
			if (this.has(ad)){
				adjs.push(ad);
			}
		}
		return adjs;
	}
	isadjacent(loc){
		if (this.has(loc)) return false;
		let adj=this.adjacent(loc);
		for (let ad of adj){
			if (this.has(ad)){
				return true;
			}
		}
		return false;
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
	addshells(n,col){
		if (this.map.size==0) this.add([0,0,0]);
		for (let i=0;i<n;i++){
			this.addshell(col);
		}
	}
	addgridlines(n){
		for (let i=0;i<n;i++){
			this.add([i+1,0,0],0xff0000);
			this.add([0,i+1,0],0x00ff00);
			this.add([0,0,i+1],0x0000ff);
			this.add([-(i+1),0,0],0x6f0000);
			this.add([0,-(i+1),0],0x006f00);
			this.add([0,0,-(i+1)],0x00006f);
		}
	}
};
class Ångbot{
	constructor(spheres,loc){
		this.spheres=spheres;
		this.loc=loc;
		this.dir=[1,0,0];
	}
	rot(i){
		if (!i){
			this.dir=this.spheres.next(this.dir);
		} else {
			let cl=this.spheres.connections.length;
			let diri=(this.spheres.dirind(this.dir)+i)%cl
			if (diri<0) diri=cl+diri;
			this.dir=this.spheres.connections[diri];
		}
	}
	turn(right){
		let r=1;
		if (right) r=-1;
		this.rot(r);
		let l=vecplus(this.loc,this.dir);
		if (this.spheres.isadjacent(l)) return true;
		for (let i=1;i<this.spheres.connections.length;i++){
			this.rot(r);
			l=vecplus(this.loc,this.dir);
			if (this.spheres.isadjacent(l)) return true;
		}
		return false
	}
	move(dir){
		if (dir<0){
			this.dir=[-this.dir[0],-this.dir[1],-this.dir[2]];
			let moved=this.move();
			this.dir=[-this.dir[0],-this.dir[1],-this.dir[2]];
			return moved;
		}
		if (!dir){
			if (this.move(this.dir)) return true;
			for (let i=1;i<this.spheres.connections.length;i++){
				this.rot();
				if (this.move(this.dir)) return true;
			}
			return false
		}
		if (typeof(dir)=="number") dir=this.spheres.connections[dir];
		let nc=[this.loc[0]+dir[0],this.loc[1]+dir[1],this.loc[2]+dir[2]];
		if (this.spheres.has(this.loc)){
			console.log("Ångbot is stuck inside a sphere, attempting to teleport out.");
			for (let i=0;i<1000;i++){
				if (!this.spheres.has(nc)){
					this.loc=nc;
					return true;
				}
				nc[0]+=dir[0];nc[1]+=dir[1];nc[2]+=dir[2];
			}
		} else {
			if (this.spheres.isadjacent(nc)){
				this.loc=nc;
				return true;
			}
		}
		return false;
	}
	ops(){
		let move=[];
		let dig=[];
		for (let dir of this.spheres.connections){
			let nc=[this.loc[0]+dir[0],this.loc[1]+dir[1],this.loc[2]+dir[2]];
			if (this.spheres.has(nc)){
				dig.push(nc);
			} else if (this.spheres.isadjacent(nc)){
				move.push(nc);
			}
		}
		return [move,dig];
	}
	excavate(){
		let l=vecplus(this.loc,this.dir);
		if (this.spheres.has(l)){
			this.spheres.rm(l);
			return l;
		}
		for (let i=1;i<this.spheres.connections.length;i++){
			this.rot();
			l=vecplus(this.loc,this.dir);
			if (this.spheres.has(l)){
				this.spheres.rm(l);
				return l;
			}
		}
		return false
	}
	place(){
		let l=vecplus(this.loc,this.dir);
		if (!this.spheres.has(l)){
			this.spheres.add(l);
			return l;
		}
		for (let i=1;i<this.spheres.connections.length;i++){
			this.rot();
			l=vecplus(this.loc,this.dir);
			if (!this.spheres.has(l)){
				this.spheres.add(l);
				return l;
			}
		}
		return false
	}
		
};
function matmul(m,v){
	let nv=[];
	for (let row=0;row<m.length;row++){
		let rc=0;
		for (let col=0;col<v.length;col++){
			rc+=m[row][col]*v[col]
		}
		nv.push(rc);
	}
	return nv;
};
function vecplus(v,v2){
	let nv=[];
	let n=v2;
	for (let row=0;row<v.length;row++){
		if (v2.length!=undefined) n=v2[row];
		nv.push(v[row]+n);
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
