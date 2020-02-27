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
		console.log(syms[this.m[1][0]]+"|"+syms[this.m[1][1]]+"|"+syms[this.m[1][2]]);
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
		this.explore=0.1;
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
	rotate(b){
		b=b||this.b;
		let rb=new Board();
		rb.m[0]=[b.m[0][2],b.m[1][2],b.m[2][2]];
		rb.m[1]=[b.m[0][1],b.m[1][1],b.m[2][1]];
		rb.m[2]=[b.m[0][0],b.m[1][0],b.m[2][0]];
		return rb;
	}
	createModel() {
		const model = tf.sequential(); 
		let bv=this.vectorize(this.b);
		model.add(tf.layers.dense({inputShape: [bv.length], units: 50, useBias: true}));
		model.add(tf.layers.dense({units: 500, activation: 'sigmoid', useBias: true}));
		model.add(tf.layers.dense({units: 50, activation: 'sigmoid', useBias: true}));
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
		const epochs = 100;
		
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
		if (typeof(move)=="undefined") return this.runModel();
		if (y) move=move*3+y;
		let bc=this.b.copy();
		let placed=bc.place(move);
		if (!placed) return 0;
		if (bc.winner==this.b.p+1) return 1;
		if (!this.usemodel) return 0.5;
		let ev=this.runModel(bc);
		if (this.b.p==0) ev=1-ev;
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
		let m=Math.max(...mps);
		if (this.explore){
			for (let mi=0;mi<mps.length;mi++){
				if (mps[mi]<m-this.explore) mps[mi]=0;
			}
			let sum=mps.reduce((t,p)=>t+=p);
			let r=sum*Math.random();
			let rs=0;
			for (let mi=0;mi<mps.length;mi++){
				rs+=mps[mi];
				if (rs>r) return mi;
			}
		} else {
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
		let ob=this.b;
		for (let ni=0;ni<n;ni++){
			this.b=ob.copy();
			this.place(9);
			let t=this.b.winner?(this.b.winner-1):0.5;
			r.push([this.b.h,t]);
		}
		this.b=ob;
		return r;
	}
	avg(r){
		let lr=r.length;
		let sum=0;
		for (let i=0;i<lr;i++){
			sum+=r[i][1];
		}
		return sum/lr;
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
	makeavgdata(its,depth,plays){
		depth=depth||9;
		plays=plays||10;
		its=its||1;
		let inp=[];
		let lab=[];
		let ob=this.b;
		for (let it=0;it<its;it++){
			this.b=ob.copy();
			for (let dep=0;dep<depth;dep++){
				this.place();
				if (this.b.fin){
					break;
				}
				let av=this.avg(this.play(plays));
				inp.push(this.vectorize());
				lab.push(av);
				console.log(av);
				let tb=this.b;
				for (let rot=0;rot<3;rot++){
					tb=this.rotate(tb);
					inp.push(this.vectorize(tb));
					lab.push(av);
				}
			}
			console.log(it+1);
			this.b.print();
		}
		this.b=ob;
		return [inp,lab];
	}
	randsims(n){
		let tai=new AI();
		tai.usemodel=false;
		let inp=[];
		let tar=[];
		for (let m=0;m<9;m++){
			tai.b=new Board(this.b.h);
			if (!tai.b.place(m)) continue;
			//console.log(m);
			let avg=tai.avg(tai.play(n));
			inp.push(tai.vectorize());
			tar.push(avg);
		}
		return [inp,tar];
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
let ai=new AI();
//let stage1=ai.makeavgdata(10,1);
/*let stage1=[[],[]];
ai.usemodel=false;
for (let m=0;m<9;m++){
	console.log(m);
	ai.b=new Board();
	ai.b.place(m);
	avg=ai.avg(ai.play(10000));
	stage1[0].push(ai.vectorize());
	stage1[1].push(avg);
}*/
let stage1=JSON.parse("[[[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0]],[0.24605,0.36945,0.25375,0.36915,0.1503,0.3704,0.2466,0.37735,0.24775]]");
//let r=ai.trainModel(...stage1);
var stage2;
async function run(){
	await ai.trainModel(...stage1);
	ai.explore=0;
	ai.place();
	stage2=ai.randsims(1000);
	await ai.trainModel(...stage2);
	for (let i=0;i<3;i++){
		ai.place();
		ai.b.print();
		let data=ai.randsims(1000);
		await ai.trainModel(...data);
	}
};
