// CanvasManager.js
class CanvasManager {
    constructor(canvas, layerId) {
        this.canvas = canvas;
        this.layerId = layerId;
        this.ctx = canvas.getContext('2d', {
            alpha: true,
            willReadFrequently: false
        });
        this.image = new Image();
        this.animationFrame = null;
        this.resizing = false;
        this.lastDrawTime = 0;
        this.FRAME_RATE = 60;
        this.FRAME_INTERVAL = 1000 / this.FRAME_RATE;
        
        this.animate = this.animate.bind(this);
        this.setupCanvas();
    }

    setupCanvas() {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (!rect) return;

        const dpr = window.devicePixelRatio || 1;
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);
        
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        
        this.ctx.scale(dpr, dpr);
    }

    setImage(src) {
        this.image.src = src;
    }

    drawQuadrant(config, x, y, width, height) {
        if (!width || !height || !this.image.complete) return;
        
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.clip();
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        const imgAspectRatio = this.image.width / this.image.height;
        let imgWidth = width * config.size;
        let imgHeight = imgWidth / imgAspectRatio;
        
        if (imgHeight > height * config.size) {
            imgHeight = height * config.size;
            imgWidth = imgHeight * imgAspectRatio;
        }
        
        this.ctx.translate(
            centerX + config.xaxis/10 + config.driftState.x,
            centerY + config.yaxis/10 + config.driftState.y
        );
        this.ctx.rotate(config.angle * Math.PI / 180);
        
        this.ctx.drawImage(
            this.image,
            -imgWidth / 2,
            -imgHeight / 2,
            imgWidth,
            imgHeight
        );
        
        this.ctx.restore();
    }

    draw(config) {
        if (!this.image.complete) return;
        const dpr = window.devicePixelRatio || 1;
        const width = this.canvas.width / dpr;
        const height = this.canvas.height / dpr;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw first quadrant
        this.drawQuadrant(config, 0, 0, width/2, height/2);
        
        // Mirror horizontally
        this.ctx.save();
        this.ctx.translate(width, 0);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(
            this.canvas, 
            0, 0, width/2, height/2,
            0, 0, width/2, height/2
        );
        this.ctx.restore();
        
        // Mirror vertically
        this.ctx.save();
        this.ctx.translate(0, height);
        this.ctx.scale(1, -1);
        this.ctx.drawImage(
            this.canvas,
            0, 0, width, height/2,
            0, 0, width, height/2
        );
        this.ctx.restore();
    }

    updateDrift(config) {
        if (config.drift > 0) {
            const time = (Date.now() - config.driftState.startTime) / 1000;
            config.driftState.x = Math.sin(time * config.driftSpeed) * 150 * config.drift;
            config.driftState.y = Math.cos(time * config.driftSpeed) * 150 * config.drift;
        } else {
            config.driftState.x = 0;
            config.driftState.y = 0;
        }
    }

    animate(config) {
        if (config.speed !== 0) {
            const now = performance.now();
            const elapsed = now - this.lastDrawTime;

            if (elapsed > this.FRAME_INTERVAL) {
                config.angle = (config.angle + config.speed * config.direction) % 360;
                this.updateDrift(config);
                this.draw(config);
                this.lastDrawTime = now - (elapsed % this.FRAME_INTERVAL);
            }

            this.animationFrame = requestAnimationFrame(() => this.animate(config));
        }
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    resize() {
        this.setupCanvas();
    }
}

export default CanvasManager;