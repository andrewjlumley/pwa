// Make sure server work is supported

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
        .register('sw.js')
        .then(reg => console.log('Service worker registered'))
        .catch(err => console.log(`The error is ${err}`));
    });
}

if ('Notification' in window) {
    window.addEventListener('load', () => {
        Notification.requestPermission()
        .then(reg => { 
            if (reg != 'granted')
                console.log('Notification permission not granted');
            else
                new Notification("Hello, and welcome")
        })
        .catch(err => console.log(`The error is ${err}`));
    });
}

async function SendAPI() {
    console.log('API triggered.');

    let package = {
        type: "fetch-sync-" + Math.random().toString(16).slice(2),
        url : "https://httpbin.org/anything",
        body: {
            "action": "createOrder",
            "reference": "TEST AJL 03/08/24 01"
        }
    };
    
    const registration = await navigator.serviceWorker.ready;
    registration.sync.register(JSON.stringify(package));
}

