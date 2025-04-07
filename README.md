**This is the archived 1.x.x user interface and features. `main` will be done for the next 2.x.x CompassCAD releases, enrolling UI2.**
# CompassCAD
very good CAD software. plan out buildings, and show it off to your boss.

> [!WARNING]
> Snap-based CompassCAD will be discontinued due to an issue on WSL intterupting the distribution of CompassCAD snap files. Please proceed with downloading only either `*.appimage`, `*.deb` or `*.rpm` distribution files. (Update: as of now, CompassCAD is revitalized with a snap release at 1.6.1 and newer.)

> [!IMPORTANT]
> There aren't, and never will, releases of Mac builds because of impatience. Sourceforge data states that some of you use Macs to use CompassCAD although there are no official Mac builds yet. Another point to highlight why I wouldn't deploy to a Mac because I don't have a Mac machine (I don't want to dualboot my Kubuntu instance with Hackintosh). Signing programs for Mac (especially DMGs) require you to use a Mac just for signing!. Mac users won't be able to get official support for CompassCAD Desktop, however, Mac users will only get full support for CompassCAD Web. I will start building for Macs if you are patient.

[![compasscad](https://snapcraft.io/compasscad/badge.svg)](https://snapcraft.io/compasscad)

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/compasscad)

<a href="https://www.producthunt.com/posts/compasscad?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-compasscad" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=486001&theme=neutral" alt="CompassCAD - the&#0032;best&#0032;CAD&#0032;software&#0032;yet&#0032;known&#0032;to&#0032;mankind | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

# Stay up to date
- [Official CompassCAD X (formerly Twitter) blog](https://x.com/CompassCAD)
- [Official CompassCAD Discord Server](https://discord.gg/Qvw9afNs3e)

# Features
- Simple to use user interface (backed by community testing)
- ~~Tools and shortcuts are designed with [CTS](https://www.google.com/search?q=carpal+tunnel+syndrome) in mind~~ (not really lol)
- Seeps in less resource, CPU usage and less battery, so CompassCAD runs 87% faster than AutoCAD
- Transparent community
- Designed with less bloatware in mind and only integrating the core features
- Works with Windows and Linux (macOS, BSD or any unofficially supported platforms must use the [web version](https://zeankundev.github.io/CompassCAD/editor.html))
- Collaborate with up to 2 people (more member support will be added and fixed soon)

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
- Licensed under GNU General Public License 3 (GPL-3.0)
