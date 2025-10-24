# CompassCAD in React
An official port of CompassCAD for TypeScript. Aims to replace the HTML5 version.

# Installation
You will need:
- Node >= v22
- npm
## Steps
- Clone this repository
```
git clone https://github.com/zeankundev/CompassCAD -b react ccad-react
```
- Enter the directory
```
cd ccad-react
```
- Install dependencies
```
npm i
```
- Start server and have fun!
```
npm start
```

## Other React-provided scripts
- `start`: Starts a local development server
- `build`: Generates a production-ready build
- `test`: Launches React's interactive tester
- `eject`: Removes build dependencies. **This is a one-way operation, so there is no going back. Consider your choices before running `npm run eject`**

# Notes
To use Blueprint, either on dev or deployed, you must create an `.env` file containing this:
```
REACT_APP_BLUEPRINT_API_KEY=<your Google AI Studio key>
```
If you haven't configured it yet, you should go to [Google AI Studio](https://aistudio.google.com) and get your API key. Don't worry, you don't need to train or configure anything in the studio; all training and system prompt is hardcoded into the code, so feel free to tweak that!

# Help
If you want to help CompassCAD on React, you can either:
- Open a new Issue.
- Start a pull request
- Or talk to us in our [Discord server](https://discord.gg/Qvw9afNs3e).