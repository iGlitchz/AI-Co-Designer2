// Whiteboard Canvas Controller
class WhiteboardCanvas {
    constructor() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.querySelector('.whiteboard-container');
        
        // Pan and Zoom state
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 5;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // Panning state
        this.isPanning = false;
        this.startPanX = 0;
        this.startPanY = 0;
        this.lastPanX = 0;
        this.lastPanY = 0;
        
        // Elements on whiteboard (images, shapes, text, arrows)
        this.elements = [];
        this.selectedElements = [];
        this.isDraggingElement = false;
        this.isResizingElement = false;
        this.resizeHandle = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragElementData = [];
        this.resizeBoundingBox = null;
        
        // Tool state
        this.activeTool = null; // 'square', 'circle', 'arrow', 'text'
        this.isDrawingArrow = false;
        this.arrowStartPoint = null;
        this.arrowEndPoint = null;
        this.arrowStartElement = null;
        this.arrowEndElement = null;
        
        // Text editing
        this.editingElement = null;
        this.textInput = null;
        
        // Keyboard state
        this.isShiftPressed = false;
        
        // Initialize
        this.resizeCanvas();
        this.setupEventListeners();
        this.render();
        
        console.log('✅ Whiteboard initialized');
    }
    
    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.container.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.render();
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Mouse events for pan, drag, resize
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Prevent context menu on middle click
        this.canvas.addEventListener('contextmenu', (e) => {
            if (e.button === 1) {
                e.preventDefault();
            }
        });
        
        // Zoom with mouse wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom(e.deltaY, e.clientX, e.clientY);
        }, { passive: false });
        
        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            this.zoom(-100, centerX, centerY);
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            this.zoom(100, centerX, centerY);
        });
        
        document.getElementById('resetZoom').addEventListener('click', () => {
            this.resetView();
        });
        
        // Dock buttons
        document.getElementById('uploadImageBtn').addEventListener('click', () => {
            document.getElementById('dockImageInput').click();
        });
        
        document.getElementById('dockImageInput').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        document.getElementById('dockAnalyzeBtn').addEventListener('click', () => {
            this.analyzeSelectedImage();
        });
        
        // Shape and text tools
        document.getElementById('addSquareBtn').addEventListener('click', () => {
            this.addShape('square');
        });
        
        document.getElementById('addCircleBtn').addEventListener('click', () => {
            this.addShape('circle');
        });
        
        document.getElementById('addArrowBtn').addEventListener('click', () => {
            this.activeTool = 'arrow';
            this.canvas.style.cursor = 'crosshair';
        });
        
        document.getElementById('addTextBtn').addEventListener('click', () => {
            this.addText();
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedElements.length > 0 && !this.editingElement) {
                this.deleteSelectedElements();
            }
            if (e.key === 'Shift') {
                this.isShiftPressed = true;
            }
            if (e.key === 'Escape') {
                this.activeTool = null;
                this.isDrawingArrow = false;
                this.arrowStartPoint = null;
                this.canvas.style.cursor = 'default';
                this.render();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.isShiftPressed = false;
            }
        });
        
        // Paste event for images
        document.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to canvas coordinates
        const canvasX = (mouseX - this.offsetX) / this.scale;
        const canvasY = (mouseY - this.offsetY) / this.scale;
        
        // Check if clicking on an image
        const clickedImage = this.getImageAtPoint(canvasX, canvasY);
        
        if (clickedImage) {
            // Check if clicking on resize handle (works for single or multiple selection)
            const handle = this.selectedImages.length > 0 ? this.getResizeHandle(clickedImage, canvasX, canvasY) : null;
            if (handle) {
                this.isResizingImage = true;
                this.resizeHandle = handle;
                this.dragStartX = canvasX;
                this.dragStartY = canvasY;
                
                // Store bounding box and initial image data for multi-resize
                if (this.selectedImages.length > 1) {
                    this.resizeBoundingBox = this.getSelectionBoundingBox();
                    this.dragImageData = this.selectedImages.map(img => ({
                        image: img,
                        startX: img.x,
                        startY: img.y,
                        startWidth: img.width,
                        startHeight: img.height
                    }));
                }
                
                this.render();
                return;
            }
            
            // Multi-select with shift
            if (this.isShiftPressed) {
                const index = this.selectedImages.indexOf(clickedImage);
                if (index > -1) {
                    // Deselect if already selected
                    this.selectedImages.splice(index, 1);
                } else {
                    // Add to selection
                    this.selectedImages.push(clickedImage);
                }
                this.render();
                this.updateDockAnalyzeButton();
                return;
            }
            
            // Single select (or start dragging)
            if (!this.selectedImages.includes(clickedImage)) {
                this.selectedImages = [clickedImage];
            }
            
            // Start dragging image(s)
            this.isDraggingImage = true;
            this.dragStartX = canvasX;
            this.dragStartY = canvasY;
            
            // Store initial positions for all selected images
            this.dragImageData = this.selectedImages.map(img => ({
                image: img,
                startX: img.x,
                startY: img.y
            }));
            
            this.render();
            this.updateDockAnalyzeButton();
        } else if (e.button === 1) {
            // Middle mouse button - start panning
            e.preventDefault();
            this.startPanning(e.clientX, e.clientY);
        } else {
            // Deselect images
            if (this.selectedImages.length > 0) {
                this.selectedImages = [];
                this.render();
                this.updateDockAnalyzeButton();
            }
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const canvasX = (mouseX - this.offsetX) / this.scale;
        const canvasY = (mouseY - this.offsetY) / this.scale;
        
        if (this.isPanning) {
            e.preventDefault();
            this.pan(e.clientX, e.clientY);
        } else if (this.isDraggingImage && this.selectedImages.length > 0) {
            const deltaX = canvasX - this.dragStartX;
            const deltaY = canvasY - this.dragStartY;
            
            // Move all selected images
            this.dragImageData.forEach(data => {
                data.image.x = data.startX + deltaX;
                data.image.y = data.startY + deltaY;
            });
            this.render();
        } else if (this.isResizingImage && this.selectedImages.length === 1) {
            this.resizeImage(this.selectedImages[0], canvasX, canvasY);
            this.render();
        } else if (this.isResizingImage && this.selectedImages.length > 1) {
            this.resizeMultipleImages(canvasX, canvasY);
            this.render();
        } else {
            // Update cursor based on hover
            this.updateCursor(canvasX, canvasY);
        }
    }
    
    handleMouseUp(e) {
        if (this.isPanning) {
            this.stopPanning();
        }
        this.isDraggingImage = false;
        this.isResizingImage = false;
        this.resizeHandle = null;
        this.resizeBoundingBox = null;
    }
    
    updateCursor(canvasX, canvasY) {
        const hoveredImage = this.getImageAtPoint(canvasX, canvasY);
        
        if (hoveredImage) {
            const handle = this.getResizeHandle(hoveredImage, canvasX, canvasY);
            if (handle) {
                // Set cursor based on handle
                const cursors = {
                    'nw': 'nw-resize',
                    'ne': 'ne-resize',
                    'sw': 'sw-resize',
                    'se': 'se-resize'
                };
                this.canvas.style.cursor = cursors[handle] || 'default';
            } else {
                this.canvas.style.cursor = 'move';
            }
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    getImageAtPoint(x, y) {
        // Check from top to bottom (reverse order)
        for (let i = this.images.length - 1; i >= 0; i--) {
            const img = this.images[i];
            if (x >= img.x && x <= img.x + img.width &&
                y >= img.y && y <= img.y + img.height) {
                return img;
            }
        }
        return null;
    }
    
    getResizeHandle(image, x, y) {
        if (this.selectedImages.length === 0 || !this.selectedImages.includes(image)) return null;
        
        const handleSize = 12 / this.scale;
        let handles;
        
        // For multiple selection, use bounding box
        if (this.selectedImages.length > 1) {
            const bbox = this.getSelectionBoundingBox();
            handles = {
                'nw': { x: bbox.minX, y: bbox.minY },
                'ne': { x: bbox.maxX, y: bbox.minY },
                'sw': { x: bbox.minX, y: bbox.maxY },
                'se': { x: bbox.maxX, y: bbox.maxY }
            };
        } else {
            // For single selection, use image bounds
            handles = {
                'nw': { x: image.x, y: image.y },
                'ne': { x: image.x + image.width, y: image.y },
                'sw': { x: image.x, y: image.y + image.height },
                'se': { x: image.x + image.width, y: image.y + image.height }
            };
        }
        
        for (const [name, pos] of Object.entries(handles)) {
            if (Math.abs(x - pos.x) < handleSize && Math.abs(y - pos.y) < handleSize) {
                return name;
            }
        }
        return null;
    }
    
    getSelectionBoundingBox() {
        if (this.selectedImages.length === 0) return null;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.selectedImages.forEach(img => {
            minX = Math.min(minX, img.x);
            minY = Math.min(minY, img.y);
            maxX = Math.max(maxX, img.x + img.width);
            maxY = Math.max(maxY, img.y + img.height);
        });
        
        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }
    
    resizeMultipleImages(mouseX, mouseY) {
        if (!this.resizeBoundingBox || this.dragImageData.length === 0) return;
        
        const bbox = this.resizeBoundingBox;
        let newWidth = bbox.width;
        let newHeight = bbox.height;
        let scaleX = 1;
        let scaleY = 1;
        let anchorX = bbox.minX;
        let anchorY = bbox.minY;
        
        // Calculate new dimensions based on handle
        if (this.resizeHandle === 'se') {
            newWidth = Math.max(50, mouseX - bbox.minX);
            newHeight = Math.max(50, mouseY - bbox.minY);
            anchorX = bbox.minX;
            anchorY = bbox.minY;
        } else if (this.resizeHandle === 'sw') {
            newWidth = Math.max(50, bbox.maxX - mouseX);
            newHeight = Math.max(50, mouseY - bbox.minY);
            anchorX = bbox.maxX;
            anchorY = bbox.minY;
        } else if (this.resizeHandle === 'ne') {
            newWidth = Math.max(50, mouseX - bbox.minX);
            newHeight = Math.max(50, bbox.maxY - mouseY);
            anchorX = bbox.minX;
            anchorY = bbox.maxY;
        } else if (this.resizeHandle === 'nw') {
            newWidth = Math.max(50, bbox.maxX - mouseX);
            newHeight = Math.max(50, bbox.maxY - mouseY);
            anchorX = bbox.maxX;
            anchorY = bbox.maxY;
        }
        
        scaleX = newWidth / bbox.width;
        scaleY = newHeight / bbox.height;
        
        // Maintain aspect ratio unless shift is pressed
        if (!this.isShiftPressed) {
            const scale = Math.min(scaleX, scaleY);
            scaleX = scale;
            scaleY = scale;
        }
        
        // Apply scaling to all selected images
        this.dragImageData.forEach(data => {
            const relX = data.startX - bbox.minX;
            const relY = data.startY - bbox.minY;
            
            data.image.width = data.startWidth * scaleX;
            data.image.height = data.startHeight * scaleY;
            data.image.x = anchorX + (relX - (anchorX - bbox.minX)) * scaleX;
            data.image.y = anchorY + (relY - (anchorY - bbox.minY)) * scaleY;
        });
    }
    
    resizeImage(image, mouseX, mouseY) {
        const minSize = 50;
        const maintainAspectRatio = !this.isShiftPressed;
        const aspectRatio = image.aspectRatio || (image.width / image.height);
        
        if (this.resizeHandle === 'se') {
            const newWidth = Math.max(minSize, mouseX - image.x);
            const newHeight = maintainAspectRatio ? newWidth / aspectRatio : Math.max(minSize, mouseY - image.y);
            image.width = newWidth;
            image.height = newHeight;
        } else if (this.resizeHandle === 'sw') {
            const newWidth = Math.max(minSize, image.x + image.width - mouseX);
            const newHeight = maintainAspectRatio ? newWidth / aspectRatio : Math.max(minSize, mouseY - image.y);
            image.x = image.x + image.width - newWidth;
            image.width = newWidth;
            image.height = newHeight;
        } else if (this.resizeHandle === 'ne') {
            const newWidth = Math.max(minSize, mouseX - image.x);
            const newHeight = maintainAspectRatio ? newWidth / aspectRatio : Math.max(minSize, image.y + image.height - mouseY);
            if (!maintainAspectRatio) {
                image.y = image.y + image.height - newHeight;
            }
            image.width = newWidth;
            image.height = newHeight;
            if (maintainAspectRatio) {
                image.y = image.y + (image.height - newHeight);
            }
        } else if (this.resizeHandle === 'nw') {
            const newWidth = Math.max(minSize, image.x + image.width - mouseX);
            const newHeight = maintainAspectRatio ? newWidth / aspectRatio : Math.max(minSize, image.y + image.height - mouseY);
            image.x = image.x + image.width - newWidth;
            image.y = image.y + image.height - newHeight;
            image.width = newWidth;
            image.height = newHeight;
        }
    }
    
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Add image to center of viewport
                const viewportCenterX = (window.innerWidth / 2 - this.offsetX) / this.scale;
                const viewportCenterY = (window.innerHeight / 2 - this.offsetY) / this.scale;
                
                const maxWidth = 400;
                const scale = img.width > maxWidth ? maxWidth / img.width : 1;
                
                this.images.push({
                    img: img,
                    x: viewportCenterX - (img.width * scale) / 2,
                    y: viewportCenterY - (img.height * scale) / 2,
                    width: img.width * scale,
                    height: img.height * scale,
                    aspectRatio: img.width / img.height,
                    dataUrl: event.target.result
                });
                
                this.render();
                this.updateDockAnalyzeButton();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        
        // Reset input
        e.target.value = '';
    }
    
    deleteSelectedImages() {
        if (this.selectedImages.length === 0) return;
        
        // Remove all selected images
        this.selectedImages.forEach(selectedImg => {
            const index = this.images.indexOf(selectedImg);
            if (index > -1) {
                this.images.splice(index, 1);
            }
        });
        
        this.selectedImages = [];
        this.render();
        this.updateDockAnalyzeButton();
    }
    
    analyzeSelectedImage() {
        if (this.selectedImages.length === 0) return;
        
        // Send all selected images to chat for analysis
        const imageDataUrls = this.selectedImages.map(img => img.dataUrl);
        window.sendImageToChat(imageDataUrls);
    }
    
    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Add image to center of viewport
                        const viewportCenterX = (window.innerWidth / 2 - this.offsetX) / this.scale;
                        const viewportCenterY = (window.innerHeight / 2 - this.offsetY) / this.scale;
                        
                        const maxWidth = 400;
                        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
                        
                        this.images.push({
                            img: img,
                            x: viewportCenterX - (img.width * scale) / 2,
                            y: viewportCenterY - (img.height * scale) / 2,
                            width: img.width * scale,
                            height: img.height * scale,
                            aspectRatio: img.width / img.height,
                            dataUrl: event.target.result
                        });
                        
                        this.render();
                        this.updateDockAnalyzeButton();
                        console.log('✅ Image pasted to whiteboard');
                    };
                    img.src = event.target.result;
                };
                
                reader.readAsDataURL(blob);
                break;
            }
        }
    }
    
    updateDockAnalyzeButton() {
        const btn = document.getElementById('dockAnalyzeBtn');
        if (this.selectedImages.length > 0) {
            btn.disabled = false;
            btn.title = this.selectedImages.length === 1 ? 'Analyze selected image' : `Analyze ${this.selectedImages.length} selected images`;
        } else {
            btn.disabled = true;
            btn.title = 'Select an image to analyze';
        }
    }
    
    startPanning(x, y) {
        this.isPanning = true;
        this.startPanX = x - this.offsetX;
        this.startPanY = y - this.offsetY;
        this.lastPanX = x;
        this.lastPanY = y;
        this.container.classList.add('panning');
        this.canvas.style.cursor = 'grabbing';
    }
    
    pan(x, y) {
        if (!this.isPanning) return;
        
        this.offsetX = x - this.startPanX;
        this.offsetY = y - this.startPanY;
        
        this.lastPanX = x;
        this.lastPanY = y;
        
        this.render();
    }
    
    stopPanning() {
        this.isPanning = false;
        this.container.classList.remove('panning');
        this.canvas.style.cursor = 'default';
    }
    
    zoom(delta, mouseX, mouseY) {
        const zoomIntensity = 0.1;
        const wheel = delta > 0 ? -1 : 1;
        const zoom = Math.exp(wheel * zoomIntensity);
        
        const newScale = this.scale * zoom;
        
        // Clamp scale
        if (newScale < this.minScale || newScale > this.maxScale) {
            return;
        }
        
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseXCanvas = mouseX - rect.left;
        const mouseYCanvas = mouseY - rect.top;
        
        // Calculate new offset to zoom towards mouse position
        this.offsetX = mouseXCanvas - (mouseXCanvas - this.offsetX) * zoom;
        this.offsetY = mouseYCanvas - (mouseYCanvas - this.offsetY) * zoom;
        
        this.scale = newScale;
        this.updateZoomDisplay();
        this.render();
    }
    
    resetView() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.updateZoomDisplay();
        this.render();
    }
    
    updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoomLevel');
        zoomLevel.textContent = Math.round(this.scale * 100) + '%';
    }
    
    render() {
        const rect = this.container.getBoundingClientRect();
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Save context state
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        
        // Draw grid (enhanced for zoom)
        this.drawGrid(ctx, rect.width, rect.height);
        
        // Draw images
        this.images.forEach(imgData => {
            ctx.drawImage(imgData.img, imgData.x, imgData.y, imgData.width, imgData.height);
        });
        
        // Draw selection outlines and handles
        if (this.selectedImages.length > 0) {
            this.drawSelectionUI(ctx);
        }
        
        // Restore context
        ctx.restore();
    }
    
    drawSelectionUI(ctx) {
        if (this.selectedImages.length === 0) return;
        
        // Draw individual selection outlines
        this.selectedImages.forEach(imgData => {
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2 / this.scale;
            ctx.strokeRect(imgData.x, imgData.y, imgData.width, imgData.height);
        });
        
        // Draw resize handles
        const handleSize = 10 / this.scale;
        let handles;
        
        if (this.selectedImages.length > 1) {
            // For multiple selection, draw bounding box with handles
            const bbox = this.getSelectionBoundingBox();
            
            // Draw bounding box outline (dashed)
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3 / this.scale;
            ctx.setLineDash([8 / this.scale, 4 / this.scale]);
            ctx.strokeRect(bbox.minX, bbox.minY, bbox.width, bbox.height);
            ctx.setLineDash([]);
            
            handles = [
                { x: bbox.minX, y: bbox.minY }, // nw
                { x: bbox.maxX, y: bbox.minY }, // ne
                { x: bbox.minX, y: bbox.maxY }, // sw
                { x: bbox.maxX, y: bbox.maxY }  // se
            ];
        } else {
            // Single selection handles
            const imgData = this.selectedImages[0];
            handles = [
                { x: imgData.x, y: imgData.y }, // nw
                { x: imgData.x + imgData.width, y: imgData.y }, // ne
                { x: imgData.x, y: imgData.y + imgData.height }, // sw
                { x: imgData.x + imgData.width, y: imgData.y + imgData.height } // se
            ];
        }
        
        // Draw handles
        ctx.fillStyle = '#667eea';
        handles.forEach(handle => {
            ctx.fillRect(
                handle.x - handleSize / 2,
                handle.y - handleSize / 2,
                handleSize,
                handleSize
            );
        });
    }
    
    drawSelection(ctx, imgData, showHandles) {
        // Legacy method - kept for compatibility
        // Selection outline
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2 / this.scale;
        ctx.strokeRect(imgData.x, imgData.y, imgData.width, imgData.height);
    }
    
    drawGrid(ctx, width, height) {
        const gridSize = 40;
        const gridColor = 'rgba(200, 200, 200, 0.3)';
        
        // Calculate visible area
        const startX = Math.floor(-this.offsetX / this.scale / gridSize) * gridSize;
        const startY = Math.floor(-this.offsetY / this.scale / gridSize) * gridSize;
        const endX = startX + (width / this.scale) + gridSize;
        const endY = startY + (height / this.scale) + gridSize;
        
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1 / this.scale;
        
        // Draw vertical lines
        ctx.beginPath();
        for (let x = startX; x < endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        
        // Draw horizontal lines
        for (let y = startY; y < endY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    }
}

// Initialize whiteboard when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.whiteboard = new WhiteboardCanvas();
    });
} else {
    window.whiteboard = new WhiteboardCanvas();
}
