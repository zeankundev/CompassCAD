// Miscellaneous functions
class MenuBuilder {
    constructor(menuConfig) {
        this.config = menuConfig;
    }

    createMenu() {
        const menuBar = document.createElement('div');
        menuBar.className = 'menu-bar';
        
        this.config.forEach(menuItem => {
            const menuButton = this.createMenuItem(menuItem);
            menuBar.appendChild(menuButton);
        });
        
        return menuBar;
    }

    createMenuItem(item) {
        const menuButton = document.createElement('div');
        menuButton.className = 'menu-item';
        
        // Create container for icon and text
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'menu-item-content';
        
        // Add icon if exists
        if (item.icon) {
            const icon = document.createElement('img');
            icon.src = item.icon;
            icon.className = 'menu-icon';
            contentWrapper.appendChild(icon);
        }
        
        // Create title element
        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.title;
        contentWrapper.appendChild(titleSpan);
        
        menuButton.appendChild(contentWrapper);
        
        // Create dropdown if contents exist
        if (item.contents && item.contents.length > 0) {
            const dropdown = this.createDropdown(item.contents);
            dropdown.style.display = 'none'; // Hidden by default
            menuButton.appendChild(dropdown);
            
            menuButton.addEventListener('click', () => {
                const isVisible = dropdown.style.display === 'block';
                // Close all other dropdowns first
                document.querySelectorAll('.dropdown').forEach(d => {
                    d.style.display = 'none';
                });
                // Toggle this dropdown
                dropdown.style.display = isVisible ? 'none' : 'block';
            });
        }
        
        return menuButton;
    }

    createDropdown(contents) {
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        
        contents.forEach(item => {
            const dropdownItem = document.createElement('div');
            dropdownItem.className = 'dropdown-item';
            
            // Create container for icon and text in dropdown item
            const itemContent = document.createElement('div');
            itemContent.className = 'dropdown-item-content';
            
            if (item.icon) {
                const icon = document.createElement('img');
                icon.src = item.icon;
                icon.className = 'menu-icon';
                itemContent.appendChild(icon);
            }
            
            const itemText = document.createElement('span');
            itemText.textContent = item.title;
            itemContent.appendChild(itemText);
            
            dropdownItem.appendChild(itemContent);
            
            if (item.onselect) {
                dropdownItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.onselect();
                    // Close dropdown after selection
                    dropdown.style.display = 'none';
                });
            }
            
            dropdown.appendChild(dropdownItem);
        });
        
        return dropdown;
    }
}

const menuConfig = [
    {
        title: 'File',
        contents: [
            {
                title: 'Save',
                icon: 'assets/editor/saveLogic.svg',
                onselect: () => console.log('Save file selected')
            },
            {
                title: 'Export',
                icon: 'assets/editor/export.svg',
                onselect: () => console.log('EXport')
            },
            {
                title: 'Share',
                icon: 'assets/editor/share.svg',
                onselect: () => console.log('Share')
            }
        ]
    },
    {
        title: 'Edit',
        contents: [
            {
                title: 'Undo',
                icon: 'assets/editor/undo.svg',
                onselect: () => console.log('Undo action selected')
            },
            {
                title: 'Redo',
                icon: 'assets/editor/redo.svg',
                onselect: () => console.log('Redo action selected')
            }
        ]
    }
]

const menuBuilder = new MenuBuilder(menuConfig);
const menuBar = menuBuilder.createMenu();
document.getElementById('menu-list').appendChild(menuBar);

let renderer;
$(document).ready(async function() {
    document.getElementById('canvas').width = window.innerWidth;
    document.getElementById('canvas').height = window.innerHeight;
    /** @type {GraphicsRenderer} */
    renderer = new GraphicsRenderer('canvas', window.innerWidth, window.innerHeight);
    renderer.displayWidth = window.innerWidth;
    renderer.displayHeight = window.innerHeight;
    await initCAD(renderer);
    document.getElementById('loading-overlay').style.display = 'none';
    document.getElementById('navigate').onclick = () => {
        console.log('Navigate button clicked');
        renderer.setMode(renderer.MODES.NAVIGATE)
    };

    document.getElementById('move-obj').onclick = () => {
        console.log('Move Object button clicked');
        renderer.setMode(renderer.MODES.MOVE)
    };

    document.getElementById('del-obj').onclick = () => {
        console.log('Delete Object button clicked');
        renderer.setMode(renderer.MODES.DELETE)
    };

    document.getElementById('add-point').onclick = () => {
        console.log('Add Point button clicked');
        renderer.setMode(renderer.MODES.ADDPOINT)
    };

    document.getElementById('add-line').onclick = () => {
        console.log('Add Line button clicked');
        renderer.setMode(renderer.MODES.ADDLINE)
    };

    document.getElementById('add-circle').onclick = () => {
        console.log('Add Circle button clicked');
        renderer.setMode(renderer.MODES.ADDCIRCLE)
    };

    document.getElementById('add-arc').onclick = () => {
        console.log('Add Arc button clicked');
        renderer.setMode(renderer.MODES.ADDARC)
    };

    document.getElementById('add-rect').onclick = () => {
        console.log('Add Rectangle button clicked');
        renderer.setMode(renderer.MODES.ADDRECTANGLE)
    };

    document.getElementById('add-label').onclick = () => {
        console.log('Add Text button clicked');
        renderer.setMode(renderer.MODES.ADDLABEL)
    };
    document.getElementById('add-picture').onclick = () => {
        console.log('Add Picture button clicked');
        renderer.setMode(renderer.MODES.ADDPICTURE)
    };

    document.getElementById('ruler').onclick = () => {
        console.log('Measure button clicked');
        renderer.setMode(renderer.MODES.ADDMEASURE)
    };
    document.getElementById('menu-button').onclick = () => {
        console.log('Clicked!')
        const menuList = document.getElementById('menu-list')
        // Use getComputedStyle to get the actual display value
        const currentDisplay = window.getComputedStyle(menuList).display;
        // Toggle between 'none' and 'block'
        menuList.style.display = currentDisplay === 'none' ? 'block' : 'none';
    }
    document.getElementById('new-design').onclick = () => {
        const workspace = document.getElementById('workspace');
        document.getElementById('design-title').innerText = 'New Design'
        workspace.style.animation = 'slide-from-right-to-full 0.5s ease'
        workspace.style.display = 'block';
        renderer.targetZoom = 1;
        renderer.camX = 0;
        renderer.camY = 0;
        renderer.createNew()
    }
    document.getElementById('back-button').onclick = () => {
        const workspace = document.getElementById('workspace');
        const menuList = document.getElementById('menu-list')
        menuList.style.display = 'none'
        workspace.style.animation = 'slide-from-full-to-right 0.5s ease'
        setTimeout(() => {
            workspace.style.display = 'none'
        }, 500)
    }
    document.getElementById('open-design').onclick = () => {
        const filePicker = document.createElement('input');
        filePicker.type = 'file';
        filePicker.click();
        filePicker.onchange = (e) => {
            document.getElementById('loading-overlay').style.display = 'flex';
            let file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data != null || data != []) {
                        renderer.targetZoom = 1;
                        renderer.camX = 0;
                        renderer.camY = 0;
                        renderer.logicDisplay.importJSON(data, renderer.logicDisplay.components);
                        const workspace = document.getElementById('workspace');
                        document.getElementById('design-title').innerText = file.name.replace(/\.[^/.]+$/, "");
                        workspace.style.animation = 'slide-from-right-to-full 0.5s ease'
                        workspace.style.display = 'block';
                        document.getElementById('loading-overlay').style.display = 'none';
                    }
                } catch (e) {
                    document.getElementById('loading-overlay').style.display = 'none';
                    console.error(e)
                }
            }
        }
    }
});