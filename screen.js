class Screen {
	constructor(){
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer();
		this.objmap=new Map();
		this.halt=false;
		this.d=1;
		this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
	}
	animate() {
		if (screen.halt) return;
		requestAnimationFrame( screen.animate );
		screen.render();
	}
	setcamera(x,y,z){
		this.camera.position.x = x;
		this.camera.position.y = y;
		this.camera.position.z = z;
		/*this.camera.lookAt( scene.position );
		this.camera.updateMatrixWorld();*/
		this.render();
	}
	rotate(th,ax){
		let sinth=Math.sin(th);
		let costh=Math.cos(th);
		let v=[this.camera.position.x,this.camera.position.y,this.camera.position.z];
		let m;
		if (ax==0){
			m=[[1,0,0],[0,costh,-sinth],[0,sinth,costh]];
		} else if (ax==1){
			m=[[costh,0,sinth],[0,1,0],[-sinth,0,costh]];
		} else {
			m=[[costh,-sinth,0],[sinth,costh,0],[0,0,1]];
		}
		let nv=matmul(m,v);
		this.camera.position.x=nv[0];
		this.camera.position.y=nv[1];
		this.camera.position.z=nv[2];
		this.render();
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
	render() {
		this.camera.lookAt( this.scene.position );
		this.camera.updateMatrixWorld();
		// find intersections. Requires offset calculations.
		/*raycaster.setFromCamera( mouse, this.camera );
		var intersects = raycaster.intersectObjects( this.scene.children );
		if ( intersects.length > 0 ) {
			if ( INTERSECTED != intersects[ 0 ].object ) {
				if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
				INTERSECTED = intersects[ 0 ].object;
				INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
				INTERSECTED.material.emissive.setHex( 0xff0000 );
			}
		} else {
			if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
			INTERSECTED = null;
		}*/
		this.renderer.render( this.scene, this.camera );
	}
}
