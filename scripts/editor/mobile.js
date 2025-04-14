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
                title: 'New',
                icon: 'assets/editor/newLogic.svg',
                onselect: () => console.log('New file selected')
            },
            {
                title: 'Open',
                icon: 'assets/editor/openLogic.svg',
                onselect: () => console.log('Open file selected')
            },
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
    renderer = new GraphicDisplay('canvas', window.innerWidth, window.innerHeight);
    renderer.displayWidth = window.innerWidth;
    renderer.displayHeight = window.innerHeight;
    await initCAD(renderer);
    renderer.logicDisplay.importJSON(JSON.parse(`[{"active":true,"type":2,"color":"#fff","radius":2,"x1":-300,"y1":-300,"x2":-200,"y2":-200},{"active":true,"type":7,"color":"#eee","radius":5,"x":-299,"y":-323,"text":"Color test","fontSize":24},{"active":true,"type":7,"color":"#eee","radius":5,"x":-297,"y":-168,"text":"This should be white","fontSize":13},{"active":true,"type":2,"color":"#ff0000","radius":2,"x1":-300,"y1":-100,"x2":-200,"y2":0},{"active":true,"type":7,"color":"#ffffff","radius":2,"x":-300.5555555555556,"y":28.85185185185187,"text":"This should be red","fontSize":13},{"active":true,"type":2,"color":"#00ff00","radius":2,"x1":-300,"y1":100,"x2":-200,"y2":200},{"active":true,"type":7,"color":"#eee","radius":5,"x":-300.5555555555556,"y":228.51851851851853,"text":"This should be green","fontSize":13}]`), renderer.logicDisplay.components)
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
});