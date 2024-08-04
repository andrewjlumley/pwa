importScripts('js/utilities.js');

const cacheName = 'v1';

/* const cacheAssets = [
    'index.html',
    'about.html',
    '/js/main.js',
    'sw.js'
]; */

// Call install event
self.addEventListener('install', e => {
    console.log('Service worker installed.');

 /*    e.waitUntil(
        caches
            .open(cacheName)
            .then(cache => {
                console.log('Service worker caching files');
                cache.addAll(cacheAssets);
            })
            .then(() => self.skipWaiting())
    ); */
});

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
    //
    try {
        const applicationServerKey = urlB64ToUint8Array(
            'BEkQr_98A7QLRZA5laJY12BkfvvGezj1N7tssavYWABBswy49JDqYdnF6zrZoMv4EjYZCEBOW8fOOaOz_2WR-IY'
        )
        const options = { applicationServerKey, userVisibleOnly: true }
        const subscription = await self.registration.pushManager.subscribe(options)
        console.log(JSON.stringify(subscription))
        console.log(subscription.endpoint);
        console.log(subscription.toJSON().keys.p256dh);
        console.log(subscription.toJSON().keys.auth);

        // give this information to the backend so it can send a message out
        
    } catch (err) {
        console.log('Error', err)
    }

    // https://medium.com/@a7ul/beginners-guide-to-web-push-notifications-using-service-workers-cb3474a17679
    
});




// Call fetch event
/* self.addEventListener('fetch', e => {
    console.log('Service worker fetching');
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
}); */

// https://www.youtube.com/watch?v=ksXwaWHCW6k

self.addEventListener('fetch', e => {
    console.log('Service worker fetching');
    console.log('Method: ' + e.request.method);


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

self.addEventListener('push', function(event) {
    if (event.data) {
        console.log(event.data.text());
        const title = "Something Has Happened";
        const message = event.data
        self.registration.showNotification(title, { Body: message});
    } else {
      console.log('Push event but no data')
    }
});

self.addEventListener('sync', async (e) => {
    console.log(e.tag);
    const receivedJsonTag = JSON.parse(e.tag);
    console.log(receivedJsonTag.body);    
    
    let response = await fetch(receivedJsonTag.url, {
        method: 'POST',
        body: JSON.stringify(receivedJsonTag.body),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        }
    })
    .then(function(response) { 
        return response.text();
        //return response.json()
    })
    .catch(error => console.error('Error:', error));

    console.log(response);
});
