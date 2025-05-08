const flags = [
    {
        flag: 'enable-old-grid',
        name: 'Enable old grid',
        description: 'Use legacy grid (older than v1.5.0)'
    },
    {
        flag: 'enable-zoom-to-cursor-warping',
        name: 'Enable autocenter zoom warping',
        description: 'Enable cursor-to-center warping while zooming'
    }, 
    {
        flag: 'enable-new-scroll-controls',
        name: 'Enable new scroll controls',
        description: 'Enable new scroll controls, much like Figma\'s'
    },
    {
        flag: 'enable-tutoring-mode',
        name: 'Enable tutoring mode',
        description: 'Enable tutoring mode, which CompassCAD provides tools to create tutorials for others'
    }
]
const updateFlagList = async () => {
    const configHandler = new ConfigHandler();
    await configHandler.loadConfig();
    const flagsContainer = document.getElementById('flags-container');
    const flagHandlerInCode = await configHandler.getFlags();
    flagsContainer.innerHTML = '';
    flags.forEach(flag => {
        const flagChild = document.createElement('div');
        flagChild.title = flag.description;
        flagChild.className = 'flag-child';
        const flagName = document.createElement('label');
        flagName.innerText = flag.name;
        const flagCheck = document.createElement('input');
        flagCheck.type = 'checkbox';
        flagCheck.checked = Array.isArray(flagHandlerInCode) ? flagHandlerInCode.includes(flag.flag) : false;
        flagCheck.onchange = async (e) => {
            const checked = e.target.checked;
            if (checked) {
                await configHandler.appendFlag(flag.flag);
            } else {
                await configHandler.purgeFlag(flag.flag);
                await configHandler.saveConfig();
            }
        }
        flagChild.appendChild(flagName);
        flagChild.appendChild(flagCheck);
        flagsContainer.appendChild(flagChild);
    })
}