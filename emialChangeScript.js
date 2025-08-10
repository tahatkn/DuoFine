const params = new URLSearchParams(window.location.search)
const uid = params.get('uid')
const token = params.get('token')
const new_email = params.get('new_email')



function getMobilePlatform(){
    const ua = navigator.userAgent

    if(/android/i.test(ua)){
        return "android"
    }

    if(/iPad|iPhone|iPod/.test(ua)){
        return "ios"
    }

    return "other"
}
function redirectToApp(){
    const platform = getMobilePlatform()

    window.location.href = "commonground://"

    setTimeout(() => {
        if(platform === "android"){
            window.location.href = "https://duofine.com"
        }else if(platform === "ios"){
            window.location.href = "https://duofine.com"
        }
    }, 1500)
}


if(!uid || !token){
    document.body.innerHTML = `<div class="status-container">
        <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h1>Invalid email change link.</h1>
    </div>`
}else{
    async function sendActivationData(){
        try{
            let response = await fetch('https://api.duofine.com/user/change_email/', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    uid: uid,
                    token: token,
                    new_email: new_email
                })
            })
            if(response.ok){
                document.body.innerHTML = `
                  <div class="status-container">
                    <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <h1>Email changed!</h1>
                    <h2>Redirecting to the app...</h2>
                    <button class="cta-button" onclick="window.location.href='commonground://'">Open App</button>
                  </div>
                `
                redirectToApp()
            }else{
                document.body.innerHTML = `<div class="status-container">
                                                <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                <h1>Email Change failed.</h1>
                                                <h2>Link may be invalid or expired. If the issue persists please contact support at duofine.tr@gmail.com</h2>
                                           </div>`
            }
            }catch(e){
                document.body.innerHTML = `<div class="status-container">
                    <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <h1>An error occurred.</h1>
                    <h2>Please try again.</h2>
                </div>`
            }
        }
    sendActivationData()
}