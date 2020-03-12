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
		nb.winner=this.winner;
		nb.fin=this.fin;
		return nb;
	}
}
class AI{
	constructor(b){
		this.b=b||new Board();
		this.explore=0.1;
		this.usemodel=false;
		//this.model=this.createModel();
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
	rotate(b){ //by rotating the board we can get 3 additional samples from a position.
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
	async trainModel(inputs,labels,testfrac) {
		if (!this.model){ 
			this.model=this.createModel();
			this.usemodel=true;
		}
		let ll=labels.length;
		testfrac=testfrac||0.03;
		let ntest=Math.floor(ll*testfrac);
		let vali=inputs.slice(ll-ntest);
		let valt=labels.slice(ll-ntest);
		inputs=inputs.slice(0,ll-ntest);
		labels=labels.slice(0,ll-ntest);
		inputs=tf.tensor2d(inputs, [inputs.length, inputs[0].length]);
		labels=tf.tensor2d(labels, [labels.length, 1]);
		let testi=tf.tensor2d(vali, [vali.length, vali[0].length]);
		let testt=tf.tensor2d(valt, [valt.length, 1]);
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
			validationData: [testi, testt],
			callbacks: tfvis.show.fitCallbacks(
				{ name: 'Training Performance' },
				['loss', 'mse','val_loss'], 
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
			if (sum==0) return 0;
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
		if (this.b.fin) return;
		if (!n) n=1;
		for (let ni=0;ni<n;ni++){
			let m=this.select(this.evaluations());
			this.b.place(m);
			if (this.b.fin) break;
		}
	}
	play(n,aiopp){
		if (!n) n=1;
		let r=[];
		let ob=this.b;
		for (let ni=0;ni<n;ni++){
			this.b=ob.copy();
			if (aiopp){
				aiopp.b=this.b;
				if (Math.random()>0.5) ai.place();
				for (let m=0;m<9;m++){
					aiopp.place();
					ai.place();
					if (ai.b.fin){
						break;
					}
				}
			} else {
				this.place(9);
			}
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
	makedata(r,aiopp){
		if (typeof(r)=="number") r=this.play(r,aiopp);
		let inp=[];
		let lab=[];
		for (let ra of r){
			let h=ra[0];
			let hn=h.length;
			let target=ra[1];
			for (let hi=0;hi<hn;hi++){
				let tb=new Board(h);
				if (this.datamap){
					for (let rot=0;rot<4;rot++){
						let key=JSON.stringify(tb.m);
						let d=this.datamap.get(key);
						if (d) this.datamap.set(key,(d+target)/2);
						else{
							this.datamap.set(key,target);
						}
						tb=this.rotate(tb);
					}

				} else {
					inp.push(this.vectorize(tb));
					lab.push(target);
				}
				h.pop();
			}
		}
		if (this.datamap) return;
		return [inp,lab];
	}
	reducedatamap(){
		for (let key of this.datamap.keys()){
			let arr=this.datamap.get(key);
			let avg=arr.reduce((t,p)=>t+=p)/arr.length;
			this.datamap.set(key,avg);
		}
	}
	parsedatamap(){
		let inp=[];
		let lab=[];
		let tai=new AI();
		for (let [key,tar] of this.datamap){
			tai.b.m=JSON.parse(key);
			inp.push(tai.vectorize());
			lab.push(tar);
		}
		return [inp,lab];
	}
	createavgdata(its,depth,plays){
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
let ai=new AI();
ai.datamap=new Map();
ai.usemodel=false;

function evaluate(nit){
	nit=nit||100;
	let lost=0;
	let tai=new AI();
	tai.usemodel=false;
	let ob=ai.b;
	for (let it=0;it<nit;it++){
		tai.b=new Board();//ob.copy();
		ai.b=tai.b;
		for (let m=0;m<9;m++){
			tai.place();
			ai.place();
			if (ai.b.fin){
				if (ai.b.winner==1) lost+=1;
				break;
			}
		}
	}
	ai.b=ob;
	return lost/nit;
}