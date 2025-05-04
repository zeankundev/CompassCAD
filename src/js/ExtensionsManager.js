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
            // Check for duplicates in tabContent and tabController
            const existingContent = document.getElementById(`${this.codicName}-tabcontent`);
            const existingTab = document.getElementById(`${this.codicName}-tab`);
            
            if (existingContent || existingTab) {
            throw new Error(`A tab with name "${this.name}" already exists.`);
            }

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