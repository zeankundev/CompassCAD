const Toast = document.getElementById('toast')
const ToastDetails = document.getElementById('toast-details')
const icon = document.getElementById('icon')

const GetType = (type) => {
    switch (type) {
        case 'failure':
            return 'ui-toast-error'
            break
        case 'success':
            return 'ui-toast-success'
            break
        default:
            return ''
            break
    }
}
const callToast = (message, type) => {
    if (type == null || type == '');
    else Toast.classList.add(GetType(type))
    console.log(`Added classtype ${GetType(type)}`)
    switch (GetType(type)) {
        case 'ui-toast-error':
            icon.setAttribute('src', './assets/images/failure.svg')
            break
        case 'ui-toast-success':
            icon.setAttribute('src', './assets/images/success.svg')
            break
        default:
            icon.setAttribute('src', './assets/images/help.svg')
            break
    }
    ToastDetails.innerHTML = message
    console.log(`Message is: ${message}`)
    Toast.style.display = 'flex'
    console.log('Set toast display to flex')
    setTimeout(() => {
        console.log('Toast dismissed')
        Toast.style.animation = 'ui-fall 1s ease forwards'
        console.log('Played animation')
        setTimeout(() => {
            Toast.style.display = 'none'
            console.log('Set toast display to none')
            Toast.style.animation = ''
            if (type == null || type == '');
            else Toast.classList.remove(GetType(type))
            console.log(`Removed class ${GetType(type)}`)
            message = ''
            console.log('Reset message variable')
            type = ''
            console.log('Reset type variable')
        }, 1000)
    }, 4000)
}