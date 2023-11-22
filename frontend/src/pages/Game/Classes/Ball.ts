import p5Types from "p5";
import Player from "./Player";
import Ai from "./Ai";

export default class Ball {
	x: number;
	y: number;
	vx: number;
	vy: number;
	p5: p5Types;

	radius: number;

	increaseSpeed: number;

	constructor(p5: p5Types, vx = 0, vy = 0) {
		this.x = p5.width / 2;
		this.y = p5.height / 2;

		this.vx = vx;
		this.vy = vy;

		this.p5 = p5;
		this.radius = 7.5;
		this.increaseSpeed = 1.10;
	}

	show() {
		this.p5.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
	}

	move(deltaTime: number) {
		if (this.y < 1) this.vy = Math.abs(this.vy);
		else if (this.y > this.p5.height) this.vy = -1 * Math.abs(this.vy);

		this.x += (deltaTime * this.vx) / 15;
		this.y += (deltaTime * this.vy) / 15;
	}

	collision(p: Player | Ai) {
		let testX = this.x;
		let testY = this.y;

		if (this.x < p.x - p.w / 2) {
			testX = p.x - p.w / 2; 
		} else if (this.x > p.x + p.w / 2) {
			testX = p.x + p.w / 2; 
		}
		if (this.y < p.y - p.h / 2) {
			testY = p.y - p.h / 2;
		} else if (this.y > p.y + p.h / 2) {
			testY = p.y + p.h / 2;
		}

		const distX = this.x - testX;
		const distY = this.y - testY;
		const distance = Math.sqrt(distX * distX + distY * distY);

		if (distance <= this.radius) {
			this.vx = this.vx * this.increaseSpeed;
			this.vy = this.vy * this.increaseSpeed;
			return true;
		}
		return false;
	}

	restart() {
		this.x = this.p5.width / 2;
		this.y = this.p5.height / 2;
	}

	getInfo() {
		return {
			y: this.y,
			vy: this.vy,
			x: this.x,
			vx: this.vx,
		};
	}
}
