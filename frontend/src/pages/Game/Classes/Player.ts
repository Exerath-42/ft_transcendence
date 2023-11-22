import p5Types from "p5";

export default class Player {
    x: number;
    y: number;
    v: number;
    w: number;
    h: number;
    p5: p5Types;


    constructor(p5: p5Types, playerNumber: 1 | 2) {
        this.x = 0;
        if (playerNumber === 1)
        {
            this.x = 0;
        }else if(playerNumber === 2)
        {
            this.x = p5.width;
        }
        
        this.y = p5.height / 2;
        this.v = 8;
        this.w = 10;
        this.h = 80;
        this.p5 = p5;
    }

    show(p5: p5Types) {
        p5.rectMode(p5.CENTER); 
        p5.rect(this.x, this.y, this.w, this.h);
    }

	moveUp(deltaTime:number) {
        if (this.y <= (this.h / 2))
        {
            this.y = this.h / 2;
            return;
        }
        this.y -= (deltaTime * this.v / 25);
    }

    moveDown(deltaTime:number) {
        if (this.y  >=  this.p5.height -  (this.h / 2) )
        {
            this.y = this.p5.height -  (this.h / 2);
            return;
        }

        this.y += (deltaTime * this.v / 25);
    }

    reset(){
        this.y = this.p5.height / 2;
    }

    getInfo(){
        return {
            y: this.y,
        }
    }
}
