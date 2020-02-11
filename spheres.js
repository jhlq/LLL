class Sphere {
	constructor(loc) {
		this.loc = loc;
	}

	hex() {
		return [this.loc[0],-this.loc[0]-this.loc[1],this.loc[1]];
	}
};

class Spheres {
	constructor() {
		this.map=new Map();
		this.map.set([0,0,0],new Sphere([0,0,0]));
	}
};
