const { shell } = require("electron")

const redirectToSomewhere = (url) => {
    shell.openExternal(url)
}