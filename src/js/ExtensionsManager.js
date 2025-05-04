// A low-level JavaScript that will expose APIs to be used by any extension

const tabController = document.getElementById('tab-controller');
const tabContent = document.getElementById('inspector-tab-content');

class InspectorTab {
    constructor(name) {
        if (name && typeof name === 'string') {
            this.name = name;
            this.codicName = name.toLowerCase().replace(/\s+/g, '-');
        } else {
            throw new SyntaxError(`Invalid name provided. You should provide a string.`);
        }
    }
    assembleTab(html) {
        if (html && html instanceof HTMLElement) {
            const tab = document.createElement('div');
            tab.className = 'inspector-tabcontent';
            tab.id = `${this.codicName}-tabcontent`;
            tab.appendChild(html);
            tabContent.appendChild(tab);
            const tabButton = document.createElement('button');
            tabButton.classList.add('inspector-tab');
            tabButton.classList.add('disabled');
            tabButton.id = `${this.codicName}-tab`;
            tabButton.innerText = this.name;
            tabButton.onclick = () => {
                openInspectorTab(this.codicName + '-tabcontent');
            }
            tabController.appendChild(tabButton);
        } else if (!html instanceof HTMLElement) {
            throw new Error(`
                You are providing a wrong HTML. Assemble the HTML with HTMLElement, not with stringified HTML.
            `);
        } else {
            throw new Error(`
                Cannot assemble tab. Provide a valid HTML element.
            `);
        }
    }
}