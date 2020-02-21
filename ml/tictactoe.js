class Board{
	constructor(h){
		this.m=[[0,0,0],[0,0,0],[0,0,0]];
		this.p=0;
		this.h=[];
		if (h){
			for (let m of h){
				this.place(m);
			}
		}
	}
	place(x,y){
		if (typeof(y)=='undefined'){
			y=x%3;
			x=Math.floor(x/3);
		}
		if (this.fin || this.m[x][y]!=0) return false;
		let cp=this.p+1;
		this.m[x][y]=cp;
		if ((this.m[x][0]==cp && this.m[x][1]==cp && this.m[x][2]==cp) || 
			(this.m[0][y]==cp && this.m[1][y]==cp && this.m[2][y]==cp) || 
			(this.m[1][1]==cp && ((this.m[0][0]==cp && this.m[2][2]==cp) || (this.m[0][2]==cp && this.m[2][0]==cp)))){
			this.winner=cp;
			this.fin=true;
		}
		this.p=cp%2;
		this.h.push(x*3+y);
		if (this.h.length>8) this.fin=true;
		return true;
	}
	print(){
		let syms=[' ','O','X'];
		console.log("\n"+syms[this.m[0][0]]+"|"+syms[this.m[0][1]]+"|"+syms[this.m[0][2]]);
		//console.log("_____");
		console.log(syms[this.m[1][0]]+"|"+syms[this.m[1][1]]+"|"+syms[this.m[1][2]]);
		//console.log("_____");
		console.log(syms[this.m[2][0]]+"|"+syms[this.m[2][1]]+"|"+syms[this.m[2][2]]);
		console.log("O: 1, X: 2, Winner: "+this.winner);
	}
	copy(){
		let nb=new Board;
		nb.m=JSON.parse(JSON.stringify(this.m));
		nb.p=this.p;
		nb.h=JSON.parse(JSON.stringify(this.h));
		return nb;
	}
}
class AI{
	constructor(b){
		this.b=b||new Board();
		this.explore=true;
		this.usemodel=true;
		this.model=this.createModel();
	}
	vectorize(b){
		b=b||this.b;
		let v=[];
		for (let i=0;i<3;i++){
			for (let j=0;j<3;j++){
				let temp=[0,0];
				let temp2=b.m[i][j];
				if (temp2>0) temp[temp2-1]=1;
				v.push(temp[0]);v.push(temp[1]);
			}
		}
		return v;
	}
	createModel() {
		const model = tf.sequential(); 
		let bv=this.vectorize(this.b);
		model.add(tf.layers.dense({inputShape: [bv.length], units: 10, useBias: true}));
		model.add(tf.layers.dense({units: 500, activation: 'sigmoid', useBias: true}));
		model.add(tf.layers.dense({units: 1, activation: 'sigmoid', useBias: true}));
		return model;
	}
	runModel(bv){
		bv=bv||this.vectorize(this.b);
		if (bv.m) bv=this.vectorize(bv);
		let bvt=tf.tensor2d(bv, [1, bv.length]);
		return this.model.predict(bvt).dataSync()[0];
	}
	async trainModel(inputs, labels) {
		inputs=tf.tensor2d(inputs, [inputs.length, inputs[0].length]);
		labels=tf.tensor2d(labels, [labels.length, 1]);
		this.model.compile({
			optimizer: tf.train.adam(),
			loss: tf.losses.meanSquaredError,
			metrics: ['mse'],
		});
		
		const batchSize = 32;
		const epochs = 50;
		
		return await this.model.fit(inputs, labels, {
			batchSize,
			epochs,
			shuffle: true,
			callbacks: tfvis.show.fitCallbacks(
				{ name: 'Training Performance' },
				['loss', 'mse'], 
				{ height: 200, callbacks: ['onEpochEnd'] }
			)
		});
	}
	evaluate(move,y){
		if (y) move+=y;
		let bc=this.b.copy();
		let placed=bc.place(move);
		if (!placed) return 0;
		if (bc.winner==this.b.p+1) return 1;
		if (!this.usemodel) return 0.5;
		let ev=this.runModel(bc);
		if (this.b.p==1) ev=1-ev;
		return ev;
	}
	evaluations(){
		let ev=[];
		for (let m=0;m<9;m++){
			ev.push(this.evaluate(m));
		}
		return ev;
	}
	select(mps){
		if (this.explore){
			let sum=mps.reduce((t,p)=>t+=p);
			let r=sum*Math.random();
			let rs=0;
			for (let mi=0;mi<mps.length;mi++){
				rs+=mps[mi];
				if (rs>r) return mi;
			}
		} else {
			let m=Math.max(...mps);
			for (let mi=0;mi<mps.length;mi++){
				if (mps[mi]==m) return mi;
			}
		}
	}
	place(n){
		if (!n) n=1;
		for (let ni=0;ni<n;ni++){
			this.b.place(this.select(this.evaluations()));
			if (this.b.fin) break;
		}
	}
	play(n){
		if (!n) n=1;
		let r=[];
		for (let ni=0;ni<n;ni++){
			let ai=new AI(this.b.copy());
			ai.place(9);
			let t=ai.b.winner?(ai.b.winner-1):0.5;
			r.push([ai.b.h,t]);
		}
		return r;
	}
	makedata(r){
		let inp=[];
		let lab=[];
		for (let ra of r){
			let h=ra[0];
			let hn=h.length;
			let target=ra[1];
			for (let hi=0;hi<hn;hi++){
				let tb=new Board(h);
				inp.push(this.vectorize(tb));
				lab.push(target);
				h.pop();
			}
		}
		return [inp,lab];
	}
}
function time(){
	let ai=new AI();
	let d=new Date();
	let s=d.getTime();
	ai.play(100);
	d=new Date();
	console.log(d.getTime()-s);
	ai.usemodel=false;
	d=new Date();
	s=d.getTime();
	ai.play(100);
	d=new Date();
	console.log(d.getTime()-s);
};
//ai=new AI;ai.trainModel(...ai.makedata(ai.play(10)))
