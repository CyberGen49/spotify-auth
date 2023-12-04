
const clientId = '9b3eebd608264757b9d4bd1f21311243';
const redirectUri = window.location.origin;
const availableScopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'app-remote-control',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-follow-modify',
    'user-follow-read',
    'user-read-playback-position',
    'user-top-read',
    'user-read-recently-played',
    'user-library-modify',
    'user-library-read',
    'user-read-email',
    'user-read-private',
    'user-soa-link',
    'user-soa-unlink',
    'user-manage-entitlements',
    'user-manage-partner',
    'user-create-partner'
];

const generatePKCECodeVerifier = () => {
    var array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    var codeVerifier = arrayToBase64Url(array);
    return codeVerifier;
}

const arrayToBase64Url = array => {
    return btoa(String.fromCharCode.apply(null, array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // Base64url encoding strips out any trailing '='s
}

const sha256 = text => {
    // returns promise ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    return window.crypto.subtle.digest('SHA-256', data);
}

const base64UrlEncode = a => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

const generatePKCECodeChallenge = async codeVerifier => {
    const hashed = await sha256(codeVerifier);
    return base64UrlEncode(hashed);
}

const elScopes = document.querySelector('#scopes');
const btnGo = document.querySelector('#go');
const elClient = document.querySelector('#client');
const elTokenAccess = document.querySelector('#tokenAccess');
const elTokenRefresh = document.querySelector('#tokenRefresh');
const btnCopyClient = document.querySelector('#copyClient');
const btnCopyAccess = document.querySelector('#copyAccess');
const btnCopyRefresh = document.querySelector('#copyRefresh');

window.addEventListener('load', async() => {
    for (const scope of availableScopes) {
        const el = document.createElement('label');
        el.innerHTML = `
            <input type="checkbox" name="scopes" value="${scope}" />
            ${scope}
        `;
        const checkbox = $('input', el);
        checkbox.addEventListener('change', () => {
            const scopes = [];
            for (const el of $$('input[name="scopes"]:checked')) {
                scopes.push(el.value);
            }
            window.history.replaceState({}, '', `${window.location.pathname}?${new URLSearchParams({ scopes: scopes.join(' ') })}`);
        });
        elScopes.appendChild(el);
    }
    elClient.innerText = `${clientId}`;
    const query = new URLSearchParams(window.location.search);
    if (query.get('code')) {
        const code = query.get('code');
        const url = `https://accounts.spotify.com/api/token`;
        const data = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: window.localStorage.getItem('code_verifier')
        });
        const res = await fetch(url, {
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if (!res.ok) {
            window.location.href = window.location.origin;
            return;
        }
        const json = await res.json();
        elTokenAccess.innerText = json.access_token;
        elTokenRefresh.innerText = json.refresh_token;
        // Re-select scopes
        const scopes = json.scope.split(' ');
        for (const scope of scopes) {
            const el = document.querySelector(`input[name="scopes"][value="${scope}"]`);
            if (el) {
                el.checked = true;
            }
        }
    }
    if (query.get('scopes')) {
        const scopes = query.get('scopes').split(' ');
        for (const scope of scopes) {
            const el = $(`input[name="scopes"][value="${scope}"]`);
            if (el) el.checked = true;
        }
    }
});

btnGo.addEventListener('click', async() => {
    const selectedScopes = [];
    for (const el of document.querySelectorAll('input[name="scopes"]:checked')) {
        selectedScopes.push(el.value);
    }
    const codeVerifier = generatePKCECodeVerifier();
    window.localStorage.setItem('code_verifier', codeVerifier);
    const codeChallenge = await generatePKCECodeChallenge(codeVerifier);
    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&code_challenge_method=S256&code_challenge=${codeChallenge}&scope=${selectedScopes.join(' ')}`;
    window.location.href = url;
});

btnCopyClient.addEventListener('click', () => {
    navigator.clipboard.writeText(clientId);
});
btnCopyAccess.addEventListener('click', () => {
    navigator.clipboard.writeText(elTokenAccess.innerText);
});
btnCopyRefresh.addEventListener('click', () => {
    navigator.clipboard.writeText(elTokenRefresh.innerText);
});