export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        // Positions
        this.startX = null;
        this.startY = null;
        this.endX = null;
        this.endY = null;
        // State
        this.isDown = false;
        this.isMoving = false;
        // Configuration
        this.maxJoystickRange = 100;
        this.pressRadius = 10;
        this.longPressDelay = 500;
        this.quickPressThreshold = 200;
        // Callbacks
        this.onLongPress = null;
        this.onQuickPress = null;
        // Timers
        this.longPressTimer = null;
        this.quickPressTimer = null;
        // Tracking
        this.downTime = 0;
        
        // Bind handlers
        this.handleDown = this.handleDown.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleUp = this.handleUp.bind(this);
    }

    addEventListeners() {
        this.canvas.style.touchAction = 'none';
        
        // Pointer events (mouse + touch)
        this.canvas.addEventListener('pointerdown', this.handleDown);
        window.addEventListener('pointermove', this.handleMove);
        window.addEventListener('pointerup', this.handleUp);
        window.addEventListener('pointercancel', this.handleUp);
    }

    handleDown(e) {
        e.preventDefault();
        const pos = this.getCanvasCoords(e);
        this.startX = this.endX = pos.x;
        this.startY = this.endY = pos.y;
        this.isDown = true;
        this.isMoving = false;
        this.downTime = Date.now();

        // Setup long press detection
        this.longPressTimer = setTimeout(() => {
            if (this.isDown && !this.isMoving) {
                this.longPress(this.startX, this.startY);  // Pass coordinates
            }
        }, this.longPressDelay);
    }

    handleMove(e) {
        if (!this.isDown) return;
        e.preventDefault();

        const pos = this.getCanvasCoords(e);
        this.endX = pos.x;
        this.endY = pos.y;

        // Check if movement exceeds threshold
        const dx = this.endX - this.startX;
        const dy = this.endY - this.startY;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared > this.pressRadius * this.pressRadius) {
            this.isMoving = true;
            clearTimeout(this.longPressTimer);
        }
    }

    handleUp(e) {
        if (!this.isDown) return;
        e.preventDefault();
        
        const pressDuration = Date.now() - this.downTime;
        
        clearTimeout(this.longPressTimer);
        
        // Check for quick press
        if (!this.isMoving && pressDuration < this.quickPressThreshold) {
            this.quickPress(this.startX, this.startY);  // Pass coordinates
        }
        
        this.isDown = false;
        this.resetStartValues();
    }

    quickPress(x, y) {
        if (this.onQuickPress) {
            this.onQuickPress(x, y);  // Pass coordinates to callback
        }
    }

    longPress(x, y) {
        if (this.onLongPress) {
            this.onLongPress(x, y);  // Pass coordinates to callback
        }
    }

    resetStartValues() {
        this.startX = null;
        this.startY = null;
        this.endX = null;
        this.endY = null;
        this.isMoving = false;
        this.downTime = 0;
    }

    getJoystickValues() {
        if (!this.isDown) return { x: 0, y: 0 };

        let x = (this.endX - this.startX) / this.maxJoystickRange;
        let y = (this.endY - this.startY) / this.maxJoystickRange;

        const mag = Math.sqrt(x * x + y * y);
        if (mag > 1) {
            x /= mag;
            y /= mag;
        }

        return { x, y };
    }

    getCanvasCoords(event) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX = event.clientX;
        let clientY = event.clientY;
    
        // If it's a touch event with touches, grab the first one
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        }
    
        // Map from client (CSS) space to canvas (pixel) space
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
    
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
}