importScripts('js/utilities.js');

// https://medium.com/@a7ul/beginners-guide-to-web-push-notifications-using-service-workers-cb3474a17679
// https://www.youtube.com/watch?v=ksXwaWHCW6k

const cacheName = 'v1';

const cacheAssets = [
    'index.html',
    'about.html',
    '/js/main.js',
    'sw.js'
];

// Create 'Install' event on creation of service worker.
self.addEventListener('install', e => {
    console.log('Service worker installed.');

    // Lets force the caching of major files
    e.waitUntil(
        caches
            .open(cacheName)
            .then(cache => {
                console.log('Service worker caching files');
                cache.addAll(cacheAssets);
            })
            .then(() => self.skipWaiting())
    );
});

// Create 'Activate' event on awakening of service worker.
self.addEventListener('activate', async (e) => {
    console.log('Service worker activated.');
    
    // Remove unwanted caches
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== cacheName) {
                        console.log('Service worker clearing old cache');
                        return caches.delete(cache);
                    }
                })
            )
        })
    );

    // Lets subscribe for remote notifications
    try {
        const applicationServerKey = urlB64ToUint8Array(
            'BEkQr_98A7QLRZA5laJY12BkfvvGezj1N7tssavYWABBswy49JDqYdnF6zrZoMv4EjYZCEBOW8fOOaOz_2WR-IY'
        )
        const options = { applicationServerKey, userVisibleOnly: true }
        const subscription = await self.registration.pushManager.subscribe(options)
        
        // retrieve subscription details and pass to backend to trigger notifications
        console.log(JSON.stringify(subscription))
        console.log(subscription.endpoint);
        console.log(subscription.toJSON().keys.p256dh);
        console.log(subscription.toJSON().keys.auth);       
    } catch (err) {
        console.log('Error', err)
    } 
});

// Create 'Fetch' event to handle requests from browser.
// This should only handle GET!
self.addEventListener('fetch', e => {
    console.log('Service worker fetching');

    e.respondWith(
        fetch(e.request)
            .then(res => {
                // Make copy/clone of response
                const resClone = res.clone();
                // Open cache
                caches
                    .open(cacheName)
                    .then(cache => {
                        // Add response to cache
                        cache.put(e.request, resClone);
                    });
                return res;
            }).catch(err => caches.match(e.request).then(res => res))
    );
});

// Create 'Push' event to handle notifications and throw to browser
self.addEventListener('push', function(event) {
    if (event.data) {
        console.log(event.data.text());
        const title = "Something Has Happened";
        const message = event.data.text();
        self.registration.showNotification(title, { Body: message});
    } else {
      console.log('Push event but no data')
    }
});

// Create 'Message' event to handle PUT, POST and DELETE requests from browser
// We then regiser a sync request event to handle this.
const syncStore = {}         
self.addEventListener('message', event => {
    console.log("Message received: " + event.data);
    if(event.data.type === 'sync') {
      // get a unique id to save the data
      let id = "fetch-push-article-photo-sync-" + Math.random().toString(16).slice(2);
      syncStore[id] = event.data
      // register a sync and pass the id as tag for it to get the data
      self.registration.sync.register(id)
    }
    console.log(event.data)
});

// Create 'Sync' event to handle posts to external API. Data should contain
// Url and body.
self.addEventListener('sync', async (e) => {
    console.log(e.tag);

    let json = syncStore[e.tag];
    console.log(json);

    var blob = await fetch(json.body).then(res => res.blob());

    const formData = new FormData();
    formData.append('file', blob, 'filename.png');

    // Call fetch, ensuring Network credential are included
    let response = await fetch(json.url, {
        method: json.method,
        body: formData,
        mode: 'no-cors',
        credentials: 'include',
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
          'Authorization': 'Negotiate'
        },
    })
    .then(function(response) { 
        return response.text();
        //return response.json()
    })
    .catch(error => console.error('Error:', error));

    console.log("Fetch response: " + response);
    self.registration.showNotification("Submitted");
});
