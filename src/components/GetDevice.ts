export type DeviceType = 'mobile' | 'desktop';

export const getDeviceType = (): DeviceType => {
    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Check if device is iOS or Android
    const isMobileDevice = /android|iphone|ipad|ipod/.test(userAgent);

    // Function to determine if device should be considered mobile based on dimensions
    const isMobileView = (): boolean => {
        // If width is less than height, always consider it mobile
        if (width < height) return true;
        
        // If width is less than 470px, consider it mobile
        if (width < 470) return true;

        // If it's a mobile device but in landscape, consider it desktop
        if (isMobileDevice && width > height) return false;

        return false;
    };

    return isMobileView() ? 'mobile' : 'desktop';
};