class Board{
	constructor(){
		this.m=[[0,0,0],[0,0,0],[0,0,0]];
		this.p=0;
		this.h=[];
	}
	place(x,y){
		if (typeof(y)=='undefined'){
			y=x%3;
			x=Math.floor(x/3);
		}
		if (this.m[x][y]!=0) return false;
		let cp=this.p+1;
		this.m[x][y]=cp;
		if ((this.m[x][0]==cp && this.m[x][1]==cp && this.m[x][2]==cp) || (this.m[0][y]==cp && this.m[1][y]==cp && this.m[2][y]==cp) || (this.m[1][1]==cp && (this.m[0][0]==cp && this.m[2][2]==cp) || (this.m[0][2]==cp && this.m[2][0]==cp))){
			this.winner=cp;
			this.fin=true;
		}
		this.p=cp%2;
		this.h.push(x+y);
		if (this.h.length>8) this.fin=true;
	}
	print(){
		let syms=[' ','O','X'];
		console.log("\n"+syms[this.m[0][0]]+"|"+syms[this.m[0][1]]+"|"+syms[this.m[0][2]]);
		//console.log("_____");
		console.log(syms[this.m[1][0]]+"|"+syms[this.m[1][1]]+"|"+syms[this.m[1][2]]);
		//console.log("_____");
		console.log(syms[this.m[2][0]]+"|"+syms[this.m[2][1]]+"|"+syms[this.m[2][2]]);
		console.log(this.winner);
	}
	copy(){
		let nb=new Board;
		nb.m=JSON.parse(JSON.stringify(this.m));
		return nb;
	}
}
class AI{
	constructor(b){
		this.b=b;
	}
	evaluate(){
		return Math.random()-0.5;
	}
}
