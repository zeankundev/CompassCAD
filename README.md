<img src="assets/logos/a-long.svg" width="700" alt="a wordic logo">

**Ay, you want a tutorial on how to use CompassCAD? Go to [this Notion page](https://zeankundev.notion.site/b015debb301d4ca69a1971c235f5d462)!**
# CompassCAD
very good CAD software. plan out buildings, and show it off to your boss.

> [!WARNING]
> Snap-based CompassCAD will be discontinued due to an issue on WSL intterupting the distribution of CompassCAD snap files. Please proceed with downloadingonly either `*.appimage`, `*.deb` or `*.rpm` distribution files.

[![compasscad](https://snapcraft.io/compasscad/badge.svg)](https://snapcraft.io/compasscad)

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/compasscad)

# Stay up to date
- [Official CompassCAD X (formerly Twitter) blog](https://x.com/CompassCAD)

# System requirements
- Windows 10 22H2, macOS El Capitan, Ubuntu 20.04 or up (use electron v22.3.27 to run CompassCAD on Windows 7 (SP1 needed))
- Intel Core(R) Solo U1300 (32bit), Intel Core(R) 2 Duo E7500 or better (CPUs from 2010 or later may guarrantee >100FPS)
- 1GB RAM (2GB for >100FPS)
- 90MB of free space
- 1280x720 or higher

## Tested on:
- Fujitsu Lifebook P1610 Windows 10 (10-20 FPS, barely usable) 
- Lenovo ThinkPad T430 (350-600 FPS, highly usable)

# Official download links
There are a few mirrors which allows you to download CompassCAD. Please download from the official mirrors to avoid getting mislead!
- [Official Github mirror link](https://github.com/zeankundev/CompassCAD/releases/latest)
- [Softpedia](https://www.softpedia.com/get/Science-CAD/CompassCAD.shtml) (windows only, and yes this is official)
- [CompassCAD Sourceforge page](https://sourceforge.net/projects/compasscad/)

# Installation (for amateurs)
To install, you need:
- node v20+
- yarn
- Any machine (except phones, duh.)
## Steps
Git clone this repo:
```
git clone https://github.com/zeankundev/CompassCAD
```
then, install yarn (if haven't done)
```
npm i -g yarn
```
or
```
sudo npm i -g yarn
```
`cd` to the repo and install.
```
cd sunset && yarn
```

You're good to go! Now type `yarn start` to start

# Licenses and acknowledgements
- [WebCAD5](https://github.com/hacklabcz/WebCAD5) (without this project, I would be stuck to my IGCSE-level mathematics level)
- [QroCAD](https://github.com/Qrodex/QroCAD) (the first iteration, but still maintained to this very day)
- [HugeIcons](https://hugeicons.com/) (its beautiful af)
- Licensed under UFOL (Unified, Free and Open License) 2.0. © 2024 Lookeeloo Ltd.
