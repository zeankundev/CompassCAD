// This script should be placed inside an HTML file or as part of a larger JS codebase.

// Function to detect the user's OS
function detectOS() {
    const platform = window.navigator.platform.toLowerCase();
    
    if (platform.includes('win')) return 'windows';
    if (platform.includes('linux')) return 'linux';
    if (platform.includes('mac')) return 'mac';

    return 'unknown';
}

// Function to fetch the latest GitHub release
async function fetchLatestRelease(repoOwner, repoName) {
    const apiUrl = `https://api.github.com/repos/zeankundev/CompassCAD/releases/latest`;
    try {
        const response = await fetch(apiUrl);
        const releaseData = await response.json();
        return releaseData;
    } catch (error) {
        console.error('Error fetching the latest release:', error);
        return null;
    }
}

// Function to find the download link based on the OS
function getDownloadLink(releaseData, os) {
    if (!releaseData || !releaseData.assets) return null;

    let fileExtension;
    switch (os) {
        case 'windows':
            fileExtension = '.exe';
            break;
        case 'linux':
            fileExtension = '.AppImage';
            break;
        case 'mac':
            fileExtension = '.dmg';
            break;
        default:
            console.error('Unsupported OS');
            return null;
    }

    const asset = releaseData.assets.find(asset => asset.name.endsWith(fileExtension));
    return asset ? asset.browser_download_url : null;
}

// Main function to execute the logic
async function downloadLatestRelease() {
    const os = detectOS();
    const releaseData = await fetchLatestRelease();
    const downloadLink = getDownloadLink(releaseData, os);

    if (downloadLink) {
        window.location.href = downloadLink;
    } else {
        if (detectOS() == 'mac') {
            alert('SIKE! (just kidding, just wait, there will be a mac build soon)');
        }
    }
}

if (!window.location.href.includes('editor.html')) {
    switch (detectOS()) {
        case 'windows':
            document.getElementById('download-button').innerHTML = `<img src="./assets/images/download.svg">&nbsp;Download for Windows`
            break
        case 'mac':
            document.getElementById('download-button').innerHTML = `<img src="./assets/images/download.svg">&nbsp;Download for Mac`
            break
        case 'linux':
            document.getElementById('download-button').innerHTML = `<img src="./assets/images/download.svg">&nbsp;Download for Linux`
            break
        default:
            document.getElementById('download-button').innerHTML = `<img src="./assets/images/download.svg">&nbsp;nah men u aint getting this`
            break
    }
}