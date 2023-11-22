import p5Types from "p5";
import Ball from "./Ball";

export default class Ai{
    x: number;
    y: number;
    v: number;
    w: number;
    h: number;

    constructor(p5: p5Types) {
        this.y = p5.height / 2;
        this.v = 4;
        this.w = 20;
        this.h = 80;
        this.x = p5.width;
    }

    show(p5: p5Types) {
        p5.rectMode(p5.CENTER);
        p5.rect(this.x, this.y, this.w, this.h);
    }

    move(ball: Ball) {
        if(ball.y > this.y)
        {
            this.y += this.v;
        }else if (ball.y < this.y)
        {
            this.y -= this.v;
        }
    }
}