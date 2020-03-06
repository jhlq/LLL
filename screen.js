class CanvasScreen {
	constructor(d){
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
		this.scene = new THREE.Scene();
		this.scene.matrixAutoUpdate = false;
		this.renderer = new THREE.WebGLRenderer();
		this.d=d||1;
		this.spgeometry = new THREE.SphereBufferGeometry( this.d/2, 8, 8 );
		this.objmap=new Map();
		this.spheres=new Spheres();
		this.spheres.d=this.d;
		this.halt=false;
		this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
		this.cursor=[0,0,0];
		this.marked=[];
		//let cursorobject = new THREE.Mesh( new THREE.BoxBufferGeometry( this.d/5,this.d/5,this.d/5 ), new THREE.MeshLambertMaterial( { color: 1 } ) );
		//this.scene.add( cursorobject );
		//this.objmap.set("cursor",cursorobject);
		this.bots=[];
		this.lookAt=new THREE.Vector3(0,0,0);
		this.follow=-1;
		this.camdis=5;
		this.rots=[0,0,0];
	}
	addspheres(spheres){
		for (let sp of spheres.map.values()){
			if (this.spheres.add(sp)){
				let object = new THREE.Mesh( this.spgeometry, new THREE.MeshLambertMaterial( { color: sp.col } ) );
				let xyz=sp.xyz();
				object.position.x = xyz[0]*this.d;
				object.position.y = xyz[1]*this.d;
				object.position.z = xyz[2]*this.d;
				this.scene.add( object );
				this.objmap.set(String(sp.loc),object);
			}
		}
		this.render();
	}
	addsphere(sp){
		if (this.spheres.add(sp)){
			let object = new THREE.Mesh( this.spgeometry, new THREE.MeshLambertMaterial( { color: sp.col } ) );
			let xyz=sp.xyz();
			object.position.x = xyz[0]*this.d;
			object.position.y = xyz[1]*this.d;
			object.position.z = xyz[2]*this.d;
			this.scene.add( object );
			this.objmap.set(String(sp.loc),object);
			this.render();
		}
	}
	renderloc(loc){
		let sp=this.spheres.get(loc);
		if (sp){
			let object = new THREE.Mesh( this.spgeometry, new THREE.MeshLambertMaterial( { color: sp.col } ) );
			let xyz=sp.xyz();
			object.position.x = xyz[0]*this.d;
			object.position.y = xyz[1]*this.d;
			object.position.z = xyz[2]*this.d;
			this.scene.add( object );
			this.objmap.set(String(sp.loc),object);
			this.render();
		}
	}
	addbot(){
		let åb=new Ångbot(this.spheres,this.cursor);
		this.bots.push(åb);
		let botobject = new THREE.Mesh( new THREE.BoxBufferGeometry( this.d/3,this.d/3,this.d/3 ), new THREE.MeshLambertMaterial( { color: 0x5000aa } ) );
		let botdir=new THREE.ArrowHelper( new THREE.Vector3(1,0,0), new THREE.Vector3(), this.d,0xffff00,this.d/1.5);
		this.scene.add(botobject);
		this.scene.add(botdir);
		this.objmap.set("bot",botobject);
		this.objmap.set("botdir",botdir);
		this.updatebot();
	}
	updatebot(){
		let åb=this.bots[0];
		let l=this.spheres.vox(åb.loc);
		let bo=this.objmap.get("bot");
		bo.position.x=l[0];
		bo.position.y=l[1];
		bo.position.z=l[2];
		let di=this.spheres.vox(åb.dir);
		let bdi=this.objmap.get("botdir");
		bdi.position.x=l[0];
		bdi.position.y=l[1];
		bdi.position.z=l[2];
		bdi.setDirection(new THREE.Vector3(di[0],di[1],di[2]));
		this.updatecamera();
		this.render();
	}
	turn(i){
		this.bots[0].turn(i);
		this.updatebot();
	}
	move(dir){
		this.bots[0].move(dir);
		this.updatebot();
	}
	dig(){
		let sp=this.bots[0].excavate();
		if (sp){
			this.rm(sp);
		}
		this.updatebot();
	}
	place(){
		let loc=this.bots[0].place();
		if (loc){
			this.renderloc(loc);
		}
		this.updatebot();
	}
	rm(loc){
		loc=loc.loc||loc;
		this.scene.remove(this.objmap.get(String(loc)));
		this.objmap.delete(String(loc));
		this.spheres.rm(loc);
		let wl=this.spheres.wrap(loc);
		if (this.spheres.has(wl) && (wl[0]!=loc[0] || wl[1]!=loc[1] || wl[2]!=loc[2])) this.rm(wl);
	}
	mark(loc,col){
		this.setemissive(loc,col||0xff);
		this.marked.push(loc);
	}
	unmark(){
		for (let loc of this.marked){
			this.setemissive(loc,0);
		}
		this.marked=[];
	}
	cursormark(){
		this.unmark();
		for (let ad of this.spheres.adjacentSpheres(this.cursor)){
			this.mark(ad);
		}
		let xyz=this.spheres.vox(this.cursor);
		this.objmap.get("cursor").position.x=xyz[0];this.objmap.get("cursor").position.y=xyz[1];this.objmap.get("cursor").position.z=xyz[2];
	}
	movecursor(dir){
		if (typeof(dir)=="number") dir=this.spheres.connections[dir];
		let nc=[this.cursor[0]+dir[0],this.cursor[1]+dir[1],this.cursor[2]+dir[2]];
		if (this.spheres.has(this.cursor)){
			for (let i=0;i<1000;i++){
				if (!this.spheres.has(nc)){
					this.cursor=nc;
					//this.cursormark();
					return true;
				}
				nc[0]+=dir[0];nc[1]+=dir[1];nc[2]+=dir[2];
			}
		} else {
			if (this.spheres.isadjacent(nc)){
				this.cursor=nc;
				//this.cursormark();
				return true;
			}
		}
		return false;
	}
	cursorops(){
		let move=[];
		let dig=[];
		for (let dir of this.spheres.connections){
			let nc=[this.cursor[0]+dir[0],this.cursor[1]+dir[1],this.cursor[2]+dir[2]];
			if (this.spheres.has(nc)){
				dig.push(nc);
			} else if (this.spheres.isadjacent(nc)){
				move.push(nc);
			}
		}
		return [move,dig];
	}
	excavate(){
		this.rm(this.cursorops()[1][0]);
	}
	animate() {
		if (this.halt) return;
		requestAnimationFrame( this.animate.bind(this) );
		this.render();
	}
	setcamera(x,y,z){
		this.camera.position.x = x;
		this.camera.position.y = y;
		this.camera.position.z = z;
		this.render();
	}
	rotate(th,ax,p){
		p=p||[this.lookAt.x,this.lookAt.y,this.lookAt.z];
		let sinth=Math.sin(th);
		let costh=Math.cos(th);
		let v=[this.camera.position.x-p[0],this.camera.position.y-p[1],this.camera.position.z-p[2]];
		let m;
		if (ax==0){
			m=[[1,0,0],[0,costh,-sinth],[0,sinth,costh]];
		} else if (ax==1){
			m=[[costh,0,sinth],[0,1,0],[-sinth,0,costh]];
		} else {
			m=[[costh,-sinth,0],[sinth,costh,0],[0,0,1]];
		}
		let nv=matmul(m,v);
		this.camera.position.x=nv[0]+p[0];
		this.camera.position.y=nv[1]+p[1];
		this.camera.position.z=nv[2]+p[2];
		//this.camera.lookAt( this.lookAt );
		//this.render();
	}
	zoom(frac){
		let fac=1-frac;
		if (fac<=0) return;
		this.camera.position.x*=fac;
		this.camera.position.y*=fac;
		this.camera.position.z*=fac;
		this.render();
	}
	setcolor(loc,col){
		this.objmap.get(String(loc)).material.color.setHex(col);
		this.render();
	}
	setemissive(loc,col){
		this.objmap.get(String(loc)).material.emissive.setHex(col);
		this.render();
	}
	updatecamera() {
		if (this.follow>=0){
			//let lookat=this.spheres.vox(vecplus(this.bots[this.follow].loc,this.bots[this.follow].dir));
			let lookat=this.spheres.vox(this.bots[this.follow].loc);
			this.lookAt.x=lookat[0];
			this.lookAt.y=lookat[1];
			this.lookAt.z=lookat[2];
			let botloc=this.spheres.vox(this.bots[this.follow].loc);
			this.setcamera(botloc[0],botloc[1],botloc[2]+this.camdis);
			this.rotate(this.rots[0],0);
			this.rotate(this.rots[1],1);
			this.rotate(this.rots[2],2);
		}
		this.camera.lookAt( this.lookAt );
		this.camera.updateMatrixWorld();
		this.render();
	}
	render() {
		this.renderer.render( this.scene, this.camera );
	}
}
