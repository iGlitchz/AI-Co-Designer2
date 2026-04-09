// Whiteboard Canvas Controller with Shapes, Text, and Arrows
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
        // Arrow state
        this.isDraggingArrowEndpoint = false;
        this.arrowEndpointType = null;
        this.isDraggingArrowControl = false;
        
        // Tool state
        this.activeTool = null;
        this.isDrawingArrow = false;
        this.arrowStartPoint = null;
        this.temporaryArrowEnd = null;
        
        // Text editing
        this.editingElement = null;
        this.textInput = null;
        
        // Double-click tracking
        this.lastClickTime = 0;
        this.lastClickElement = null;
        
        // Keyboard state
        this.isShiftPressed = false;
        
        // Selection rectangle (marquee selection)
        this.isSelectingArea = false;
        this.selectionStart = null;
        this.selectionEnd = null;

        // Dock drag preview state
        this.dockPreviewTool = null;
        this.dockPreviewPoint = null;
        this.isDockToolDragging = false;
        this.pendingDockTool = null;
        this.pendingDockToolStart = null;
        this.suppressDockToolClick = false;
        this.dockToolMimeType = 'application/x-simplechatbot-dock-tool';
        
        // Initialize
        this.textBoxFillColor = 'rgba(255, 255, 255, 0.5)';
        this.whiteboardChangeDebounceTimer = null;
        this.createTextAlignToolbar();
        this.createImageActionToolbar();
        this.resizeCanvas();
        this.setupEventListeners();
        this.render();
        
        console.log('✅ Whiteboard initialized');
    }

    notifyWhiteboardChanged(reason = 'update') {
        if (this.whiteboardChangeDebounceTimer) {
            clearTimeout(this.whiteboardChangeDebounceTimer);
        }

        this.whiteboardChangeDebounceTimer = setTimeout(() => {
            this.whiteboardChangeDebounceTimer = null;
            document.dispatchEvent(new CustomEvent('whiteboard:changed', {
                detail: {
                    reason,
                    timestamp: Date.now()
                }
            }));
        }, 120);
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
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClickEvent(e));
        
        // Prevent context menu on middle click
        this.canvas.addEventListener('contextmenu', (e) => {
            if (e.button === 1) e.preventDefault();
        });
        
        // Zoom with mouse wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom(e.deltaY, e.clientX, e.clientY);
        }, { passive: false });
        
        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.zoom(-100, window.innerWidth / 2, window.innerHeight / 2);
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            this.zoom(100, window.innerWidth / 2, window.innerHeight / 2);
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
        
        document.getElementById('addSquareBtn').addEventListener('click', () => {
            this.addShape('square');
        });
        
        document.getElementById('addCircleBtn').addEventListener('click', () => {
            this.addShape('circle');
        });
        
        document.getElementById('addArrowBtn').addEventListener('click', () => {
            this.addArrowAtCenter();
        });
        
        document.getElementById('addTextBtn').addEventListener('click', () => {
            this.addText();
        });

        // Drag tools from dock to place directly on whiteboard.
        const dockDragTools = [
            { id: 'addSquareBtn', tool: 'square' },
            { id: 'addCircleBtn', tool: 'circle' },
            { id: 'addArrowBtn', tool: 'arrow' },
            { id: 'addTextBtn', tool: 'text' }
        ];

        dockDragTools.forEach(({ id, tool }) => {
            const button = document.getElementById(id);
            if (!button) return;

            button.classList.add('dock-tool-draggable');

            // Intercept click during drag so center-placement click handler does not fire.
            button.addEventListener('click', (e) => {
                if (this.suppressDockToolClick) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.suppressDockToolClick = false;
                }
            }, true);

            button.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                this.pendingDockTool = tool;
                this.pendingDockToolStart = { x: e.clientX, y: e.clientY };
                this.isDockToolDragging = false;
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.pendingDockTool) return;

            if (!this.isDockToolDragging) {
                const dx = Math.abs(e.clientX - this.pendingDockToolStart.x);
                const dy = Math.abs(e.clientY - this.pendingDockToolStart.y);
                if (dx < 4 && dy < 4) return;

                this.isDockToolDragging = true;
                this.suppressDockToolClick = true;
                this.dockPreviewTool = this.pendingDockTool;
                this.container.classList.add('dock-drop-ready');
            }

            if (this.isDockToolDragging) {
                const canvasRect = this.canvas.getBoundingClientRect();
                const inCanvas = e.clientX >= canvasRect.left && e.clientX <= canvasRect.right &&
                    e.clientY >= canvasRect.top && e.clientY <= canvasRect.bottom;

                if (inCanvas) {
                    this.dockPreviewPoint = this.getCanvasPointFromClient(e.clientX, e.clientY);
                    this.container.classList.add('drop-ready');
                } else {
                    this.container.classList.remove('drop-ready');
                    this.dockPreviewPoint = null;
                }

                this.render();
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (!this.pendingDockTool) return;

            if (this.isDockToolDragging) {
                const canvasRect = this.canvas.getBoundingClientRect();
                const inCanvas = e.clientX >= canvasRect.left && e.clientX <= canvasRect.right &&
                    e.clientY >= canvasRect.top && e.clientY <= canvasRect.bottom;

                if (inCanvas) {
                    const dropPoint = this.getCanvasPointFromClient(e.clientX, e.clientY);
                    this.addDockToolAtPoint(this.pendingDockTool, dropPoint.x, dropPoint.y);
                }

                this.dockPreviewPoint = null;
                this.dockPreviewTool = null;
                this.container.classList.remove('drop-ready');
                this.container.classList.remove('dock-drop-ready');
                this.render();
            }

            this.pendingDockTool = null;
            this.pendingDockToolStart = null;
            this.isDockToolDragging = false;
        });
        
        document.getElementById('dockAnalyzeBtn').addEventListener('click', () => {
            this.analyzeSelectedElements();
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

        document.addEventListener('mousedown', (e) => {
            if (!this.imageActionToolbar) return;
            if (!this.imageActionToolbar.contains(e.target)) {
                this.hideRemixMenu();
            }
        });
    }

    createTextAlignToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'text-align-toolbar';

        const buttons = [
            {
                align: 'left',
                title: 'Align Left',
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6" x2="19" y2="6"></line><line x1="4" y1="10" x2="16" y2="10"></line><line x1="4" y1="14" x2="19" y2="14"></line><line x1="4" y1="18" x2="14" y2="18"></line></svg>'
            },
            {
                align: 'justify',
                title: 'Justify',
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="10" x2="20" y2="10"></line><line x1="4" y1="14" x2="20" y2="14"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>'
            },
            {
                align: 'center',
                title: 'Align Center',
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="6" x2="19" y2="6"></line><line x1="7" y1="10" x2="17" y2="10"></line><line x1="4" y1="14" x2="20" y2="14"></line><line x1="8" y1="18" x2="16" y2="18"></line></svg>'
            },
            {
                align: 'right',
                title: 'Align Right',
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="6" x2="20" y2="6"></line><line x1="8" y1="10" x2="20" y2="10"></line><line x1="5" y1="14" x2="20" y2="14"></line><line x1="10" y1="18" x2="20" y2="18"></line></svg>'
            }
        ];

        buttons.forEach((def) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'text-align-btn';
            btn.dataset.align = def.align;
            btn.title = def.title;
            btn.innerHTML = def.icon;
            btn.addEventListener('mousedown', (e) => e.preventDefault());
            btn.addEventListener('click', () => this.applyTextAlignment(def.align));
            toolbar.appendChild(btn);
        });

        document.body.appendChild(toolbar);
        this.textAlignToolbar = toolbar;
    }

    createImageActionToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'image-action-toolbar';

        const appendBtn = document.createElement('button');
        appendBtn.type = 'button';
        appendBtn.className = 'image-action-btn';
        appendBtn.title = 'Append to chat input';
        appendBtn.textContent = 'Append';
        appendBtn.addEventListener('mousedown', (e) => e.preventDefault());
        appendBtn.addEventListener('click', () => this.handleImageToolbarAction('append'));

        const analyzeBtn = document.createElement('button');
        analyzeBtn.type = 'button';
        analyzeBtn.className = 'image-action-btn';
        analyzeBtn.title = 'Visual analyze';
        analyzeBtn.textContent = 'Analyze';
        analyzeBtn.addEventListener('mousedown', (e) => e.preventDefault());
        analyzeBtn.addEventListener('click', () => this.handleImageToolbarAction('analyze'));

        const remixWrap = document.createElement('div');
        remixWrap.className = 'image-remix-wrap';

        const remixBtn = document.createElement('button');
        remixBtn.type = 'button';
        remixBtn.className = 'image-action-btn remix';
        remixBtn.title = 'Remix (right-click for styles)';
        remixBtn.textContent = 'Remix';
        remixBtn.addEventListener('mousedown', (e) => e.preventDefault());
        remixBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleRemixMenu();
        });
        remixBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleRemixMenu(true);
        });

        const remixMenu = document.createElement('div');
        remixMenu.className = 'image-remix-menu';

        const remixOptions = [
            { key: 'sketchify', label: 'Sketchify' },
            { key: 'wireframe', label: 'Wireframe' },
            { key: 'abstract silhouette', label: 'Abstract Silhouette' }
        ];

        remixOptions.forEach((opt) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'image-remix-option';
            item.textContent = opt.label;
            item.addEventListener('click', () => {
                this.hideRemixMenu();
                this.handleImageToolbarAction('remix', opt.key);
            });
            remixMenu.appendChild(item);
        });

        remixWrap.appendChild(remixBtn);
        remixWrap.appendChild(remixMenu);

        const feasBtn = document.createElement('button');
        feasBtn.type = 'button';
        feasBtn.className = 'image-action-btn';
        feasBtn.title = 'Technical feasibility report';
        feasBtn.textContent = 'Feasibility';
        feasBtn.addEventListener('mousedown', (e) => e.preventDefault());
        feasBtn.addEventListener('click', () => this.handleImageToolbarAction('feasibility'));

        toolbar.appendChild(appendBtn);
        toolbar.appendChild(analyzeBtn);
        toolbar.appendChild(remixWrap);
        toolbar.appendChild(feasBtn);

        document.body.appendChild(toolbar);
        this.imageActionToolbar = toolbar;
        this.remixMenu = remixMenu;
    }

    toggleRemixMenu(forceOpen = false) {
        if (!this.remixMenu) return;
        const open = this.remixMenu.classList.contains('show');
        if (open && !forceOpen) {
            this.hideRemixMenu();
            return;
        }
        this.remixMenu.classList.add('show');
    }

    hideRemixMenu() {
        if (this.remixMenu) {
            this.remixMenu.classList.remove('show');
        }
    }

    getSelectedImages() {
        return this.selectedElements.filter(el => el.type === 'image' && el.dataUrl);
    }

    handleImageToolbarAction(action, remixStyle = null) {
        const selectedImages = this.getSelectedImages();
        if (selectedImages.length === 0) return;

        const imageDataUrls = selectedImages.map(img => img.dataUrl);

        if (action === 'append' && typeof window.appendImagesToChatComposer === 'function') {
            window.appendImagesToChatComposer(imageDataUrls);
            return;
        }

        if (action === 'analyze' && typeof window.sendImageToChat === 'function') {
            window.sendImageToChat(imageDataUrls);
            return;
        }

        if (action === 'remix' && typeof window.remixWhiteboardImage === 'function') {
            window.remixWhiteboardImage(imageDataUrls[0], remixStyle || 'sketchify');
            return;
        }

        if (action === 'feasibility' && typeof window.requestTechnicalFeasibilityFromWhiteboard === 'function') {
            window.requestTechnicalFeasibilityFromWhiteboard(imageDataUrls);
        }
    }
    
    handleMouseDown(e) {
        if (this.editingElement) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const canvasX = (mouseX - this.offsetX) / this.scale;
        const canvasY = (mouseY - this.offsetY) / this.scale;
        
        // Handle arrow drawing mode
        if (this.activeTool === 'arrow') {
            if (!this.isDrawingArrow) {
                this.arrowStartPoint = { x: canvasX, y: canvasY };
                this.isDrawingArrow = true;
            } else {
                this.finalizeArrow(canvasX, canvasY);
            }
            return;
        }
        
        // Check if clicking on an element
        const clickedElement = this.getElementAtPoint(canvasX, canvasY);
        this.lastClickElement = clickedElement;
        
        if (clickedElement) {
            // Check for arrow control point handle
            if (clickedElement.type === 'arrow' && this.selectedElements.includes(clickedElement)) {
                const controlHandle = this.getArrowControlHandle(clickedElement, canvasX, canvasY);
                if (controlHandle) {
                    this.isDraggingArrowControl = true;
                    this.dragStartX = canvasX;
                    this.dragStartY = canvasY;
                    return;
                }
                
                // Check for arrow endpoint handle
                const endpointHandle = this.getArrowEndpointHandle(clickedElement, canvasX, canvasY);
                if (endpointHandle) {
                    this.isDraggingArrowEndpoint = true;
                    this.arrowEndpointType = endpointHandle;
                    this.dragStartX = canvasX;
                    this.dragStartY = canvasY;
                    return;
                }
            }
            
            // Check for resize handle
            const handle = this.selectedElements.length > 0 ? this.getResizeHandle(clickedElement, canvasX, canvasY) : null;
            if (handle) {
                this.isResizingElement = true;
                this.resizeHandle = handle;
                this.dragStartX = canvasX;
                this.dragStartY = canvasY;
                
                if (this.selectedElements.length > 1) {
                    this.resizeBoundingBox = this.getSelectionBoundingBox();
                    this.dragElementData = this.selectedElements.map(el => ({
                        element: el,
                        startX: el.x,
                        startY: el.y,
                        startWidth: el.width,
                        startHeight: el.height,
                        startFontSize: el.fontSize || 16
                    }));
                }
                this.render();
                return;
            }
            
            // Multi-select with shift
            if (this.isShiftPressed) {
                const index = this.selectedElements.indexOf(clickedElement);
                if (index > -1) {
                    this.selectedElements.splice(index, 1);
                } else {
                    this.selectedElements.push(clickedElement);
                }
                this.render();
                this.updateDockAnalyzeButton();
                return;
            }
            
            // Single select
            if (!this.selectedElements.includes(clickedElement)) {
                this.selectedElements = [clickedElement];
            }
            
            // Start dragging (but not for arrows - arrows can only be manipulated via their handles)
            if (clickedElement.type !== 'arrow') {
                this.isDraggingElement = true;
                this.dragStartX = canvasX;
                this.dragStartY = canvasY;
                
                this.dragElementData = this.selectedElements.map(el => {
                    if (el.type === 'arrow') {
                        return {
                            element: el,
                            startX: el.startX,
                            startY: el.startY,
                            endX: el.endX,
                            endY: el.endY,
                            controlX: el.controlX,
                            controlY: el.controlY
                        };
                    } else {
                        return {
                            element: el,
                            startX: el.x,
                            startY: el.y
                        };
                    }
                });
            }
            
            this.render();
            this.updateDockAnalyzeButton();
        } else if (e.button === 1) {
            e.preventDefault();
            this.startPanning(e.clientX, e.clientY);
        } else {
            // Start marquee selection on empty space
            this.isSelectingArea = true;
            this.selectionStart = { x: canvasX, y: canvasY };
            this.selectionEnd = { x: canvasX, y: canvasY };
            
            if (this.selectedElements.length > 0) {
                this.selectedElements = [];
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
        } else if (this.isDrawingArrow && this.arrowStartPoint) {
            this.temporaryArrowEnd = { x: canvasX, y: canvasY };
            this.render();
        } else if (this.isDraggingArrowControl && this.selectedElements.length === 1) {
            const arrow = this.selectedElements[0];
            arrow.controlX = canvasX;
            arrow.controlY = canvasY;
            arrow.controlManuallyAdjusted = true; // Mark that control point has been manually moved
            this.render();
        } else if (this.isDraggingArrowEndpoint && this.selectedElements.length === 1) {
            const arrow = this.selectedElements[0];
            const snapPoint = this.findSnapPoint(canvasX, canvasY);
            
            if (this.arrowEndpointType === 'start') {
                arrow.startX = snapPoint.x;
                arrow.startY = snapPoint.y;
                arrow.startElement = snapPoint.element;
                // Update proportional offset if snapped to an element
                if (snapPoint.element) {
                    arrow.startOffsetX = (snapPoint.x - snapPoint.element.x) / snapPoint.element.width;
                    arrow.startOffsetY = (snapPoint.y - snapPoint.element.y) / snapPoint.element.height;
                } else {
                    arrow.startOffsetX = 0;
                    arrow.startOffsetY = 0;
                }
                // If control point hasn't been manually adjusted, keep arrow straight
                if (!arrow.controlManuallyAdjusted) {
                    arrow.controlX = (arrow.startX + arrow.endX) / 2;
                    arrow.controlY = (arrow.startY + arrow.endY) / 2;
                }
            } else if (this.arrowEndpointType === 'end') {
                arrow.endX = snapPoint.x;
                arrow.endY = snapPoint.y;
                arrow.endElement = snapPoint.element;
                // Update proportional offset if snapped to an element
                if (snapPoint.element) {
                    arrow.endOffsetX = (snapPoint.x - snapPoint.element.x) / snapPoint.element.width;
                    arrow.endOffsetY = (snapPoint.y - snapPoint.element.y) / snapPoint.element.height;
                } else {
                    arrow.endOffsetX = 0;
                    arrow.endOffsetY = 0;
                }
                // If control point hasn't been manually adjusted, keep arrow straight
                if (!arrow.controlManuallyAdjusted) {
                    arrow.controlX = (arrow.startX + arrow.endX) / 2;
                    arrow.controlY = (arrow.startY + arrow.endY) / 2;
                }
            }
            this.render();
        } else if (this.isDraggingElement && this.selectedElements.length > 0) {
            const deltaX = canvasX - this.dragStartX;
            const deltaY = canvasY - this.dragStartY;
            
            this.dragElementData.forEach(data => {
                if (data.element.type === 'arrow') {
                    data.element.startX = data.startX + deltaX;
                    data.element.startY = data.startY + deltaY;
                    data.element.endX = data.endX + deltaX;
                    data.element.endY = data.endY + deltaY;
                    data.element.controlX = data.controlX + deltaX;
                    data.element.controlY = data.controlY + deltaY;
                } else {
                    data.element.x = data.startX + deltaX;
                    data.element.y = data.startY + deltaY;
                }
            });
            
            // Update any arrows attached to moved elements
            this.updateAttachedArrows();
            this.render();
        } else if (this.isResizingElement && this.selectedElements.length === 1) {
            this.resizeElement(this.selectedElements[0], canvasX, canvasY);
            this.updateAttachedArrows();
            this.render();
        } else if (this.isResizingElement && this.selectedElements.length > 1) {
            this.resizeMultipleElements(canvasX, canvasY);
            this.updateAttachedArrows();
            this.render();
        } else if (this.isSelectingArea) {
            // Update selection rectangle
            this.selectionEnd = { x: canvasX, y: canvasY };
            this.render();
        } else {
            this.updateCursor(canvasX, canvasY);
        }
    }
    
    handleMouseUp(e) {
        const hadElementMutation = this.isDraggingElement || this.isResizingElement || this.isDraggingArrowEndpoint || this.isDraggingArrowControl;

        if (this.isPanning) {
            this.stopPanning();
        }
        
        // Handle marquee selection
        if (this.isSelectingArea && this.selectionStart && this.selectionEnd) {
            const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
            const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
            const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
            const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);
            
            // Select all elements that intersect with the selection rectangle
            this.selectedElements = this.elements.filter(el => {
                if (el.type === 'arrow') {
                    // Check if curved arrow intersects with selection box
                    return this.curveIntersectsRect(el.startX, el.startY, el.controlX, el.controlY, el.endX, el.endY, minX, minY, maxX, maxY);
                } else {
                    // Check if element intersects with selection box
                    return !(el.x + el.width < minX || el.x > maxX || el.y + el.height < minY || el.y > maxY);
                }
            });
            
            this.isSelectingArea = false;
            this.selectionStart = null;
            this.selectionEnd = null;
            this.render();
            this.updateDockAnalyzeButton();
        }
        
        this.isDraggingElement = false;
        this.isResizingElement = false;
        this.isDraggingArrowEndpoint = false;
        this.isDraggingArrowControl = false;
        this.resizeHandle = null;
        this.arrowEndpointType = null;
        this.resizeBoundingBox = null;

        if (hadElementMutation) {
            this.notifyWhiteboardChanged('transform');
        }
    }
    
    handleDoubleClickEvent(e) {
        if (this.editingElement) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const canvasX = (mouseX - this.offsetX) / this.scale;
        const canvasY = (mouseY - this.offsetY) / this.scale;
        
        const clickedElement = this.getElementAtPoint(canvasX, canvasY);
        if (clickedElement) {
            this.handleDoubleClick(clickedElement);
        }
    }
    
    handleDoubleClick(element) {
        if (element.type === 'square' || element.type === 'circle' || element.type === 'text') {
            this.startTextEditing(element);
        }
    }
    
    startTextEditing(element) {
        this.editingElement = element;
        
        // Create text input
        const input = document.createElement('textarea');
        input.value = element.text || '';
        input.style.position = 'fixed';
        
        const screenX = element.x * this.scale + this.offsetX;
        const screenY = element.y * this.scale + this.offsetY;
        
        input.style.left = screenX + 'px';
        input.style.top = screenY + 'px';
        input.style.width = (element.width * this.scale) + 'px';
        input.style.height = (element.height * this.scale) + 'px';
        const baseFontSize = Math.max(10, Math.min(42, element.fontSize || 16));
        input.style.fontSize = (baseFontSize * this.scale) + 'px';
        input.style.lineHeight = '1.25';
        input.style.fontFamily = 'Arial, sans-serif';
        input.style.border = '1.5px solid #9db0ff';
        input.style.borderRadius = '12px';
        input.style.padding = '10px';
        input.style.zIndex = '10000';
        input.style.resize = 'none';
        input.style.overflow = 'auto';
        input.style.whiteSpace = 'pre-wrap';
        input.style.wordBreak = 'break-word';
        input.style.background = this.textBoxFillColor;
        input.style.color = '#2f3853';
        input.style.boxShadow = '0 8px 24px rgba(44, 62, 125, 0.16)';
        input.style.textAlign = element.textAlign || 'left';
        input.style.outline = 'none';
        
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        this.textInput = input;
        this.render(); // Re-render to hide the element being edited
        
        const finishEditing = () => {
            element.text = input.value;
            document.body.removeChild(input);
            this.textInput = null;
            this.editingElement = null;
            this.render();
            this.notifyWhiteboardChanged('text-edit');
        };
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey && element.type !== 'text')) {
                e.preventDefault();
                finishEditing();
            }
        });
    }
    
    addShape(type) {
        const viewportCenterX = (window.innerWidth / 2 - this.offsetX) / this.scale;
        const viewportCenterY = (window.innerHeight / 2 - this.offsetY) / this.scale;
        return this.addShapeAt(type, viewportCenterX, viewportCenterY);
    }

    addShapeAt(type, centerX, centerY) {
        
        const element = {
            type: type,
            x: centerX - 75,
            y: centerY - 75,
            width: 150,
            height: 150,
            text: '',
            textAlign: 'left',
            fontSize: 16,
            fillColor: 'rgba(102, 126, 234, 0.1)',
            strokeColor: '#667eea',
            strokeWidth: 2
        };
        
        this.elements.push(element);
        this.selectedElements = [element];
        this.render();
        this.updateDockAnalyzeButton();
        this.notifyWhiteboardChanged('shape-add');
        return element;
    }
    
    addText() {
        const viewportCenterX = (window.innerWidth / 2 - this.offsetX) / this.scale;
        const viewportCenterY = (window.innerHeight / 2 - this.offsetY) / this.scale;
        const element = this.addTextAt(viewportCenterX, viewportCenterY);
        
        // Auto-start editing
        setTimeout(() => this.startTextEditing(element), 100);
    }

    addTextAt(centerX, centerY) {
        
        const element = {
            type: 'text',
            x: centerX - 75,
            y: centerY - 15,
            width: 150,
            height: 44,
            text: '',
            textAlign: 'left',
            fontSize: 16,
            fillColor: this.textBoxFillColor,
            strokeColor: 'rgba(125, 146, 224, 0.7)',
            strokeWidth: 1
        };
        
        this.elements.push(element);
        this.selectedElements = [element];
        this.render();
        this.updateDockAnalyzeButton();
        this.notifyWhiteboardChanged('text-add');
        return element;
    }
    
    addTextFromDrop(text, x, y) {
        const lines = text.split('\n');
        const estimatedWidth = Math.max(200, Math.min(400, text.length * 8));
        const estimatedHeight = Math.max(50, lines.length * 25);
        
        const element = {
            type: 'text',
            x: x - estimatedWidth / 2,
            y: y - estimatedHeight / 2,
            width: estimatedWidth,
            height: estimatedHeight,
            text: text,
            textAlign: 'left',
            fontSize: 16,
            fillColor: this.textBoxFillColor,
            strokeColor: 'rgba(125, 146, 224, 0.7)',
            strokeWidth: 1
        };
        
        this.elements.push(element);
        this.selectedElements = [element];
        this.render();
        this.updateDockAnalyzeButton();
        this.notifyWhiteboardChanged('text-drop');
        console.log('✅ Text dropped on whiteboard');
    }

    addImageFromDrop(imageSource, x, y) {
        return new Promise((resolve) => {
            if (!imageSource) {
                resolve(false);
                return;
            }

            const img = new Image();
            img.onload = () => {
                const maxWidth = 400;
                const scale = img.width > maxWidth ? maxWidth / img.width : 1;

                const element = {
                    type: 'image',
                    img,
                    x: x - (img.width * scale) / 2,
                    y: y - (img.height * scale) / 2,
                    width: img.width * scale,
                    height: img.height * scale,
                    aspectRatio: img.width / img.height,
                    dataUrl: imageSource
                };

                this.elements.push(element);
                this.selectedElements = [element];
                this.render();
                this.updateDockAnalyzeButton();
                this.notifyWhiteboardChanged('image-drop');
                console.log('✅ Image dropped on whiteboard');
                resolve(true);
            };

            img.onerror = () => {
                console.warn('⚠️ Failed to load dropped chat image');
                resolve(false);
            };

            img.src = imageSource;
        });
    }
    
    getElements() {
        // Return serializable version of elements (without img objects)
        return this.elements.map(el => {
            if (el.type === 'image') {
                return {
                    type: el.type,
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    aspectRatio: el.aspectRatio,
                    dataUrl: el.dataUrl
                };
            }
            return { ...el };
        });
    }
    
    loadElements(elements) {
        this.elements = [];
        this.selectedElements = [];
        
        elements.forEach(el => {
            if (el.type === 'image') {
                const img = new Image();
                img.onload = () => {
                    this.elements.push({
                        ...el,
                        img: img
                    });
                    this.render();
                };
                img.src = el.dataUrl;
            } else {
                const normalized = { ...el };
                if (normalized.type === 'text' && (!normalized.fillColor || normalized.fillColor === 'rgba(255, 255, 255, 0.94)')) {
                    normalized.fillColor = this.textBoxFillColor;
                }
                this.elements.push(normalized);
            }
        });
        
        this.render();
        this.updateDockAnalyzeButton();
        console.log(`✅ Loaded ${elements.length} elements`);
    }
    
    finalizeArrow(endX, endY) {
        if (!this.arrowStartPoint) return;
        
        const startSnap = this.findSnapPoint(this.arrowStartPoint.x, this.arrowStartPoint.y);
        const endSnap = this.findSnapPoint(endX, endY);
        
        // Calculate midpoint for control point
        const midX = (startSnap.x + endSnap.x) / 2;
        const midY = (startSnap.y + endSnap.y) / 2;
        
        // Store proportional offsets (0-1 range) from attached elements
        let startOffsetX = 0, startOffsetY = 0;
        let endOffsetX = 0, endOffsetY = 0;
        
        if (startSnap.element) {
            // Store as proportions of element width/height
            startOffsetX = (startSnap.x - startSnap.element.x) / startSnap.element.width;
            startOffsetY = (startSnap.y - startSnap.element.y) / startSnap.element.height;
        }
        if (endSnap.element) {
            endOffsetX = (endSnap.x - endSnap.element.x) / endSnap.element.width;
            endOffsetY = (endSnap.y - endSnap.element.y) / endSnap.element.height;
        }
        
        const arrow = {
            type: 'arrow',
            startX: startSnap.x,
            startY: startSnap.y,
            endX: endSnap.x,
            endY: endSnap.y,
            controlX: midX,
            controlY: midY,
            controlManuallyAdjusted: false,
            startElement: startSnap.element,
            endElement: endSnap.element,
            startOffsetX: startOffsetX,
            startOffsetY: startOffsetY,
            endOffsetX: endOffsetX,
            endOffsetY: endOffsetY,
            strokeColor: '#667eea',
            strokeWidth: 2
        };
        
        this.elements.push(arrow);
        this.isDrawingArrow = false;
        this.arrowStartPoint = null;
        this.temporaryArrowEnd = null;
        this.activeTool = null;
        this.canvas.style.cursor = 'default';
        this.render();
        this.notifyWhiteboardChanged('arrow-add');
    }
    
    addArrowAtCenter() {
        const viewportCenterX = (window.innerWidth / 2 - this.offsetX) / this.scale;
        const viewportCenterY = (window.innerHeight / 2 - this.offsetY) / this.scale;
        this.addArrowAt(viewportCenterX, viewportCenterY);
    }

    addArrowAt(centerX, centerY) {
        
        const arrowLength = 150;
        const startX = centerX - arrowLength / 2;
        const startY = centerY;
        const endX = centerX + arrowLength / 2;
        const endY = centerY;
        
        const arrow = {
            type: 'arrow',
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            controlX: centerX,
            controlY: centerY,
            controlManuallyAdjusted: false,
            startElement: null,
            endElement: null,
            startOffsetX: 0,
            startOffsetY: 0,
            endOffsetX: 0,
            endOffsetY: 0,
            strokeColor: '#667eea',
            strokeWidth: 2
        };
        
        this.elements.push(arrow);
        this.selectedElements = [arrow];
        this.render();
        this.updateDockAnalyzeButton();
        this.notifyWhiteboardChanged('arrow-add');
        return arrow;
    }

    getCanvasPointFromClient(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        return {
            x: (mouseX - this.offsetX) / this.scale,
            y: (mouseY - this.offsetY) / this.scale
        };
    }

    addDockToolAtPoint(tool, x, y) {
        if (tool === 'square' || tool === 'circle') {
            this.addShapeAt(tool, x, y);
            return;
        }

        if (tool === 'arrow') {
            this.addArrowAt(x, y);
            return;
        }

        if (tool === 'text') {
            const textElement = this.addTextAt(x, y);
            setTimeout(() => this.startTextEditing(textElement), 100);
        }
    }
    
    findSnapPoint(x, y) {
        const snapDistance = 20 / this.scale;
        
        for (const element of this.elements) {
            if (element.type === 'arrow') continue;
            
            const snapPoints = this.getSnapPoints(element);
            for (const point of snapPoints) {
                const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                if (dist < snapDistance) {
                    return { x: point.x, y: point.y, element: element };
                }
            }
        }
        
        return { x, y, element: null };
    }
    
    getSnapPoints(element) {
        if (!element.width || !element.height) return [];
        
        return [
            { x: element.x, y: element.y }, // top-left
            { x: element.x + element.width / 2, y: element.y }, // top-middle
            { x: element.x + element.width, y: element.y }, // top-right
            { x: element.x, y: element.y + element.height / 2 }, // middle-left
            { x: element.x + element.width / 2, y: element.y + element.height / 2 }, // center
            { x: element.x + element.width, y: element.y + element.height / 2 }, // middle-right
            { x: element.x, y: element.y + element.height }, // bottom-left
            { x: element.x + element.width / 2, y: element.y + element.height }, // bottom-middle
            { x: element.x + element.width, y: element.y + element.height } // bottom-right
        ];
    }
    
    updateCursor(canvasX, canvasY) {
        const hoveredElement = this.getElementAtPoint(canvasX, canvasY);
        
        if (hoveredElement) {
            // Check for arrow handles
            if (hoveredElement.type === 'arrow' && this.selectedElements.includes(hoveredElement)) {
                // Check control point first
                const controlHandle = this.getArrowControlHandle(hoveredElement, canvasX, canvasY);
                if (controlHandle) {
                    this.canvas.style.cursor = 'move';
                    return;
                }
                
                // Check endpoint handles
                const endpointHandle = this.getArrowEndpointHandle(hoveredElement, canvasX, canvasY);
                if (endpointHandle) {
                    this.canvas.style.cursor = 'crosshair';
                    return;
                }
                
                // If arrow but not on a handle, show pointer cursor
                this.canvas.style.cursor = 'pointer';
                return;
            }
            
            // If hovering over arrow (not selected), show pointer
            if (hoveredElement.type === 'arrow') {
                this.canvas.style.cursor = 'pointer';
                return;
            }
            
            const handle = this.getResizeHandle(hoveredElement, canvasX, canvasY);
            if (handle) {
                const cursors = {
                    'nw': 'nw-resize',
                    'ne': 'ne-resize',
                    'sw': 'sw-resize',
                    'se': 'se-resize',
                    'n': 'ns-resize',
                    's': 'ns-resize',
                    'e': 'ew-resize',
                    'w': 'ew-resize'
                };
                this.canvas.style.cursor = cursors[handle] || 'default';
            } else {
                this.canvas.style.cursor = 'move';
            }
        } else {
            this.canvas.style.cursor = this.activeTool === 'arrow' ? 'crosshair' : 'default';
        }
    }
    
    getElementAtPoint(x, y) {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];
            if (el.type === 'arrow') {
                // Check if click is near control point, endpoints, or curve body
                const controlDist = Math.sqrt((x - el.controlX) ** 2 + (y - el.controlY) ** 2);
                const startDist = Math.sqrt((x - el.startX) ** 2 + (y - el.startY) ** 2);
                const endDist = Math.sqrt((x - el.endX) ** 2 + (y - el.endY) ** 2);
                const handleSize = 15 / this.scale;
                
                // Check handles first (larger hit area)
                if (controlDist < handleSize || startDist < handleSize || endDist < handleSize) {
                    return el;
                }
                
                // Then check if point is near curved arrow body
                const dist = this.distanceToCurve(x, y, el.startX, el.startY, el.controlX, el.controlY, el.endX, el.endY);
                if (dist < 10 / this.scale) return el;
            } else if (el.type === 'image') {
                if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
                    return el;
                }
            } else {
                if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
                    return el;
                }
            }
        }
        return null;
    }
    
    distanceToCurve(px, py, x0, y0, cx, cy, x1, y1) {
        // Sample points along the quadratic curve and find minimum distance
        let minDist = Infinity;
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            // Quadratic bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
            const qx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
            const qy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
            
            const dx = px - qx;
            const dy = py - qy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist) {
                minDist = dist;
            }
        }
        
        return minDist;
    }
    
    curveIntersectsRect(x0, y0, cx, cy, x1, y1, minX, minY, maxX, maxY) {
        // Sample points along the curve and check if any are inside the rectangle
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const qx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
            const qy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
            
            if (qx >= minX && qx <= maxX && qy >= minY && qy <= maxY) {
                return true;
            }
        }
        
        return false;
    }
    
    distanceToLine(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq != 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    lineIntersectsRect(x1, y1, x2, y2, minX, minY, maxX, maxY) {
        // Check if either endpoint is inside the rectangle
        if ((x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) ||
            (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY)) {
            return true;
        }
        
        // Check if line intersects with any of the rectangle's edges
        const rectLines = [
            { x1: minX, y1: minY, x2: maxX, y2: minY }, // top
            { x1: maxX, y1: minY, x2: maxX, y2: maxY }, // right
            { x1: maxX, y1: maxY, x2: minX, y2: maxY }, // bottom
            { x1: minX, y1: maxY, x2: minX, y2: minY }  // left
        ];
        
        for (let edge of rectLines) {
            if (this.linesIntersect(x1, y1, x2, y2, edge.x1, edge.y1, edge.x2, edge.y2)) {
                return true;
            }
        }
        
        return false;
    }
    
    linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom === 0) return false;
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    
    getResizeHandle(element, x, y) {
        if (this.selectedElements.length === 0 || !this.selectedElements.includes(element)) return null;
        if (element.type === 'arrow') return null;
        
        const handleSize = 12 / this.scale;
        let handles;
        
        if (this.selectedElements.length > 1) {
            const bbox = this.getSelectionBoundingBox();
            handles = {
                'nw': { x: bbox.minX, y: bbox.minY },
                'ne': { x: bbox.maxX, y: bbox.minY },
                'sw': { x: bbox.minX, y: bbox.maxY },
                'se': { x: bbox.maxX, y: bbox.maxY },
                'n': { x: bbox.minX + bbox.width / 2, y: bbox.minY },
                's': { x: bbox.minX + bbox.width / 2, y: bbox.maxY },
                'e': { x: bbox.maxX, y: bbox.minY + bbox.height / 2 },
                'w': { x: bbox.minX, y: bbox.minY + bbox.height / 2 }
            };
        } else {
            handles = {
                'nw': { x: element.x, y: element.y },
                'ne': { x: element.x + element.width, y: element.y },
                'sw': { x: element.x, y: element.y + element.height },
                'se': { x: element.x + element.width, y: element.y + element.height },
                'n': { x: element.x + element.width / 2, y: element.y },
                's': { x: element.x + element.width / 2, y: element.y + element.height },
                'e': { x: element.x + element.width, y: element.y + element.height / 2 },
                'w': { x: element.x, y: element.y + element.height / 2 }
            };
        }
        
        for (const [name, pos] of Object.entries(handles)) {
            if (Math.abs(x - pos.x) < handleSize && Math.abs(y - pos.y) < handleSize) {
                return name;
            }
        }
        return null;
    }
    
    getArrowEndpointHandle(arrow, x, y) {
        if (arrow.type !== 'arrow') return null;
        
        const handleSize = 12 / this.scale;
        
        // Check start point
        if (Math.abs(x - arrow.startX) < handleSize && Math.abs(y - arrow.startY) < handleSize) {
            return 'start';
        }
        
        // Check end point
        if (Math.abs(x - arrow.endX) < handleSize && Math.abs(y - arrow.endY) < handleSize) {
            return 'end';
        }
        
        return null;
    }
    
    getArrowControlHandle(arrow, x, y) {
        if (arrow.type !== 'arrow') return null;
        
        const handleSize = 15 / this.scale; // Larger hit area for easier clicking
        
        // Check control point
        if (Math.abs(x - arrow.controlX) < handleSize && Math.abs(y - arrow.controlY) < handleSize) {
            return 'control';
        }
        
        return null;
    }
    
    updateAttachedArrows() {
        this.elements.forEach(el => {
            if (el.type === 'arrow') {
                let updated = false;
                
                // Update start point if attached to a moving/resizing element
                if (el.startElement) {
                    const startEl = this.elements.find(e => e === el.startElement);
                    if (startEl && this.selectedElements.includes(startEl)) {
                        // Use proportional offset to maintain snap point during move/resize
                        el.startX = startEl.x + (el.startOffsetX || 0) * startEl.width;
                        el.startY = startEl.y + (el.startOffsetY || 0) * startEl.height;
                        updated = true;
                    }
                }
                
                // Update end point if attached to a moving/resizing element
                if (el.endElement) {
                    const endEl = this.elements.find(e => e === el.endElement);
                    if (endEl && this.selectedElements.includes(endEl)) {
                        // Use proportional offset to maintain snap point during move/resize
                        el.endX = endEl.x + (el.endOffsetX || 0) * endEl.width;
                        el.endY = endEl.y + (el.endOffsetY || 0) * endEl.height;
                        updated = true;
                    }
                }
                
                // If arrow was updated and control point hasn't been manually adjusted, keep it straight
                if (updated && !el.controlManuallyAdjusted) {
                    el.controlX = (el.startX + el.endX) / 2;
                    el.controlY = (el.startY + el.endY) / 2;
                }
            }
        });
    }
    
    getSelectionBoundingBox() {
        if (this.selectedElements.length === 0) return null;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.selectedElements.forEach(el => {
            if (el.type === 'arrow') return;
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        });
        
        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }
    
    deleteSelectedElements() {
        this.selectedElements.forEach(selectedEl => {
            const index = this.elements.indexOf(selectedEl);
            if (index > -1) {
                this.elements.splice(index, 1);
            }
        });
        
        this.selectedElements = [];
        this.render();
        this.updateDockAnalyzeButton();
        this.notifyWhiteboardChanged('delete');
    }
    
    resizeElement(element, mouseX, mouseY) {
        const prevWidth = Math.max(1, element.width || 1);
        const prevHeight = Math.max(1, element.height || 1);
        const prevFontSize = element.fontSize || 16;
        const minSize = 50;
        const maintainAspectRatio = (!this.isShiftPressed && element.type === 'image') || element.type === 'text';
        const aspectRatio = element.aspectRatio || (element.width / element.height);
        
        if (this.resizeHandle === 'se') {
            const newWidth = Math.max(minSize, mouseX - element.x);
            const newHeight = maintainAspectRatio ? newWidth / aspectRatio : Math.max(minSize, mouseY - element.y);
            element.width = newWidth;
            element.height = newHeight;
        } else if (this.resizeHandle === 'sw') {
            const newWidth = Math.max(minSize, element.x + element.width - mouseX);
            const newHeight = maintainAspectRatio ? newWidth / aspectRatio : Math.max(minSize, mouseY - element.y);
            element.x = element.x + element.width - newWidth;
            element.width = newWidth;
            element.height = newHeight;
        } else if (this.resizeHandle === 'ne') {
            const newWidth = Math.max(minSize, mouseX - element.x);
            const newHeight = maintainAspectRatio ? newWidth / aspectRatio : Math.max(minSize, element.y + element.height - mouseY);
            if (!maintainAspectRatio) {
                element.y = element.y + element.height - newHeight;
            }
            element.width = newWidth;
            element.height = newHeight;
            if (maintainAspectRatio) {
                element.y = element.y + (element.height - newHeight);
            }
        } else if (this.resizeHandle === 'nw') {
            const newWidth = Math.max(minSize, element.x + element.width - mouseX);
            const newHeight = maintainAspectRatio ? newWidth / aspectRatio : Math.max(minSize, element.y + element.height - mouseY);
            element.x = element.x + element.width - newWidth;
            element.y = element.y + element.height - newHeight;
            element.width = newWidth;
            element.height = newHeight;
        } else if (this.resizeHandle === 'n') {
            // North edge - resize height from top
            const newHeight = Math.max(minSize, element.y + element.height - mouseY);
            element.y = element.y + element.height - newHeight;
            element.height = newHeight;
        } else if (this.resizeHandle === 's') {
            // South edge - resize height from bottom
            const newHeight = Math.max(minSize, mouseY - element.y);
            element.height = newHeight;
        } else if (this.resizeHandle === 'e') {
            // East edge - resize width from right
            const newWidth = Math.max(minSize, mouseX - element.x);
            element.width = newWidth;
        } else if (this.resizeHandle === 'w') {
            // West edge - resize width from left
            const newWidth = Math.max(minSize, element.x + element.width - mouseX);
            element.x = element.x + element.width - newWidth;
            element.width = newWidth;
        }

        if (element.type === 'text' && this.isShiftPressed) {
            const widthScale = element.width / prevWidth;
            const heightScale = element.height / prevHeight;
            let fontScale = Math.min(widthScale, heightScale);

            if (this.resizeHandle === 'n' || this.resizeHandle === 's') {
                fontScale = heightScale;
            } else if (this.resizeHandle === 'e' || this.resizeHandle === 'w') {
                fontScale = widthScale;
            }

            element.fontSize = Math.max(10, Math.min(120, prevFontSize * fontScale));
        }
    }
    
    resizeMultipleElements(mouseX, mouseY) {
        if (!this.resizeBoundingBox || this.dragElementData.length === 0) return;
        
        const bbox = this.resizeBoundingBox;
        let newWidth = bbox.width;
        let newHeight = bbox.height;
        let scaleX = 1;
        let scaleY = 1;
        let anchorX = bbox.minX;
        let anchorY = bbox.minY;
        
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
        } else if (this.resizeHandle === 'n') {
            newHeight = Math.max(50, bbox.maxY - mouseY);
            anchorX = bbox.minX;
            anchorY = bbox.maxY;
        } else if (this.resizeHandle === 's') {
            newHeight = Math.max(50, mouseY - bbox.minY);
            anchorX = bbox.minX;
            anchorY = bbox.minY;
        } else if (this.resizeHandle === 'e') {
            newWidth = Math.max(50, mouseX - bbox.minX);
            anchorX = bbox.minX;
            anchorY = bbox.minY;
        } else if (this.resizeHandle === 'w') {
            newWidth = Math.max(50, bbox.maxX - mouseX);
            anchorX = bbox.maxX;
            anchorY = bbox.minY;
        }
        
        scaleX = newWidth / bbox.width;
        scaleY = newHeight / bbox.height;
        
        if (!this.isShiftPressed) {
            const scale = Math.min(scaleX, scaleY);
            scaleX = scale;
            scaleY = scale;
        }
        
        this.dragElementData.forEach(data => {
            const relX = data.startX - bbox.minX;
            const relY = data.startY - bbox.minY;
            
            data.element.width = data.startWidth * scaleX;
            data.element.height = data.startHeight * scaleY;
            data.element.x = anchorX + (relX - (anchorX - bbox.minX)) * scaleX;
            data.element.y = anchorY + (relY - (anchorY - bbox.minY)) * scaleY;

            if (data.element.type === 'text' && this.isShiftPressed) {
                let fontScale = Math.min(scaleX, scaleY);
                if (this.resizeHandle === 'n' || this.resizeHandle === 's') {
                    fontScale = scaleY;
                } else if (this.resizeHandle === 'e' || this.resizeHandle === 'w') {
                    fontScale = scaleX;
                }
                data.element.fontSize = Math.max(10, Math.min(120, data.startFontSize * fontScale));
            }
        });
    }
    
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const viewportCenterX = (window.innerWidth / 2 - this.offsetX) / this.scale;
                const viewportCenterY = (window.innerHeight / 2 - this.offsetY) / this.scale;
                
                const maxWidth = 400;
                const scale = img.width > maxWidth ? maxWidth / img.width : 1;
                
                this.elements.push({
                    type: 'image',
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
                this.notifyWhiteboardChanged('image-upload');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }
    
    handlePaste(e) {
        if (e.target?.closest?.('.chat-window')) {
            return;
        }

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
                        const viewportCenterX = (window.innerWidth / 2 - this.offsetX) / this.scale;
                        const viewportCenterY = (window.innerHeight / 2 - this.offsetY) / this.scale;
                        
                        const maxWidth = 400;
                        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
                        
                        this.elements.push({
                            type: 'image',
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
                        this.notifyWhiteboardChanged('image-paste');
                        console.log('✅ Image pasted to whiteboard');
                    };
                    img.src = event.target.result;
                };
                
                reader.readAsDataURL(blob);
                break;
            }
        }
    }
    
    analyzeSelectedElements() {
        const images = this.selectedElements.filter(el => el.type === 'image' && el.dataUrl);
        if (images.length === 0) return;
        
        const imageDataUrls = images.map(img => img.dataUrl);
        window.sendImageToChat(imageDataUrls);
    }
    
    updateDockAnalyzeButton() {
        const btn = document.getElementById('dockAnalyzeBtn');
        const imageCount = this.selectedElements.filter(el => el.type === 'image').length;
        
        if (imageCount > 0) {
            btn.disabled = false;
            btn.title = imageCount === 1 ? 'Analyze selected image' : `Analyze ${imageCount} selected images`;
        } else {
            btn.disabled = true;
            btn.title = 'Select an image to analyze';
        }

        this.updateTextAlignmentControls();
    }

    isTextCapableElement(element) {
        return element && (element.type === 'text' || element.type === 'square' || element.type === 'circle');
    }

    applyTextAlignment(alignment) {
        let targets = this.selectedElements.filter(el => this.isTextCapableElement(el));

        if (targets.length === 0 && this.editingElement && this.isTextCapableElement(this.editingElement)) {
            targets = [this.editingElement];
        }

        if (targets.length === 0) return;

        targets.forEach(el => {
            el.textAlign = alignment;
        });

        if (this.textInput && this.editingElement && targets.includes(this.editingElement)) {
            this.textInput.style.textAlign = alignment;
        }

        this.render();
        this.updateTextAlignmentControls();
        this.notifyWhiteboardChanged('text-align');
    }

    updateTextAlignmentControls() {
        if (!this.textAlignToolbar) return;

        const alignButtons = Array.from(this.textAlignToolbar.querySelectorAll('.text-align-btn'));

        const textSelection = this.selectedElements.filter(el => this.isTextCapableElement(el));
        const hasEditableText = textSelection.length > 0 || (this.editingElement && this.isTextCapableElement(this.editingElement));

        let activeAlignment = null;
        if (textSelection.length > 0) {
            const alignments = textSelection.map(el => el.textAlign || 'left');
            const first = alignments[0];
            if (alignments.every(a => a === first)) {
                activeAlignment = first;
            }
        } else if (this.editingElement && this.isTextCapableElement(this.editingElement)) {
            activeAlignment = this.editingElement.textAlign || 'left';
        }

        if (hasEditableText) {
            const bbox = this.getTextControlsBoundingBox();
            if (bbox) {
                const centerX = ((bbox.minX + bbox.maxX) / 2) * this.scale + this.offsetX;
                const topY = bbox.minY * this.scale + this.offsetY;
                this.textAlignToolbar.style.left = `${centerX}px`;
                this.textAlignToolbar.style.top = `${topY - 10}px`;
                this.textAlignToolbar.classList.add('show');
            }
        } else {
            this.textAlignToolbar.classList.remove('show');
        }

        alignButtons.forEach((button) => {
            const alignment = button.dataset.align;
            button.disabled = !hasEditableText;
            button.classList.toggle('active', hasEditableText && alignment === activeAlignment);
        });
    }

    updateImageActionToolbar() {
        if (!this.imageActionToolbar) return;

        const selectedImages = this.getSelectedImages();
        if (selectedImages.length === 0) {
            this.imageActionToolbar.classList.remove('show');
            this.hideRemixMenu();
            return;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        selectedImages.forEach((el) => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
        });

        const centerX = ((minX + maxX) / 2) * this.scale + this.offsetX;
        const topY = minY * this.scale + this.offsetY;

        this.imageActionToolbar.style.left = `${centerX}px`;
        this.imageActionToolbar.style.top = `${topY - 12}px`;
        this.imageActionToolbar.classList.add('show');
    }

    getTextControlsBoundingBox() {
        const textSelection = this.selectedElements.filter(el => this.isTextCapableElement(el));
        const targets = textSelection.length > 0
            ? textSelection
            : (this.editingElement && this.isTextCapableElement(this.editingElement) ? [this.editingElement] : []);

        if (targets.length === 0) return null;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        targets.forEach((el) => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        });

        return { minX, minY, maxX, maxY };
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
        
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoom));
        
        if (newScale === this.scale) return;
        
        const mouseXCanvas = mouseX;
        const mouseYCanvas = mouseY;
        
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
        
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.save();
        
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        
        this.drawGrid(ctx, rect.width, rect.height);
        
        // Draw all elements
        this.elements.forEach(el => {
            this.drawElement(ctx, el);
        });

        // Draw dock-drag ghost preview at cursor position
        if (this.dockPreviewTool && this.dockPreviewPoint) {
            this.drawDockDropPreview(ctx, this.dockPreviewTool, this.dockPreviewPoint.x, this.dockPreviewPoint.y);
        }
        
        // Draw temporary arrow while creating
        if (this.isDrawingArrow && this.arrowStartPoint && this.temporaryArrowEnd) {
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2 / this.scale;
            ctx.setLineDash([5 / this.scale, 5 / this.scale]);
            ctx.beginPath();
            ctx.moveTo(this.arrowStartPoint.x, this.arrowStartPoint.y);
            ctx.lineTo(this.temporaryArrowEnd.x, this.temporaryArrowEnd.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Show snap points
            const snapPoint = this.findSnapPoint(this.temporaryArrowEnd.x, this.temporaryArrowEnd.y);
            if (snapPoint.element) {
                ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
                ctx.beginPath();
                ctx.arc(snapPoint.x, snapPoint.y, 8 / this.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw selection UI
        if (this.selectedElements.length > 0) {
            this.drawSelectionUI(ctx);
        }
        
        // Draw selection rectangle (marquee selection)
        if (this.isSelectingArea && this.selectionStart && this.selectionEnd) {
            const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
            const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
            const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
            const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);
            
            ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
            ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
            
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2 / this.scale;
            ctx.setLineDash([5 / this.scale, 3 / this.scale]);
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
        this.updateTextAlignmentControls();
        this.updateImageActionToolbar();
    }

    drawDockDropPreview(ctx, tool, centerX, centerY) {
        ctx.save();
        ctx.strokeStyle = 'rgba(79, 102, 211, 0.9)';
        ctx.fillStyle = 'rgba(102, 126, 234, 0.14)';
        ctx.lineWidth = 2 / this.scale;
        ctx.setLineDash([6 / this.scale, 4 / this.scale]);

        if (tool === 'square') {
            const size = 150;
            ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
            ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
        } else if (tool === 'circle') {
            const radius = 75;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (tool === 'text') {
            const width = 150;
            const height = 30;
            const x = centerX - width / 2;
            const y = centerY - height / 2;
            ctx.strokeRect(x, y, width, height);
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(79, 102, 211, 0.7)';
            ctx.font = `${Math.max(10, 12 / this.scale)}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Text', centerX, centerY);
            ctx.restore();
            return;
        } else if (tool === 'arrow') {
            const length = 150;
            const startX = centerX - length / 2;
            const endX = centerX + length / 2;
            const y = centerY;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();

            const headLength = 14;
            ctx.beginPath();
            ctx.moveTo(endX, y);
            ctx.lineTo(endX - headLength, y - headLength * 0.6);
            ctx.moveTo(endX, y);
            ctx.lineTo(endX - headLength, y + headLength * 0.6);
            ctx.stroke();
        }

        ctx.restore();
    }
    
    drawElement(ctx, el) {
        if (el.type === 'image') {
            ctx.drawImage(el.img, el.x, el.y, el.width, el.height);
        } else if (el.type === 'square') {
            ctx.fillStyle = el.fillColor;
            ctx.fillRect(el.x, el.y, el.width, el.height);
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth / this.scale;
            ctx.strokeRect(el.x, el.y, el.width, el.height);
            
            // Only draw text if not being edited
            if (el.text && this.editingElement !== el) {
                this.drawText(ctx, el);
            }
        } else if (el.type === 'circle') {
            ctx.fillStyle = el.fillColor;
            ctx.beginPath();
            ctx.arc(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth / this.scale;
            ctx.stroke();
            
            // Only draw text if not being edited
            if (el.text && this.editingElement !== el) {
                this.drawText(ctx, el);
            }
        } else if (el.type === 'text') {
            // Skip rendering if this element is being edited
            if (this.editingElement === el) {
                return;
            }

            const radius = Math.min(12, Math.min(el.width, el.height) / 4);
            this.drawRoundedRectPath(ctx, el.x, el.y, el.width, el.height, radius);
            ctx.fillStyle = el.fillColor || this.textBoxFillColor;
            ctx.fill();

            ctx.strokeStyle = el.strokeColor || 'rgba(125, 146, 224, 0.7)';
            ctx.lineWidth = (el.strokeWidth || 1) / this.scale;
            ctx.stroke();
            
            // Draw placeholder box for empty or selected text elements
            if (!el.text || this.selectedElements.includes(el)) {
                if (!el.text) {
                    ctx.strokeStyle = 'rgba(102, 126, 234, 0.32)';
                    ctx.lineWidth = 1 / this.scale;
                    ctx.setLineDash([4 / this.scale, 3 / this.scale]);
                    this.drawRoundedRectPath(ctx, el.x + 1 / this.scale, el.y + 1 / this.scale, el.width - 2 / this.scale, el.height - 2 / this.scale, Math.max(8, radius - 2));
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                
                // Show placeholder text if empty
                if (!el.text) {
                    ctx.fillStyle = 'rgba(88, 104, 165, 0.55)';
                    const placeholderFontSize = Math.max(11, Math.min(14, el.height * 0.32));
                    ctx.font = `500 ${placeholderFontSize}px Arial, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Double-click to type', el.x + el.width / 2, el.y + el.height / 2);
                }
            }
            
            if (el.text) {
                this.drawText(ctx, el);
            }
        } else if (el.type === 'arrow') {
            this.drawArrow(ctx, el);
        }
    }
    
    drawText(ctx, el) {
        const padding = 8;
        const textAreaWidth = Math.max(1, el.width - padding * 2);
        const textAreaHeight = Math.max(1, el.height - padding * 2);
        const fontSize = Math.max(10, Math.min(120, el.fontSize || 16));
        const textAlign = el.textAlign || 'left';

        ctx.font = `${fontSize}px Arial, sans-serif`;
        const wrappedLines = this.wrapTextLines(ctx, el.text || '', textAreaWidth);
        const lineHeight = Math.round(fontSize * 1.25);

        ctx.save();
        ctx.beginPath();
        ctx.rect(el.x, el.y, el.width, el.height);
        ctx.clip();

        ctx.fillStyle = '#333';
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textBaseline = 'top';

        const maxLines = Math.max(1, Math.floor(textAreaHeight / lineHeight));
        const linesToDraw = wrappedLines.slice(0, maxLines);
        const isOverflowing = wrappedLines.length > maxLines;
        let drawY = el.y + padding;

        linesToDraw.forEach((line, index) => {
            const isLastVisibleLine = index === linesToDraw.length - 1;
            this.drawAlignedTextLine(ctx, line, el.x + padding, drawY, textAreaWidth, textAlign, isLastVisibleLine);
            drawY += lineHeight;
        });

        if (isOverflowing) {
            const fadeHeight = Math.min(24, Math.max(14, lineHeight));
            const fadeTop = el.y + el.height - fadeHeight;
            const fadeGradient = ctx.createLinearGradient(0, fadeTop, 0, el.y + el.height);
            fadeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            fadeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.92)');

            ctx.fillStyle = fadeGradient;
            ctx.fillRect(el.x + 1, fadeTop, Math.max(0, el.width - 2), fadeHeight);

            ctx.fillStyle = 'rgba(51, 51, 51, 0.75)';
            ctx.font = `${Math.max(10, fontSize * 0.95)}px Arial, sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('...', el.x + el.width - padding, el.y + el.height - 4);
        }

        ctx.restore();
    }

    drawRoundedRectPath(ctx, x, y, width, height, radius) {
        const r = Math.max(0, Math.min(radius, width / 2, height / 2));
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    drawAlignedTextLine(ctx, line, x, y, maxWidth, align, isLastLine) {
        if (!line) return;

        if (align === 'right') {
            ctx.textAlign = 'right';
            ctx.fillText(line, x + maxWidth, y);
            return;
        }

        if (align === 'center') {
            ctx.textAlign = 'center';
            ctx.fillText(line, x + maxWidth / 2, y);
            return;
        }

        if (align === 'justify' && !isLastLine) {
            const words = line.split(' ').filter(Boolean);
            if (words.length > 1) {
                const wordsWidth = words.reduce((sum, word) => sum + ctx.measureText(word).width, 0);
                const gapWidth = (maxWidth - wordsWidth) / (words.length - 1);
                let cursorX = x;

                ctx.textAlign = 'left';
                words.forEach((word, idx) => {
                    ctx.fillText(word, cursorX, y);
                    if (idx < words.length - 1) {
                        cursorX += ctx.measureText(word).width + gapWidth;
                    }
                });
                return;
            }
        }

        ctx.textAlign = 'left';
        ctx.fillText(line, x, y);
    }

    wrapTextLines(ctx, text, maxWidth) {
        const lines = [];
        const paragraphs = String(text || '').split('\n');

        const splitLongWord = (word) => {
            const chunks = [];
            let chunk = '';

            for (const char of word) {
                const test = chunk + char;
                if (ctx.measureText(test).width <= maxWidth || chunk.length === 0) {
                    chunk = test;
                } else {
                    chunks.push(chunk);
                    chunk = char;
                }
            }

            if (chunk) {
                chunks.push(chunk);
            }

            return chunks;
        };

        paragraphs.forEach((paragraph, paragraphIndex) => {
            const words = paragraph.split(/\s+/).filter(Boolean);

            if (words.length === 0) {
                lines.push('');
            } else {
                const normalizedWords = [];
                words.forEach((word) => {
                    if (ctx.measureText(word).width > maxWidth) {
                        normalizedWords.push(...splitLongWord(word));
                    } else {
                        normalizedWords.push(word);
                    }
                });

                let currentLine = normalizedWords[0];

                for (let i = 1; i < normalizedWords.length; i++) {
                    const testLine = `${currentLine} ${normalizedWords[i]}`;
                    if (ctx.measureText(testLine).width <= maxWidth) {
                        currentLine = testLine;
                    } else {
                        lines.push(currentLine);
                        currentLine = normalizedWords[i];
                    }
                }

                lines.push(currentLine);
            }

            if (paragraphIndex < paragraphs.length - 1) {
                lines.push('');
            }
        });

        return lines.length ? lines : [''];
    }
    
    drawArrow(ctx, arrow) {
        ctx.strokeStyle = arrow.strokeColor;
        ctx.lineWidth = arrow.strokeWidth / this.scale;
        
        // Draw curved arrow using quadratic curve
        ctx.beginPath();
        ctx.moveTo(arrow.startX, arrow.startY);
        ctx.quadraticCurveTo(arrow.controlX, arrow.controlY, arrow.endX, arrow.endY);
        ctx.stroke();
        
        // Draw arrowhead at the end
        // Calculate the angle at the end point by getting the derivative of the curve
        const t = 0.95; // Sample point near the end
        const prevX = (1 - t) * (1 - t) * arrow.startX + 2 * (1 - t) * t * arrow.controlX + t * t * arrow.endX;
        const prevY = (1 - t) * (1 - t) * arrow.startY + 2 * (1 - t) * t * arrow.controlY + t * t * arrow.endY;
        const angle = Math.atan2(arrow.endY - prevY, arrow.endX - prevX);
        const headLength = 15 / this.scale;
        
        ctx.beginPath();
        ctx.moveTo(arrow.endX, arrow.endY);
        ctx.lineTo(
            arrow.endX - headLength * Math.cos(angle - Math.PI / 6),
            arrow.endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(arrow.endX, arrow.endY);
        ctx.lineTo(
            arrow.endX - headLength * Math.cos(angle + Math.PI / 6),
            arrow.endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }
    
    drawSelectionUI(ctx) {
        if (this.selectedElements.length === 0) return;
        
        // Draw individual selection outlines (excluding arrows)
        this.selectedElements.forEach(el => {
            if (el.type !== 'arrow') {
                ctx.strokeStyle = '#667eea';
                ctx.lineWidth = 2 / this.scale;
                ctx.strokeRect(el.x, el.y, el.width, el.height);
            } else {
                // Highlight selected arrow
                ctx.strokeStyle = 'rgba(102, 126, 234, 0.5)';
                ctx.lineWidth = 6 / this.scale;
                ctx.beginPath();
                ctx.moveTo(el.startX, el.startY);
                ctx.quadraticCurveTo(el.controlX, el.controlY, el.endX, el.endY);
                ctx.stroke();
                
                // Draw arrow endpoint and control handles (larger and more visible)
                const endpointSize = 16 / this.scale;
                const controlSize = 18 / this.scale;
                
                // Draw dashed guide lines first (behind handles)
                ctx.strokeStyle = 'rgba(118, 75, 162, 0.4)';
                ctx.lineWidth = 1.5 / this.scale;
                ctx.setLineDash([5 / this.scale, 5 / this.scale]);
                ctx.beginPath();
                ctx.moveTo(el.startX, el.startY);
                ctx.lineTo(el.controlX, el.controlY);
                ctx.lineTo(el.endX, el.endY);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Start point handle (blue)
                ctx.fillStyle = '#667eea';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 / this.scale;
                ctx.beginPath();
                ctx.arc(el.startX, el.startY, endpointSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // End point handle (blue)
                ctx.beginPath();
                ctx.arc(el.endX, el.endY, endpointSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Control point handle (purple - larger and more prominent)
                ctx.fillStyle = '#764ba2';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 / this.scale;
                ctx.beginPath();
                ctx.arc(el.controlX, el.controlY, controlSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        });
        
        // Draw resize handles for non-arrow elements
        const nonArrowElements = this.selectedElements.filter(el => el.type !== 'arrow');
        if (nonArrowElements.length === 0) return;
        
        const handleSize = 10 / this.scale;
        let handles;
        
        if (nonArrowElements.length > 1) {
            const bbox = this.getSelectionBoundingBox();
            
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3 / this.scale;
            ctx.setLineDash([8 / this.scale, 4 / this.scale]);
            ctx.strokeRect(bbox.minX, bbox.minY, bbox.width, bbox.height);
            ctx.setLineDash([]);
            
            handles = [
                { x: bbox.minX, y: bbox.minY },
                { x: bbox.maxX, y: bbox.minY },
                { x: bbox.minX, y: bbox.maxY },
                { x: bbox.maxX, y: bbox.maxY },
                { x: bbox.minX + bbox.width / 2, y: bbox.minY },
                { x: bbox.minX + bbox.width / 2, y: bbox.maxY },
                { x: bbox.maxX, y: bbox.minY + bbox.height / 2 },
                { x: bbox.minX, y: bbox.minY + bbox.height / 2 }
            ];
        } else {
            const el = nonArrowElements[0];
            handles = [
                { x: el.x, y: el.y },
                { x: el.x + el.width, y: el.y },
                { x: el.x, y: el.y + el.height },
                { x: el.x + el.width, y: el.y + el.height },
                { x: el.x + el.width / 2, y: el.y },
                { x: el.x + el.width / 2, y: el.y + el.height },
                { x: el.x + el.width, y: el.y + el.height / 2 },
                { x: el.x, y: el.y + el.height / 2 }
            ];
        }
        
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
    
    drawGrid(ctx, width, height) {
        const gridSize = 40;
        const gridColor = 'rgba(200, 200, 200, 0.3)';
        
        const startX = Math.floor(-this.offsetX / this.scale / gridSize) * gridSize;
        const startY = Math.floor(-this.offsetY / this.scale / gridSize) * gridSize;
        const endX = startX + (width / this.scale) + gridSize;
        const endY = startY + (height / this.scale) + gridSize;
        
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1 / this.scale;
        
        ctx.beginPath();
        for (let x = startX; x < endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        
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
