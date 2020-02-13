class Screen {
	constructor(){
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
		this.scene = new THREE.Scene();
		this.objmap=new Map();
		this.halt=false;
	}
	animate() {
		if (this.halt) return;
		requestAnimationFrame( animate );
		render();
	}
	setcamera(x,y,z){
		camera.position.x = x;
		camera.position.y = y;
		camera.position.z = z;
		/*camera.lookAt( scene.position );
		camera.updateMatrixWorld();*/
		render();
	}
	rotate(th,ax){
		let sinth=Math.sin(th);
		let costh=Math.cos(th);
		let v=[camera.position.x,camera.position.y,camera.position.z];
		let m;
		if (ax==0){
			m=[[1,0,0],[0,costh,-sinth],[0,sinth,costh]];
		} else if (ax==1){
			m=[[costh,0,sinth],[0,1,0],[-sinth,0,costh]];
		} else {
			m=[[costh,-sinth,0],[sinth,costh,0],[0,0,1]];
		}
		let nv=matmul(m,v);
		camera.position.x=nv[0];
		camera.position.y=nv[1];
		camera.position.z=nv[2];
		render();
	}
	zoom(frac){
		let fac=1-frac;
		if (fac<=0) return;
		camera.position.x*=fac;
		camera.position.y*=fac;
		camera.position.z*=fac;
		render();
	}
	setcolor(loc,col){
		objmap.get(String(loc)).material.color.setHex(col);
		render();
	}
	render() {
		camera.lookAt( scene.position );
		camera.updateMatrixWorld();
		// find intersections
		/*raycaster.setFromCamera( mouse, camera );
		var intersects = raycaster.intersectObjects( scene.children );
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
		renderer.render( scene, camera );
	}
}
